import {httpError} from '../utils/validation.js';
import prisma from '../config/db.js';
import {checkAvailability} from '../utils/availability.js';
export const getMaintenances=async(req,res,next)=>{try{res.json(await prisma.maintenance.findMany({include:{car:{select:{brand:true,model:true,licensePlate:true}}},orderBy:{startAt:'desc'}}));}catch(e){next(e);}};
export const createMaintenance=async(req,res,next)=>{try{
 const {carId,type,description,cost}=req.body;const startAt=new Date(req.body.startAt),endAt=new Date(req.body.endAt);
 if(!carId||typeof type!=='string'||!type.trim()||!Number.isFinite(+startAt)||!Number.isFinite(+endAt)||endAt<=startAt||!Number.isFinite(cost)||cost<0)return res.status(400).json({error:'Проверьте автомобиль, период и стоимость'});
 const item=await prisma.$transaction(async db=>{
  await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${carId} FOR UPDATE`;
  const car=await db.car.findFirst({where:{id:carId,isActive:true,deletedAt:null}});if(!car)throw httpError(404,'Автомобиль не найден');
  if(car.status==='RENTED'&&startAt<=new Date())throw httpError(409,'Сначала оформите возврат автомобиля');
  if(!await checkAvailability(carId,startAt,endAt,null,db)){const e=new Error('Период пересекается с бронированием или обслуживанием');e.status=409;throw e;}
  const item=await db.maintenance.create({data:{carId,type,description,cost,startAt,endAt}});
  if(startAt<=new Date())await db.car.update({where:{id:carId},data:{status:'MAINTENANCE'}});
  await db.auditLog.create({data:{userId:req.user.id,action:'CREATE',entity:'Maintenance',entityId:item.id}});return item;
 });res.status(201).json(item);
}catch(e){next(e);}};
export const completeMaintenance=async(req,res,next)=>{try{const item=await prisma.$transaction(async db=>{
 const current=await db.maintenance.findUnique({where:{id:req.params.id}});if(!current){const e=new Error('Запись не найдена');e.status=404;throw e;}
 await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${current.carId} FOR UPDATE`;
 await db.$queryRaw`SELECT id FROM "Maintenance" WHERE id = ${current.id} FOR UPDATE`;
 const fresh=await db.maintenance.findUnique({where:{id:current.id}});if(fresh.status==='COMPLETED')throw httpError(409,'Обслуживание уже завершено');
 const item=await db.maintenance.update({where:{id:current.id},data:{status:'COMPLETED',endAt:new Date()}});
 const others=await db.maintenance.count({where:{carId:item.carId,id:{not:item.id},status:{not:'COMPLETED'},startAt:{lte:new Date()},OR:[{endAt:null},{endAt:{gt:new Date()}}]}});
 if(!others)await db.car.updateMany({where:{id:item.carId,status:'MAINTENANCE'},data:{status:'PREPARATION'}});
 await db.auditLog.create({data:{userId:req.user.id,action:'COMPLETE',entity:'Maintenance',entityId:item.id}});return item;
});res.json(item);}catch(e){next(e);}};
