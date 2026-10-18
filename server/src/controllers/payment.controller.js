import prisma from '../config/db.js';
import {text,moneyValue,enumValue,httpError} from '../utils/validation.js';
export const getPayments=async(req,res,next)=>{try{res.json(await prisma.payment.findMany({include:{booking:{include:{car:{select:{brand:true,model:true}},user:{select:{firstName:true,lastName:true}}}}},orderBy:{createdAt:'desc'}}));}catch(error){next(error);}};
export const createPayment=async(req,res,next)=>{
 try{
  const bookingId=text(req.body.bookingId,'бронирование',{required:true}),amount=moneyValue(req.body.amount,'сумму платежа',{allowZero:false});
  const type=enumValue(req.body.type,['RENTAL','DEPOSIT','EXTRA'],'тип платежа'),status=enumValue(req.body.status,['PAID','PENDING','DEPOSIT','REFUNDED','FINE'],'статус платежа');
  const description=text(req.body.description,'описание',{max:2000});
  if(status==='DEPOSIT'&&type!=='DEPOSIT')throw httpError(400,'Статус залога подходит только записи типа «Залог»');
  const payment=await prisma.$transaction(async db=>{if(!await db.booking.findUnique({where:{id:bookingId}}))throw httpError(404,'Бронирование не найдено');const item=await db.payment.create({data:{bookingId,amount,type,status,description,currency:'USD'}});await db.auditLog.create({data:{userId:req.user.id,action:'CREATE',entity:'Payment',entityId:item.id,details:{amount,type,status}}});return item;});res.status(201).json(payment);
 }catch(error){next(error);}
};
