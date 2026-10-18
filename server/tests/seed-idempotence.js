import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const p=new PrismaClient();const count=async()=>({users:await p.user.count(),cars:await p.car.count(),bookings:await p.booking.count(),services:await p.service.count(),reviews:await p.review.count(),payments:await p.payment.count()});try{const before=await count();execFileSync(process.execPath,['prisma/seed.js'],{stdio:'pipe'});assert.deepEqual(await count(),before);console.log('Seed idempotence passed:',before);}finally{await p.$disconnect();}
