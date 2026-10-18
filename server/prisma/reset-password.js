import 'dotenv/config';
import {passwordValue} from '../src/utils/validation.js';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma=new PrismaClient();
const email=process.argv[2];const password=passwordValue(process.env.RESET_PASSWORD);
if(!email || !password || password.length<8) throw new Error('Использование: RESET_PASSWORD=<пароль> node prisma/reset-password.js <email>; минимум 8 символов');
try{const hash=await bcrypt.hash(password,12);await prisma.$transaction(async db=>{const user=await db.user.update({where:{email:email.toLowerCase()},data:{password:hash}});await db.authSession.deleteMany({where:{userId:user.id}});});console.log('Пароль обновлён');}finally{await prisma.$disconnect();}
