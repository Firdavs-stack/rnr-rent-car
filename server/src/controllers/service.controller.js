import prisma from '../config/db.js';
import {text,moneyValue,httpError} from '../utils/validation.js';
export const getServices=async(req,res,next)=>{try{res.json(await prisma.service.findMany({where:{isActive:true},orderBy:{name:'asc'}}));}catch(error){next(error);}};
export const getAllServices=async(req,res,next)=>{try{res.json(await prisma.service.findMany({orderBy:{createdAt:'desc'}}));}catch(error){next(error);}};
export const createService=async(req,res,next)=>{try{
 const name=text(req.body.name,'название услуги',{required:true,max:200}),description=text(req.body.description,'описание',{max:3000}),price=moneyValue(req.body.price,'цену услуги');
 const isActive=req.body.isActive??true;if(typeof isActive!=='boolean')throw httpError(400,'Некорректная активность услуги');
 const service=await prisma.$transaction(async db=>{const item=await db.service.create({data:{name,description,price,isActive,currency:'USD'}});await db.auditLog.create({data:{userId:req.user.id,action:'CREATE',entity:'Service',entityId:item.id}});return item;});res.status(201).json(service);
}catch(error){next(error);}};
