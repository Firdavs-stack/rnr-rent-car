import {USD_TO_UZS} from '../../../shared/currency.js';
import { UPLOAD_DIRECTORY, normalizeImage, requireUpload } from '../utils/uploads.js';
import { emailAddress, passwordValue, text, moneyValue, httpError } from '../utils/validation.js';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin, isManager } from '../middleware/rbac.js';
const router = Router();
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const bad = message => { const e = new Error(message); e.status = 400; throw e; };
router.post('/contacts', wrap(async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 100 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof message !== 'string' || message.trim().length < 10 || message.length > 5000 || (phone && (typeof phone !== 'string' || phone.length > 40))) bad('Проверьте имя, email и сообщение (от 10 до 5000 символов)');
  const item = await prisma.contactRequest.create({ data: { name: name.trim(), email: email.trim(), phone, message: message.trim() } });
  res.status(201).json({ id: item.id, status: item.status });
}));
router.get('/contacts', authenticate, isManager, wrap(async (req, res) => res.json(await prisma.contactRequest.findMany({ orderBy: { createdAt: 'desc' } }))));
router.put('/contacts/:id', authenticate, isManager, wrap(async (req, res) => {
  if (!['NEW', 'IN_PROGRESS', 'CLOSED'].includes(req.body.status)) bad('Некорректный статус');
  res.json(await prisma.contactRequest.update({ where: { id: req.params.id }, data: { status: req.body.status } }));
}));
router.get('/settings', wrap(async (req, res) => {
  const settings = await prisma.appSetting.findUnique({ where: { key: 'company' } });
  res.json({ ...(settings?.value || {}), exchangeRate: USD_TO_UZS });
}));
router.put('/settings', authenticate, isAdmin, wrap(async (req, res) => {
  const value = Object.fromEntries(['phone', 'email', 'hours', 'address'].map(key => [key, String(req.body[key] || '').slice(0, 200)]));
  await prisma.$transaction(async db=>{await db.appSetting.upsert({where:{key:'company'},update:{value},create:{key:'company',value}});await db.auditLog.create({data:{userId:req.user.id,action:'UPDATE',entity:'AppSetting',details:value}});});
  res.json(value);
}));
router.get('/cars/:slug/calendar', wrap(async(req,res)=>{
  const car=await prisma.car.findFirst({where:{slug:req.params.slug,isActive:true,deletedAt:null}});
  if(!car){const e=new Error('Автомобиль не найден');e.status=404;throw e;}
  const [bookings,maintenance]=await Promise.all([
    prisma.booking.findMany({where:{carId:car.id,status:{notIn:['CANCELLED','COMPLETED']},OR:[{returnDate:{gt:new Date()}},{status:{in:['ACTIVE','RETURNING','HANDED_OVER']}}]},select:{pickupDate:true,returnDate:true,status:true}}),
    prisma.maintenance.findMany({where:{carId:car.id,status:{not:'COMPLETED'}},select:{startAt:true,endAt:true}}),
  ]);
  res.json([...bookings.map(b=>({from:b.pickupDate,to:['ACTIVE','RETURNING','HANDED_OVER'].includes(b.status)&&b.returnDate<new Date()?new Date(Date.now()+366*86400000):b.returnDate})),...maintenance.map(m=>({from:m.startAt,to:m.endAt||new Date(Date.now()+365*86400000)}))]);
}));
router.get('/favorites' , authenticate, wrap(async (req, res) => {
  const items = await prisma.favorite.findMany({ where: { userId: req.user.id, car: { isActive: true, deletedAt: null } }, include: { car: { include: { images: { where: { isMain: true } } } } } });
  res.json(items.map(item => item.car));
}));
router.put('/favorites/:carId', authenticate, wrap(async (req, res) => {
  const car = await prisma.car.findFirst({ where: { id: req.params.carId, isActive: true, deletedAt: null } });
  if (!car) bad('Автомобиль недоступен');
  const where = { userId_carId: { userId: req.user.id, carId: car.id } };
  await prisma.favorite.upsert({ where, update: {}, create: { userId: req.user.id, carId: car.id } });
  res.json({ saved: true });
}));
router.delete('/favorites/:carId', authenticate, wrap(async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.user.id, carId: req.params.carId } });
  res.json({ saved: false });
}));
router.get('/audit/:entityId', authenticate, isManager, wrap(async (req, res) => res.json(await prisma.auditLog.findMany({ where: { entityId: req.params.entityId }, orderBy: { createdAt: 'desc' } }))));
router.get('/staff/users', authenticate, isAdmin, wrap(async (req,res)=>{
  res.json(await prisma.user.findMany({where:{deletedAt:null},select:{id:true,email:true,firstName:true,lastName:true,role:true,isActive:true},orderBy:{createdAt:'desc'}}));
}));
router.post('/staff', authenticate, isAdmin, wrap(async(req,res)=>{
  const email=emailAddress(req.body.email),password=passwordValue(req.body.password);
  const firstName=text(req.body.firstName,'имя',{required:true,max:100}),lastName=text(req.body.lastName,'фамилию',{required:true,max:100}),role=req.body.role;
  if(!['ADMIN','MANAGER'].includes(role))bad('Выберите роль сотрудника');
  const hash=await bcrypt.hash(password,12);
  const user=await prisma.$transaction(async db=>{const user=await db.user.create({data:{email,password:hash,firstName,lastName,role},select:{id:true,email:true,firstName:true,lastName:true,role:true,isActive:true}});await db.auditLog.create({data:{userId:req.user.id,action:'CREATE',entity:'User',entityId:user.id}});return user;});
  res.status(201).json(user);
}));
router.put('/staff/:id' , authenticate, isAdmin, wrap(async (req, res) => {
  if (!['ADMIN', 'MANAGER', 'CUSTOMER'].includes(req.body.role) || typeof req.body.isActive !== 'boolean') bad('Некорректная роль');
  if (req.params.id === req.user.id && (req.body.role !== 'ADMIN' || !req.body.isActive)) bad('Нельзя отключить собственный доступ');
  const user=await prisma.$transaction(async db=>{const user=await db.user.update({where:{id:req.params.id},data:{role:req.body.role,isActive:req.body.isActive},select:{id:true,email:true,role:true,isActive:true}});await db.authSession.deleteMany({where:{userId:user.id}});await db.auditLog.create({data:{userId:req.user.id,action:'ROLE',entity:'User',entityId:user.id,details:user}});return user;});
  res.json(user);
}));
router.put('/payments/:id/status', authenticate, isManager, wrap(async(req,res)=>{
 const current=await prisma.payment.findUnique({where:{id:req.params.id}});
 if(!current){const e=new Error('Платёж не найден');e.status=404;throw e;}
 const allowed={PENDING:['PAID'],DEPOSIT:['REFUNDED'],PAID:['REFUNDED']};
 if(!(allowed[current.status]||[]).includes(req.body.status))bad('Недопустимый переход статуса платежа');
 const payment=await prisma.$transaction(async db=>{
  const result=await db.payment.updateMany({where:{id:current.id,status:current.status},data:{status:req.body.status}});
  if(!result.count){const e=new Error('Статус уже изменился');e.status=409;throw e;}
  await db.auditLog.create({data:{userId:req.user.id,action:'PAYMENT_STATUS',entity:'Payment',entityId:current.id,details:{from:current.status,to:req.body.status}}});
  return db.payment.findUnique({where:{id:current.id}});
 });res.json(payment);
}));
router.put('/services/:id' , authenticate, isAdmin, wrap(async (req, res) => {
  const { name, description, price, isActive } = req.body;
  text(name,'название услуги',{required:true,max:200});text(description,'описание',{max:3000});moneyValue(price,'цену услуги');
  if(isActive!==undefined&&typeof isActive!=='boolean')bad('Некорректная активность услуги');
  const service=await prisma.$transaction(async db=>{const item=await db.service.update({where:{id:req.params.id},data:{name,description,price,isActive}});await db.auditLog.create({data:{userId:req.user.id,action:'UPDATE',entity:'Service',entityId:item.id,details:{name,price,isActive}}});return item;});res.json(service);
}));
const folder = UPLOAD_DIRECTORY; fs.mkdirSync(folder, { recursive: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 2, parts: 3 } });
router.post('/uploads', authenticate, isManager, upload.single('file'), wrap(async (req, res) => {
  const file = req.file;
  if (!file) bad('Выберите изображение');
  const normalized = await normalizeImage(file.buffer);
  const filename = randomUUID() + '.webp';
  await fs.promises.writeFile(path.join(folder, filename), normalized, { flag: 'wx' });
  res.status(201).json({ url: '/uploads/' + filename });
}));
router.post('/cars/:id/images', authenticate, isManager, wrap(async (req, res) => {
  const { url, frameNum, type } = req.body;
  if (typeof url !== 'string' || !/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(url)) bad('Сначала загрузите изображение');
  await requireUpload(url);
  const item = await prisma.$transaction(async db => {
    await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${req.params.id} FOR UPDATE`;
    const car=await db.car.findFirst({where:{id:req.params.id,deletedAt:null}});
    if(!car)throw httpError(404,'Автомобиль не найден');
    if (type === '360') {
      if (!Number.isInteger(frameNum) || frameNum < 1 || frameNum > 360) bad('Номер кадра от 1 до 360');
      return db.car360Frame.upsert({ where: { carId_frameNum: { carId: req.params.id, frameNum } }, update: { url }, create: { carId: req.params.id, frameNum, url } });
    }
    const existing=await db.carImage.findUnique({where:{carId_url:{carId:car.id,url}}});
    if(existing)return existing;
    const [main,last]=await Promise.all([db.carImage.findFirst({where:{carId:car.id,isMain:true}}),db.carImage.findFirst({where:{carId:car.id},orderBy:{sortOrder:'desc'}})]);
    return db.carImage.create({data:{carId:car.id,url,alt:text(req.body.alt||'Фотография автомобиля','описание',{max:200}),isMain:!main,sortOrder:(last?.sortOrder??-1)+1}});
  });
  res.status(201).json(item);
}));
router.delete('/cars/:id/images/:imageId', authenticate, isManager, wrap(async (req, res) => {
  await prisma.$transaction(async db => {
    await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${req.params.id} FOR UPDATE`;
    await db.carImage.deleteMany({ where: { id: req.params.imageId, carId: req.params.id } });
    const retained = await db.carImage.findFirst({where:{carId:req.params.id,isMain:true}});
    const first = retained || await db.carImage.findFirst({ where: { carId: req.params.id }, orderBy: { sortOrder: 'asc' } });
    await db.carImage.updateMany({where:{carId:req.params.id},data:{isMain:false}});
    if (first) await db.carImage.update({ where: { id: first.id }, data: { isMain: true } });
  }); res.json({ deleted: true });
}));
router.put('/cars/:id/images/:imageId/main', authenticate, isManager, wrap(async(req,res)=>{
  const image=await prisma.$transaction(async db=>{
    await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${req.params.id} FOR UPDATE`;
    const image=await db.carImage.findFirst({where:{id:req.params.imageId,carId:req.params.id}});
    if(!image)throw httpError(404,'Фотография не найдена');
    await db.carImage.updateMany({where:{carId:req.params.id},data:{isMain:false}});
    const result=await db.carImage.update({where:{id:image.id},data:{isMain:true}});
    await db.auditLog.create({data:{userId:req.user.id,action:'MAIN_IMAGE',entity:'Car',entityId:req.params.id,details:{imageId:image.id}}});return result;
  });res.json(image);
}));
router.delete('/cars/:id/frames/:frameId', authenticate, isManager, wrap(async(req,res)=>{
  await prisma.car360Frame.deleteMany({where:{carId:req.params.id,id:req.params.frameId}});res.json({deleted:true});
}));
export default router;
