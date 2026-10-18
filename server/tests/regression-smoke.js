import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {PrismaClient} from '@prisma/client';
import {UPLOAD_DIRECTORY} from '../src/utils/uploads.js';
const db=new PrismaClient(),base='http://localhost:4000/api',cookies={};const ids={users:[],cars:[],bookings:[],services:[],images:[],damages:[]};let checks=0;
async function call(url,{actor='admin',method='GET',body,expected=200,cookie}={}){const response=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(cookie||cookies[actor]?{Cookie:cookie||cookies[actor]}:{})},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json();assert.equal(response.status,expected,`${method} ${url}: ${JSON.stringify(data)}`);const c=response.headers.get('set-cookie');if(c)cookies[actor]=c.split(';')[0];checks++;return data;}
try{
 await call('/auth/login',{method:'POST',body:{email:'admin@rnrrentcar.uz',password:process.env.DEMO_ADMIN_PASSWORD}});
 const oldAdmin=cookies.admin;await call('/auth/logout',{method:'POST'});await call('/auth/me',{cookie:oldAdmin,expected:401});await call('/auth/login',{method:'POST',body:{email:'admin@rnrrentcar.uz',password:process.env.DEMO_ADMIN_PASSWORD}});
 await call('/cars',{method:'POST',body:{brand:' ',model:'QA',slug:'qa-empty',pricePerDay:30},expected:400});
 await call('/cars?year=bad',{expected:400});await call('/cars?page=0',{expected:400});await call('/cars?minPrice=100&maxPrice=20',{expected:400});await call('/cars?pickupDate=2030-02-30&returnDate=2030-03-05',{expected:400});
 const car=await call('/cars',{method:'POST',body:{brand:'RNR QA',model:'Проверочный автомобиль',slug:'qa-'+randomUUID(),pricePerDay:30,year:2024,drive:'AWD',seats:5,transmission:'Автомат'},expected:201});ids.cars.push(car.id);
 assert((await call('/cars?year=2024&drive=AWD')).cars.some(c=>c.id===car.id));assert(!(await call('/cars?year=2023&drive=AWD')).cars.some(c=>c.id===car.id));
 await call('/cars/'+car.id,{method:'PUT',body:{seats:-1},expected:400});await call('/cars/'+car.id,{method:'PUT',body:{fuelLevel:101},expected:400});await call('/cars/'+car.id,{method:'PUT',body:{pricePerDay:10.001},expected:400});
 const email='qa-session-'+randomUUID()+'@example.test';const customer=await call('/auth/register',{actor:'customer',method:'POST',body:{email,password:'QA-Password-2026',firstName:'Проверка',lastName:'Сессии'},expected:201});ids.users.push(customer.user.id);const sessionOne=cookies.customer;
 await call('/auth/login',{actor:'second',method:'POST',body:{email,password:'QA-Password-2026'}});const sessionTwo=cookies.second;
 await call('/auth/password',{actor:'customer',method:'POST',body:{currentPassword:'wrong',newPassword:'QA-Changed-2026'},expected:400});await call('/auth/password',{actor:'customer',method:'POST',body:{currentPassword:'QA-Password-2026',newPassword:'QA-Changed-2026'}});
 await call('/auth/me',{cookie:sessionOne,expected:401});await call('/auth/me',{cookie:sessionTwo,expected:401});await call('/auth/login',{actor:'customer',method:'POST',body:{email,password:'QA-Password-2026'},expected:401});await call('/auth/login',{actor:'customer',method:'POST',body:{email,password:'QA-Changed-2026'}});
 const day=new Date();day.setUTCDate(day.getUTCDate()+200);const str=offset=>new Date(+day+offset*86400000).toISOString().slice(0,10);
 const b=await call('/bookings',{actor:'customer',method:'POST',body:{carId:car.id,pickupDate:str(0),returnDate:str(2)},expected:201});ids.bookings.push(b.id);
 const next=await call('/bookings',{actor:'customer',method:'POST',body:{carId:car.id,pickupDate:str(4),returnDate:str(6)},expected:201});ids.bookings.push(next.id);
 await call('/bookings/'+b.id,{method:'PUT',body:{returnDate:str(5)},expected:409});const edited=await call('/bookings/'+b.id,{method:'PUT',body:{returnDate:str(3),managerNotes:'Проверка изменения'}});assert.equal(edited.totalPrice,90);
 await call('/bookings/'+b.id+'/status',{method:'PUT',body:{status:'CONFIRMED'}});await call('/bookings/'+b.id+'/handover',{method:'PUT',body:{mileage:100,fuelLevel:80,documentsChecked:true}});
 const extended=await call('/bookings/'+b.id,{method:'PUT',body:{returnDate:str(4)}});assert.equal(extended.totalPrice,120);await call('/bookings/'+b.id,{method:'PUT',body:{returnDate:str(5)},expected:409});
 await call('/bookings/'+b.id+'/return',{method:'PUT',body:{mileage:120,fuelLevel:60}});await call('/bookings/'+b.id,{method:'PUT',body:{returnDate:str(4)},expected:400});
 const notifications=await call('/notifications',{actor:'customer'});assert(notifications.some(n=>n.type==='BOOKING_EDIT'));assert(notifications.some(n=>n.title==='Аренда завершена'));
 await call('/cars/'+car.id+'/images',{method:'POST',body:{url:'/uploads/'+randomUUID()+'.webp'},expected:400});
 const upload=new FormData();upload.append('file',new Blob([fs.readFileSync('../client/public/media/cars/chevrolet-onix/main.webp')],{type:'image/webp'}),'real.webp');const result=await fetch(base+'/uploads',{method:'POST',headers:{Cookie:cookies.admin},body:upload});assert.equal(result.status,201);const uploaded=await result.json();ids.images.push(uploaded.url);
 const image=await call('/cars/'+car.id+'/images',{method:'POST',body:{url:uploaded.url,alt:'Проверочное фото'},expected:201});await call('/cars/'+car.id+'/images/'+image.id+'/main',{method:'PUT'});assert.equal((await call('/cars/'+car.slug)).images.filter(i=>i.isMain).length,1);
 const header=new FormData();header.append('file',new Blob([Buffer.from([137,80,78,71,13,10,26,10])],{type:'image/png'}),'fake.png');const invalid=await fetch(base+'/uploads',{method:'POST',headers:{Cookie:cookies.admin},body:header});assert.equal(invalid.status,400);assert((await invalid.json()).error);
 const damage=await call('/damages',{method:'POST',body:{carId:car.id,bookingId:b.id,description:'Учебная проверка осмотра',phase:'RETURN'},expected:201});ids.damages.push(damage.id);await call('/damages/'+damage.id,{method:'PUT',body:{status:'INVALID'},expected:400});await call('/damages/'+damage.id,{method:'PUT',body:{repairCost:25.50,status:'CLOSED'}});
 const service=await call('/services',{method:'POST',body:{name:'Проверочная услуга',price:4.50,isActive:false},expected:201});ids.services.push(service.id);assert(!(await call('/services')).some(s=>s.id===service.id));
 await call('/bookings/'+next.id+'/status',{method:'PUT',body:{status:'CANCELLED'}});
 await db.booking.update({where:{id:b.id},data:{status:'ACTIVE',pickupDate:new Date(Date.now()-2*86400000),returnDate:new Date(Date.now()-86400000)}});await db.car.update({where:{id:car.id},data:{status:'RENTED'}});
 await call('/bookings',{actor:'customer',method:'POST',body:{carId:car.id,pickupDate:str(10),returnDate:str(12)},expected:409});await call('/cars/'+car.id,{method:'DELETE',expected:409});
 assert(!(await call(`/cars?pickupDate=${str(10)}&returnDate=${str(12)}&limit=100`)).cars.some(c=>c.id===car.id));
 await db.booking.update({where:{id:b.id},data:{status:'COMPLETED'}});await db.car.update({where:{id:car.id},data:{status:'PREPARATION'}});
 await call('/cars/'+car.id,{method:'DELETE'});assert((await call('/cars/admin?archived=true')).some(c=>c.id===car.id));await call('/cars/'+car.slug,{expected:404});await call('/cars/'+car.id+'/restore',{method:'PUT'});assert.equal((await call('/cars/'+car.slug)).status,'PREPARATION');
 await call('/does-not-exist',{expected:404});const malformed=await fetch(base+'/contacts',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'});assert.equal(malformed.status,400);assert((await malformed.json()).error);
 console.log(`${checks} regression API checks passed: session revocation, password change, filter validation, editing/extensions/conflicts, notifications, real image validation, gallery, damage cost, inactive services, JSON errors.`);
}finally{
 const payments=await db.payment.findMany({where:{bookingId:{in:ids.bookings}}});
 await db.auditLog.deleteMany({where:{OR:[{entityId:{in:[...ids.users,...ids.cars,...ids.bookings,...ids.services,...ids.damages,...payments.map(p=>p.id)]}},{userId:{in:ids.users}}]}});
 await db.damageReport.deleteMany({where:{carId:{in:ids.cars}}});await db.review.deleteMany({where:{bookingId:{in:ids.bookings}}});await db.payment.deleteMany({where:{bookingId:{in:ids.bookings}}});await db.booking.deleteMany({where:{id:{in:ids.bookings}}});await db.car.deleteMany({where:{id:{in:ids.cars}}});await db.service.deleteMany({where:{id:{in:ids.services}}});await db.user.deleteMany({where:{id:{in:ids.users}}});for(const url of ids.images)fs.unlinkSync(path.join(UPLOAD_DIRECTORY,path.basename(url)));await db.$disconnect();
}
