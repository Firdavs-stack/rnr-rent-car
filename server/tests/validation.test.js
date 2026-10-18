import {internalPath} from '../../shared/navigation.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rentalDate,rentalPeriod,localDateString} from '../../shared/dates.js';
import {carQuery} from '../src/utils/car-query.js';
import {passwordValue,moneyValue,emailAddress} from '../src/utils/validation.js';
import {normalizeImage} from '../src/utils/uploads.js';
import sharp from 'sharp';
test('Несуществующие даты не переносятся автоматически в следующий месяц',()=>{assert.throws(()=>rentalDate('2030-02-30'));assert.throws(()=>rentalDate('2030-01-01','25:00'));assert.equal(rentalDate('2030-01-01','10:00').toISOString(),'2030-01-01T05:00:00.000Z');assert.equal(localDateString(new Date('2030-01-01T22:00:00Z')),'2030-01-02');assert.equal(localDateString('2030-01-01T22:00:00Z'),'2030-01-02');});
test('Аренда в пределах одного дня допустима, неверный и чрезмерный период отклоняется',()=>{assert.equal(rentalPeriod({pickupDate:'2030-01-01',returnDate:'2030-01-01',pickupTime:'10:00',returnTime:'11:00'}).end.toISOString(),'2030-01-01T06:00:00.000Z');assert.throws(()=>rentalPeriod({pickupDate:'2030-01-02',returnDate:'2030-01-01'}));assert.throws(()=>rentalPeriod({pickupDate:'2030-01-01',returnDate:'2032-01-01'}));});
test('Числовые фильтры и пагинация валидируются; год и привод применяются без дат',()=>{const q=carQuery({year:'2024',drive:'AWD',limit:'500'});assert.equal(q.where.year,2024);assert.equal(q.where.drive,'AWD');assert.equal(q.perPage,100);assert.throws(()=>carQuery({page:'NaN'}));assert.throws(()=>carQuery({page:'0'}));assert.throws(()=>carQuery({page:'1.5'}));assert.throws(()=>carQuery({minPrice:'100',maxPrice:'50'}));});
test('Бронирования и обслуживание фильтруются одним запросом',()=>{const q=carQuery({pickupDate:'2030-01-01',returnDate:'2030-01-03'});assert(q.where.bookings.none);assert(q.where.maintenances.none);assert(q.where.status.notIn.includes('WASHING'));});
test('Email нормализуется, bcrypt-пароль проверяется в байтах, деньги не округляются незаметно',()=>{assert.equal(emailAddress(' AZIZA@EXAMPLE.TEST '),'aziza@example.test');assert.throws(()=>emailAddress('a@'));assert.throws(()=>passwordValue('😀'.repeat(25)));assert.throws(()=>moneyValue(10.001));assert.equal(moneyValue(10.25),10.25);});
test('Повреждённый файл с PNG-заголовком отклоняется; корректный PNG преобразуется в WebP',async()=>{await assert.rejects(normalizeImage(Buffer.from([137,80,78,71,13,10,26,10])));const png=await sharp({create:{width:30,height:20,channels:3,background:'#d0b080'}}).png().toBuffer();const output=await normalizeImage(png);const metadata=await sharp(output).metadata();assert.equal(metadata.format,'webp');assert.equal(metadata.width,30);});

test('После входа допускаются только внутренние переходы, включая защиту от закодированных обходов',()=>{assert.equal(internalPath('/booking/onix?pickupDate=2030-01-01'),'/booking/onix?pickupDate=2030-01-01');for(const url of ['https://evil.example','//evil.example','/%5cevil.example','/%2f%2fevil.example','/\\evil.example','/bad%0a','/%xx'])assert.equal(internalPath(url,'/admin'),'/admin');});
