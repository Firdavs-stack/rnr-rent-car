import dotenv from 'dotenv';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
dotenv.config({path:'server/.env'});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));fs.mkdirSync('.local/screenshots',{recursive:true});
try{
 await page.goto('http://localhost:5173/');await page.locator('h1').waitFor();await page.locator('.car-card').first().waitFor();
 const video=await page.locator('video').evaluate(v=>({currentSrc:v.currentSrc,paused:v.paused,muted:v.muted,readyState:v.readyState}));assert(video.currentSrc.includes('/media/hero/hero-driving.mp4'));assert(video.muted);await page.waitForFunction(()=>document.querySelector('video').currentTime>0);console.log('Hero video autoplay passed');
 await page.screenshot({path:'.local/screenshots/home-desktop.png',fullPage:true});
 await page.goto('http://localhost:5173/cars');await page.locator('.car-card').first().waitFor();await page.getByLabel('Максимальная цена, $').fill('45');await page.waitForResponse(r=>r.url().includes('/api/cars?')&&r.url().includes('maxPrice=45'));await page.waitForTimeout(200);const prices=await page.locator('.car-card-price strong').allTextContents();assert(prices.every(p=>Number(p.replace('$',''))<=45));
 await page.getByRole('button',{name:'Сбросить фильтры'}).click();await page.locator('.car-card').first().click();await page.getByRole('heading',{level:1}).waitFor();await page.getByRole('button',{name:'360°',exact:true}).click();await page.getByText('360° просмотр пока недоступен для этой модели').waitFor();
 await page.goto('http://localhost:5173/login');await page.locator('input[type=email]').fill('admin@rnrrentcar.uz');await page.locator('input[type=password]').fill(process.env.DEMO_ADMIN_PASSWORD);await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL('**/admin');await page.getByRole('heading',{name:'Сегодня в прокате'}).waitFor();
 for(const route of ['cars','bookings','calendar','handover','returns','customers','payments','deposits','damages','maintenance','services','reviews','contacts','staff','settings']){await page.goto('http://localhost:5173/admin/'+route);await page.locator('main h1').waitFor();await page.waitForTimeout(150);}
 await page.goto('http://localhost:5173/admin/calendar');await page.screenshot({path:'.local/screenshots/calendar-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:5173/');await page.locator('.car-card').first().waitFor();await page.screenshot({path:'.local/screenshots/home-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'Mobile overflow');
 await page.goto('http://localhost:5173/cars');await page.locator('.car-card').first().waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'Catalog overflow');
 for(const route of ['services','about','reviews','faq','contacts','terms','privacy','profile','my-bookings','favorites']){await page.goto('http://localhost:5173/'+route);await page.locator('h1').waitFor();}
 assert.deepEqual(errors,[]);console.log('Browser smoke passed: filters, detail, 360 fallback, admin login, 15 admin routes, mobile layout, 10 client routes.');
}finally{await browser.close();}
