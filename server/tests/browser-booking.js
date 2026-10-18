import dotenv from 'dotenv';
import {chromium} from 'playwright';
import {PrismaClient} from '@prisma/client';
import assert from 'node:assert/strict';
dotenv.config({path:'server/.env'});
const prisma=new PrismaClient(),browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),page=await browser.newPage();let bookingId;
try{
 const start=new Date();start.setUTCDate(start.getUTCDate()+120);const end=new Date(+start+5*86400000);
 await page.goto(`http://localhost:5173/booking/byd-chazor-champion?pickupDate=${start.toISOString().slice(0,10)}&returnDate=${end.toISOString().slice(0,10)}`);await page.waitForURL('**/login');
 await page.locator('input[type=email]').fill('aziza@example.test');await page.locator('input[type=password]').fill(process.env.DEMO_CUSTOMER_PASSWORD);await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL('**/booking/byd-chazor-champion?**');await page.getByRole('heading',{name:'Бронирование',exact:true}).waitFor();
 await page.getByText('2 677 500 сум',{exact:false}).waitFor();await page.getByRole('button',{name:'Забронировать',exact:true}).click();await page.waitForURL('**/booking/success/**');bookingId=page.url().split('/').pop();await page.getByRole('heading',{name:'Бронирование создано'}).waitFor();
 const saved=await prisma.booking.findUnique({where:{id:bookingId}});assert.equal(saved.totalPrice,225);
 await page.getByRole('link',{name:'Мои бронирования',exact:true}).click();await page.getByText(saved.bookingNumber,{exact:false}).waitFor();page.once('dialog',d=>d.accept());await page.locator('article').filter({hasText:saved.bookingNumber}).getByRole('button',{name:'Отменить',exact:true}).click();await page.locator('article').filter({hasText:saved.bookingNumber}).getByText('Отменена',{exact:true}).waitFor();assert.equal((await prisma.booking.findUnique({where:{id:bookingId}})).status,'CANCELLED');
 console.log('Browser booking passed: protected redirect preserves dates, login, $225 / 2 677 500 UZS, persisted booking and cancellation.');
}finally{if(bookingId){await prisma.auditLog.deleteMany({where:{entityId:bookingId}});await prisma.booking.delete({where:{id:bookingId}});}await prisma.$disconnect();await browser.close();}
