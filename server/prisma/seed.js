import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { fleet } from './fleet.js';
const prisma = new PrismaClient();
async function main(){
 const password = process.env.DEMO_CUSTOMER_PASSWORD;
 if(!process.env.DEMO_ADMIN_PASSWORD || !process.env.DEMO_MANAGER_PASSWORD || !password) throw new Error('Задайте DEMO_ADMIN_PASSWORD, DEMO_MANAGER_PASSWORD, DEMO_CUSTOMER_PASSWORD в .env');
 for(const [email,role,firstName,lastName,pw] of [['admin@rnrrentcar.uz','ADMIN','Администратор','Демо',process.env.DEMO_ADMIN_PASSWORD],['manager@rnrrentcar.uz','MANAGER','Менеджер','Демо',process.env.DEMO_MANAGER_PASSWORD],['aziza@example.test','CUSTOMER','Азиза','Демо',password],['timur@example.test','CUSTOMER','Тимур','Демо',password],['malika@example.test','CUSTOMER','Малика','Демо',password]]){
  if(pw.length<8) throw new Error('Пароли должны содержать минимум 8 символов');
  const user=await prisma.user.upsert({where:{email},update:{},create:{email,role,firstName,lastName,password:await bcrypt.hash(pw,12)}});
  if(role==='CUSTOMER') await prisma.customer.upsert({where:{userId:user.id},update:{},create:{userId:user.id,verified:true,notes:'Демонстрационный клиент'}});
 }
 const sources=fs.existsSync('../client/public/media/manifest.json')?JSON.parse(fs.readFileSync('../client/public/media/manifest.json','utf8')):[];
 const cars=[];
 for(const data of fleet){
  const exists=await prisma.car.findUnique({where:{slug:data.slug}});
  const car=await prisma.car.upsert({where:{slug:data.slug},update:{},create:{...data,status:'AVAILABLE'}});cars.push(car);
  for(const source of sources.filter(s=>s.slug===data.slug && s.status==='imported')) await prisma.carImage.upsert({where:{carId_url:{carId:car.id,url:source.localUrl}},update:{source},create:{carId:car.id,url:source.localUrl,alt:`${data.brand} ${data.model}`,isMain:source.purpose==='main',sortOrder:source.purpose==='main'?0:1,source}});
 }
 const names=['Детское кресло','Дополнительный водитель','Доставка автомобиля','Подача в аэропорт','Аренда с водителем','Долгосрочная аренда','Корпоративная аренда','Междугородняя поездка','Посуточная аренда'];
 for(let i=0;i<names.length;i++){const id=`demo-service-${i}`;await prisma.service.upsert({where:{id},update:{},create:{id,name:names[i],price:[5,10,15,20,40,0,0,10,0][i],description:i>=5?'Учебные условия согласовываются с менеджером':'Демонстрационная цена за сутки'}});}
 await prisma.appSetting.upsert({where:{key:'company'},update:{},create:{key:'company',value:{phone:'+998 00 000 00 00 (демо)',email:'hello@example.test',hours:'Пн–Вс 08:00–22:00 (демо)',address:''}}});
 const customers=await prisma.user.findMany({where:{email:{in:['aziza@example.test','timur@example.test','malika@example.test']}},orderBy:{email:'asc'}});
 const statuses=['CONFIRMED','NEW','COMPLETED','CANCELLED','PREPARING'];
 const now=new Date();now.setUTCHours(5,0,0,0);
 for(let i=0;i<15;i++){
  const status=statuses[i%5];const start=new Date(now);start.setUTCDate(start.getUTCDate()+(status==='COMPLETED'?-10:3+i));const end=new Date(+start+2*86400000);const car=cars[i];
  const b=await prisma.booking.upsert({where:{bookingNumber:`RNR-DEMO-${String(i+1).padStart(3,'0')}`},update:{},create:{bookingNumber:`RNR-DEMO-${String(i+1).padStart(3,'0')}`,carId:car.id,userId:customers[i%3].id,status,pickupDate:start,returnDate:end,pickupTime:'10:00',returnTime:'10:00',basePrice:car.pricePerDay*2,daysCount:2,totalPrice:car.pricePerDay*2,managerNotes:'Демонстрационная заявка',pickupLocation:'Ташкент (демо)',returnLocation:'Ташкент (демо)'}});
  await prisma.payment.upsert({where:{id:`demo-payment-${i}`},update:{},create:{id:`demo-payment-${i}`,bookingId:b.id,amount:b.totalPrice,type:'RENTAL',status:status==='COMPLETED'?'PAID':'PENDING',description:'Демонстрационный платёж. Банковская операция не выполнялась.'}});
  if(status==='COMPLETED') await prisma.review.upsert({where:{id:`demo-review-${i}`},update:{},create:{id:`demo-review-${i}`,bookingId:b.id,userId:b.userId,carId:car.id,rating:5,text:'Демонстрационный отзыв: понятный расчёт стоимости и удобный процесс бронирования.',status:'APPROVED'}});
 }
 const mstart=new Date(+now+30*86400000);
 await prisma.maintenance.upsert({where:{id:'demo-maintenance'},update:{},create:{id:'demo-maintenance',carId:cars[14].id,type:'ТО',description:'Демонстрационное плановое обслуживание',startAt:mstart,endAt:new Date(+mstart+86400000)}});
 console.log('Seed: 15 автомобилей, учебные аккаунты, услуги, бронирования, платежи и отзывы. Повторный запуск безопасен.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
