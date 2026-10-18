import prisma from '../config/db.js';
import {text,moneyValue,enumValue,httpError} from '../utils/validation.js';
import {requireUpload} from '../utils/uploads.js';
const include={car:{select:{brand:true,model:true,licensePlate:true}}};
export const getDamages=async(req,res,next)=>{try{res.json(await prisma.damageReport.findMany({include,orderBy:{createdAt:'desc'}}));}catch(error){next(error);}};
export const createDamage=async(req,res,next)=>{
 try{
  const carId=text(req.body.carId,'автомобиль',{required:true}),description=text(req.body.description,'повреждение',{required:true,max:3000});
  const phase=enumValue(req.body.phase,['HANDOVER','RETURN','INSPECTION'],'фаза осмотра');
  const photos=req.body.photos||[];
  if(!Array.isArray(photos)||photos.length>20)throw httpError(400,'Не больше 20 фотографий осмотра');
  await Promise.all(photos.map(requireUpload));
  const car=await prisma.car.findUnique({where:{id:carId}});if(!car)throw httpError(404,'Автомобиль не найден');
  const bookingId=req.body.bookingId||null;
  if(bookingId){const booking=await prisma.booking.findUnique({where:{id:bookingId}});if(!booking||booking.carId!==carId)throw httpError(400,'Бронирование не относится к автомобилю');}
  const data={carId,bookingId,description,phase,photos};
  if(req.body.repairCost!==undefined)data.repairCost=moneyValue(req.body.repairCost,'стоимость ремонта');
  const damage=await prisma.$transaction(async db=>{const item=await db.damageReport.create({data,include});await db.auditLog.create({data:{userId:req.user.id,action:'CREATE',entity:'DamageReport',entityId:item.id}});return item;});res.status(201).json(damage);
 }catch(error){next(error);}
};
export const updateDamage=async(req,res,next)=>{
 try{
  const data={};
  if(req.body.status!==undefined)data.status=enumValue(req.body.status,['OPEN','REPAIRING','CLOSED'],'статус повреждения');
  if(req.body.repairCost!==undefined)data.repairCost=req.body.repairCost===null?null:moneyValue(req.body.repairCost,'стоимость ремонта');
  for(const key of ['description','responsible'])if(req.body[key]!==undefined)data[key]=text(req.body[key],key,{max:key==='description'?3000:200,nullable:true});
  if(!Object.keys(data).length)throw httpError(400,'Нет изменений');
  const item=await prisma.$transaction(async db=>{const updated=await db.damageReport.update({where:{id:req.params.id},data,include});await db.auditLog.create({data:{userId:req.user.id,action:'UPDATE',entity:'DamageReport',entityId:updated.id,details:data}});return updated;});res.json(item);
 }catch(error){next(error);}
};
