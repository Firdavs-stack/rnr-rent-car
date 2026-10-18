import dotenv from 'dotenv';
import {chromium} from 'playwright';
import {PrismaClient} from '@prisma/client';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {UPLOAD_DIRECTORY} from '../src/utils/uploads.js';
dotenv.config({path:'server/.env'});
const db=new PrismaClient(),base='http://localhost:4000/api',cookies={};let user,car,booking;const uploads=[];
async function api(url,method='GET',body,actor='admin'){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(cookies[actor]?{Cookie:cookies[actor]}:{})},body:body?JSON.stringify(body):undefined});const d=await r.json();assert(r.ok,JSON.stringify(d));const c=r.headers.get('set-cookie');if(c)cookies[actor]=c.split(';')[0];return d;}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const email='qa-browser-'+randomUUID()+'@example.test';
try{
 await api('/auth/login','POST',{email:'admin@rnrrentcar.uz',password:process.env.DEMO_ADMIN_PASSWORD});
 user=(await api('/auth/register','POST',{email,password:'QA-Password-2026',firstName:'Проверка',lastName:'Интерфейса'},'customer')).user;
 car=await api('/cars','POST',{brand:'Chevrolet',model:'Onix — проверка интерфейса',slug:'qa-browser-'+randomUUID(),pricePerDay:30,description:'Временная запись для автоматической проверки интерфейса.'});
 for(const filename of ['main.webp','gallery.webp']){const form=new FormData();form.append('file',new Blob([fs.readFileSync('client/public/media/cars/chevrolet-onix/'+filename)],{type:'image/webp'}),filename);const r=await fetch(base+'/uploads',{method:'POST',headers:{Cookie:cookies.admin},body:form});assert.equal(r.status,201);const {url}=await r.json();uploads.push(url);await api('/cars/'+car.id+'/images','POST',{url,alt:'Chevrolet Onix'});}
 const date=new Date();date.setUTCDate(date.getUTCDate()+250);const day=offset=>new Date(+date+offset*86400000).toISOString().slice(0,10);
 booking=await api('/bookings','POST',{carId:car.id,pickupDate:day(0),returnDate:day(2)},'customer');
 await page.goto('http://localhost:5173/cars/'+car.slug);await page.getByRole('button',{name:'Фотография 2',exact:true}).click();await page.getByRole('button',{name:'Увеличить фотографию'}).click();const modal=page.getByRole('dialog',{name:'Галерея автомобиля'});await modal.waitFor();await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('[role=dialog]')));await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});
 await page.goto('http://localhost:5173/cars/hyundai-tucson');await page.getByRole('heading',{level:1,name:'Tucson'}).waitFor();await page.locator('button[aria-label="Увеличить фотографию"] img').evaluate(img=>img.decode());
 await page.goto('http://localhost:5173/login');await page.getByLabel('Email',{exact:true}).fill('admin@rnrrentcar.uz');await page.getByLabel('Пароль',{exact:true}).fill(process.env.DEMO_ADMIN_PASSWORD);await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL('**/admin');
 await page.goto('http://localhost:5173/admin/bookings');await page.getByLabel('Поиск бронирований').fill(booking.bookingNumber);await page.locator('tbody tr').filter({hasText:booking.bookingNumber}).click();await page.getByRole('button',{name:'Редактировать заявку'}).click();await page.getByLabel('Возврат',{exact:true}).fill(day(3));const editResponse=page.waitForResponse(r=>r.url().endsWith('/api/bookings/'+booking.id)&&r.request().method()==='PUT');await page.getByRole('button',{name:'Сохранить изменения'}).click();assert.equal((await editResponse).status(),200);assert.equal((await db.booking.findUnique({where:{id:booking.id}})).totalPrice,90);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Mobile booking detail overflow');
 await page.goto('http://localhost:5173/login');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Пароль',{exact:true}).fill('QA-Password-2026');await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL('http://localhost:5173/');
 await page.goto('http://localhost:5173/profile');await page.getByLabel('Текущий пароль').fill('QA-Password-2026');await page.getByLabel('Новый пароль',{exact:true}).fill('QA-Changed-2026');await page.getByLabel('Повторите новый пароль').fill('does-not-match');await page.getByRole('button',{name:'Изменить пароль'}).click();await page.getByText('Подтверждение пароля не совпадает').waitFor();await page.getByLabel('Повторите новый пароль').fill('QA-Changed-2026');await page.getByRole('button',{name:'Изменить пароль'}).click();await page.waitForURL('**/login');await page.getByText('Пароль изменён. Войдите с новым паролем.').waitFor();
 await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Пароль',{exact:true}).fill('QA-Changed-2026');await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL('http://localhost:5173/');await page.goto('http://localhost:5173/notifications');await page.getByRole('heading',{name:'Бронирование изменено'}).waitFor();await page.locator('article').filter({hasText:'Бронирование изменено'}).getByRole('button',{name:'Прочитано'}).click();
 assert.deepEqual(errors,[]);console.log('Browser regression passed: gallery navigation/reset/focus, booking editing and mobile details, password validation/change/re-login, notifications.');
}finally{
 await browser.close();if(booking){await db.auditLog.deleteMany({where:{entityId:booking.id}});await db.booking.delete({where:{id:booking.id}});}if(car){await db.auditLog.deleteMany({where:{entityId:car.id}});await db.car.delete({where:{id:car.id}});}if(user){await db.auditLog.deleteMany({where:{userId:user.id}});await db.user.delete({where:{id:user.id}});}for(const url of uploads)fs.unlinkSync(path.join(UPLOAD_DIRECTORY,path.basename(url)));await db.$disconnect();
}
