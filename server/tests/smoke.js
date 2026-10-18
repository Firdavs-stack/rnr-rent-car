import 'dotenv/config';
import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
const prisma=new PrismaClient(),base='http://localhost:4000/api',cookies={};let checks=0,booking,qaEmail;
async function call(path,{actor,method='GET',body,expected=200}={}){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookies[actor]?{Cookie:cookies[actor]}:{})},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(d)}`);const c=r.headers.get('set-cookie');if(c&&actor)cookies[actor]=c.split(';')[0];checks++;return d;}
try{
 await call('/health');const fleet=await call('/cars?limit=100');assert.equal(fleet.total,15);assert.equal(fleet.cars.find(c=>c.slug==='byd-chazor-champion').pricePerDay,45);
 const filtered=await call('/cars?maxPrice=45&category=Комфорт');assert(filtered.cars.every(c=>c.pricePerDay<=45&&c.category==='Комфорт'));
 for(const actor of ['admin','manager'])await call('/auth/login',{actor,method:'POST',body:{email:`${actor}@rnrrentcar.uz`,password:process.env[`DEMO_${actor.toUpperCase()}_PASSWORD`]}});
 qaEmail=`qa-${Date.now()}@example.test`;await call('/auth/register',{actor:'customer',method:'POST',body:{email:qaEmail,password:'SmokePass-2026',firstName:'Проверка',lastName:'Сценария'},expected:201});
 await call('/cars/admin',{actor:'customer',expected:403});await call('/settings',{actor:'manager',method:'PUT',body:{phone:'demo'},expected:403});await call('/auth/register',{method:'POST',body:{email:'bad',password:'x',firstName:'a',lastName:'b'},expected:400});
 const car=fleet.cars.find(c=>c.slug==='chevrolet-onix');const start=new Date();start.setUTCDate(start.getUTCDate()+90);const end=new Date(+start+2*86400000);
 const body={carId:car.id,pickupDate:start.toISOString().slice(0,10),returnDate:end.toISOString().slice(0,10),pickupTime:'10:00',returnTime:'10:00',selectedServices:[]};
 const requests=await Promise.all([1,2].map(()=>fetch(base+'/bookings',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookies.customer},body:JSON.stringify(body)})));
 assert.deepEqual(requests.map(r=>r.status).sort(),[201,409]);checks+=2;booking=await requests.find(r=>r.status===201).json();assert.equal(booking.totalPrice,60);assert(!booking.user.password);
 await call('/auth/login',{actor:'other',method:'POST',body:{email:'aziza@example.test',password:process.env.DEMO_CUSTOMER_PASSWORD}});await call('/bookings/'+booking.id,{actor:'other',expected:403});
 await call('/bookings/'+booking.id+'/status',{actor:'manager',method:'PUT',body:{status:'CONFIRMED'}});await call('/bookings/'+booking.id+'/status',{actor:'manager',method:'PUT',body:{status:'COMPLETED'},expected:400});
 await call('/bookings/'+booking.id+'/handover',{actor:'manager',method:'PUT',body:{mileage:100,fuelLevel:80,documentsChecked:true,photos:[]}});assert.equal((await call('/cars/'+car.slug)).status,'RENTED');
 await call('/bookings/'+booking.id+'/return',{actor:'manager',method:'PUT',body:{mileage:90,fuelLevel:50},expected:400});await call('/bookings/'+booking.id+'/return',{actor:'manager',method:'PUT',body:{mileage:150,fuelLevel:50,extraCharges:10,damageDescription:'Учебная проверка повреждения'}});assert.equal((await call('/cars/'+car.slug)).status,'PREPARATION');
 await call('/cars/'+car.id,{actor:'manager',method:'PUT',body:{status:'AVAILABLE',mileage:0}});
 await call('/favorites/'+car.id,{actor:'customer',method:'PUT'});assert.equal((await call('/favorites',{actor:'customer'})).length,1);await call('/favorites/'+car.id,{actor:'customer',method:'DELETE'});
 await call('/contacts',{method:'POST',body:{name:'Проверка',email:'qa@example.test',message:'Проверка сохранения обращения'},expected:201});await call('/contacts',{method:'POST',body:{name:'',email:'bad',message:'x'},expected:400});
 assert((await call('/audit/'+booking.id,{actor:'manager'})).length>=4);assert((await call('/users/customers',{actor:'manager'})).every(u=>!('password'in u)));
 console.log(`${checks} API checks passed: database, auth, permissions, pricing, concurrent booking, handover, return, favorites, contacts, audit.`);
}finally{
 if(booking){await prisma.damageReport.deleteMany({where:{bookingId:booking.id}});await prisma.payment.deleteMany({where:{bookingId:booking.id}});await prisma.auditLog.deleteMany({where:{entityId:booking.id}});await prisma.booking.delete({where:{id:booking.id}});await prisma.car.update({where:{id:booking.carId},data:{status:'AVAILABLE',mileage:0}});}
 if(qaEmail){const user=await prisma.user.findUnique({where:{email:qaEmail}});if(user){await prisma.auditLog.deleteMany({where:{userId:user.id}});await prisma.user.delete({where:{id:user.id}});}}
 await prisma.contactRequest.deleteMany({where:{email:'qa@example.test',message:'Проверка сохранения обращения'}});await prisma.$disconnect();
}
