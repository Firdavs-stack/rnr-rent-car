import { carQuery, CAR_STATUSES, UNBOOKABLE_STATUSES } from '../utils/car-query.js';
import { httpError, text, numberValue, moneyValue, enumValue } from '../utils/validation.js';
import { rentalPeriod } from '../../../shared/dates.js';
import prisma from '../config/db.js';
import { checkAvailability } from '../utils/availability.js';

export const getCars = async (req, res, next) => {
  try {
    const {where,page,perPage,orderBy}=carQuery(req.query);
    const [total,cars]=await prisma.$transaction([
      prisma.car.count({where}),
      prisma.car.findMany({where,orderBy,skip:(page-1)*perPage,take:perPage,include:{images:{where:{isMain:true},take:1}}}),
    ],{isolationLevel:'RepeatableRead'});
    res.json({cars,total,page,pages:Math.ceil(total/perPage)});
  }catch(error){next(error);}
};

export const getCarBySlug = async (req, res) => {
  try {
    const car = await prisma.car.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: { orderBy: [{isMain:'desc'},{sortOrder:'asc'}] },
        videos: { orderBy: { sortOrder: 'asc' } },
        frames360: { orderBy: { frameNum: 'asc' } },
      },
    });

    if (!car || !car.isActive || car.deletedAt) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }

    res.json(car);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения автомобиля' });
  }
};

export const checkCarAvailability = async (req,res,next)=>{
  try {
    let period;try{period=rentalPeriod(req.body,{future:true});}catch(error){throw httpError(400,error.message);}
    const carId=text(req.body.carId,'автомобиль',{required:true});
    const car=await prisma.car.findFirst({where:{id:carId,isActive:true,deletedAt:null}});
    res.json({available:!!car&&!UNBOOKABLE_STATUSES.includes(car.status)&&await checkAvailability(carId,period.start,period.end)});
  }catch(error){next(error);}
};
export const createCar = async (req,res,next)=>{
  try {
    const data=carData(req.body,true);
    if(data.status==='RENTED')throw httpError(400,'Статус аренды устанавливается при выдаче');
    const car=await prisma.$transaction(async db=>{
      const created=await db.car.create({data});
      await db.auditLog.create({data:{userId:req.user.id,action:'CREATE',entity:'Car',entityId:created.id}});
      return created;
    });res.status(201).json(car);
  }catch(error){next(error);}
};

export const updateCar = async (req, res, next) => {
  try {
    const data=carData(req.body);
    const car=await prisma.$transaction(async db=>{
      await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${req.params.id} FOR UPDATE`;
      const current=await db.car.findUnique({where:{id:req.params.id}});
      if(!current){const e=new Error('Автомобиль не найден');e.status=404;throw e;}
      if(data.status && data.status!==current.status){
        const active=await db.booking.count({where:{carId:current.id,status:{in:['ACTIVE','RETURNING','HANDED_OVER']}}});
        if(active || data.status==='RENTED'){const e=new Error('Статус аренды меняется через выдачу и возврат');e.status=409;throw e;}
      }
      const updated=await db.car.update({where:{id:current.id},data});
      await db.auditLog.create({data:{userId:req.user.id,action:'UPDATE',entity:'Car',entityId:updated.id,details:data}});
      return updated;
    });res.json(car);
  }catch(e){next(e);}
};
export const deleteCar = async (req,res,next)=>{
 try{
  await prisma.$transaction(async db=>{
    await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${req.params.id} FOR UPDATE`;
    const count=await db.booking.count({where:{carId:req.params.id,status:{notIn:['CANCELLED','COMPLETED']},OR:[{returnDate:{gt:new Date()}},{status:{in:['ACTIVE','RETURNING','HANDED_OVER']}}]}});
    if(count){const e=new Error('Сначала завершите или отмените открытые бронирования автомобиля');e.status=409;throw e;}
    await db.car.update({where:{id:req.params.id},data:{deletedAt:new Date(),isActive:false}});
    await db.auditLog.create({data:{userId:req.user.id,action:'ARCHIVE',entity:'Car',entityId:req.params.id}});
  });res.json({message:'Автомобиль архивирован'});
 }catch(e){next(e);}
};

export const getAllCarsAdmin = async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: req.query.archived==='true'?{deletedAt:{not:null}}:{deletedAt:null},
      include: {
        images: { where: { isMain: true }, take: 1 },
        bookings: { where: { status: { in: ['ACTIVE', 'HANDED_OVER'] } }, take: 1, include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения автомобилей' });
  }
};

export const getFleetStats = async (req, res) => {
  try {
    const total = await prisma.car.count({ where: { deletedAt: null, isActive: true } });
    const byStatus = await prisma.car.groupBy({ by: ['status'], where: { deletedAt: null, isActive: true }, _count: true });
    const stats = {};
    byStatus.forEach((g) => { stats[g.status] = g._count; });
    res.json({ total, byStatus: stats });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка статистики' });
  }
};
export function carData(body, creating=false) {
  const data={};
  for(const key of ['brand','model','slug','bodyType','category','color','engineType','fuelType','transmission','drive','description','shortDesc','licensePlate']) {
    if(body[key]!==undefined||creating&&['brand','model','slug'].includes(key))data[key]=text(body[key],key,{required:creating&&['brand','model','slug'].includes(key),max:key==='description'?5000:200,nullable:!['brand','model','slug'].includes(key)});
  }
  for(const key of ['brand','model','slug'])if(data[key]!==undefined&&!data[key])throw httpError(400,`Укажите ${key}`);
  if(data.slug&&!/^[a-z0-9-]+$/.test(data.slug))throw httpError(400,'Адрес страницы: латинские буквы, цифры и дефисы');
  if(body.pricePerDay!==undefined||creating)data.pricePerDay=moneyValue(body.pricePerDay,'цену за сутки',{allowZero:false});
  if(body.status!==undefined)data.status=enumValue(body.status,CAR_STATUSES,'статус');
  if(body.features!==undefined){if(!Array.isArray(body.features)||body.features.length>100)throw httpError(400,'Не больше 100 пунктов комплектации');data.features=body.features.map(value=>text(value,'комплектацию',{required:true,max:200}));}
  for(const [key,min,max,nullable] of [['year',1900,2100,true],['seats',1,20,true],['mileage',0,10000000,false],['fuelLevel',0,100,true]])if(body[key]!==undefined)data[key]=numberValue(body[key],key,{min,max,integer:true,nullable});
  return data;
}

export const restoreCar=async(req,res,next)=>{
 try{
  const car=await prisma.$transaction(async db=>{
   await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${req.params.id} FOR UPDATE`;
   const current=await db.car.findUnique({where:{id:req.params.id}});
   if(!current)throw httpError(404,'Автомобиль не найден');
   if(!current.deletedAt)throw httpError(409,'Автомобиль уже в активном автопарке');
   const car=await db.car.update({where:{id:current.id},data:{deletedAt:null,isActive:true,status:['MAINTENANCE','DAMAGED','UNAVAILABLE'].includes(current.status)?current.status:'PREPARATION'}});
   await db.auditLog.create({data:{userId:req.user.id,action:'RESTORE',entity:'Car',entityId:car.id}});return car;
  });res.json(car);
 }catch(error){next(error);}
};
