import 'dotenv/config';
import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
const p=new PrismaClient(),base='http://localhost:4000/api';let cookie,booking,maintenance,staff;
async function call(path,method='GET',body,expected=200){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});const data=await r.json();assert.equal(r.status,expected,JSON.stringify(data));if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return data;}
try{
 await call('/auth/login','POST',{email:'admin@rnrrentcar.uz',password:process.env.DEMO_ADMIN_PASSWORD});
 const car=(await call('/cars?search=Onix')).cars[0],service=(await call('/services')).find(s=>s.price===5);
 const date=new Date();date.setUTCDate(date.getUTCDate()+160);const start=date.toISOString().slice(0,10),end=new Date(+date+2*86400000).toISOString().slice(0,10);
 const data={carId:car.id,pickupDate:start,returnDate:end,pickupTime:'10:00',returnTime:'10:00'};
 await call('/bookings','POST',{...data,selectedServices:[{id:'missing',price:-1000}]},400);
 booking=await call('/bookings','POST',{...data,selectedServices:[{id:service.id,price:-1000}]},201);assert.equal(booking.totalPrice,70);
 await call('/maintenance','POST',{carId:car.id,type:'ТО',cost:0,startAt:`${start}T10:00:00+05:00`,endAt:`${end}T10:00:00+05:00`},409);
 await call('/cars/'+car.id,'DELETE',undefined,409);
 const mStart=new Date(+date+5*86400000),mEnd=new Date(+date+7*86400000);
 maintenance=await call('/maintenance','POST',{carId:car.id,type:'QA ТО',cost:15,startAt:mStart.toISOString(),endAt:mEnd.toISOString()},201);
 const blocked=await call('/cars/availability','POST',{carId:car.id,pickupDate:mStart.toISOString().slice(0,10),returnDate:mEnd.toISOString().slice(0,10)});assert.equal(blocked.available,false);
 await call('/maintenance/'+maintenance.id+'/complete','PUT');
 const calendar=await call('/cars/'+car.slug+'/calendar');assert(calendar.some(x=>new Date(x.from).toISOString()===booking.pickupDate));assert(calendar.every(x=>!x.userId));
 const payment=await call('/payments','POST',{bookingId:booking.id,amount:200,type:'DEPOSIT',status:'DEPOSIT'},201);await call('/payments/'+payment.id+'/status','PUT',{status:'REFUNDED'});await call('/payments/'+payment.id+'/status','PUT',{status:'PAID'},400);
 staff=await call('/staff','POST',{email:`qa-manager-${Date.now()}@example.test`,firstName:'Проверка',lastName:'Роли',password:'QA-Password-2026',role:'MANAGER'},201);assert(!staff.password);await call('/staff/'+staff.id,'PUT',{role:'CUSTOMER',isActive:false});
 const badFile=await fetch(base+'/uploads',{method:'POST',headers:{Cookie:cookie},body:(()=>{const f=new FormData();f.append('file',new Blob(['<script>bad</script>'],{type:'image/png'}),'bad.png');return f;})()});assert.equal(badFile.status,400);
 console.log('Operations checks passed: server-priced services, maintenance conflict and availability, archive protection, private calendar, deposit refund, staff roles, spoofed upload rejection.');
}finally{
 if(booking){const payments=await p.payment.findMany({where:{bookingId:booking.id}});await p.auditLog.deleteMany({where:{entityId:{in:[booking.id,...payments.map(x=>x.id)]}}});await p.payment.deleteMany({where:{bookingId:booking.id}});await p.booking.delete({where:{id:booking.id}});}
 if(maintenance){await p.auditLog.deleteMany({where:{entityId:maintenance.id}});await p.maintenance.delete({where:{id:maintenance.id}});}
 if(staff){await p.auditLog.deleteMany({where:{entityId:staff.id}});await p.user.delete({where:{id:staff.id}});}await p.$disconnect();
}
