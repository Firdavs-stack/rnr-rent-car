import prisma from '../config/db.js';
import { checkAvailability } from '../utils/availability.js';
import { calculatePricing } from '../utils/pricing.js';
import { localDateString, rentalPeriod } from '../../../shared/dates.js';
import { text, httpError } from '../utils/validation.js';
export const editBooking = async (req,res,next)=>{
  try {
    const booking=await prisma.$transaction(async db=>{
      const initial=await db.booking.findUnique({where:{id:req.params.id}});
      if(!initial)throw httpError(404,'Бронирование не найдено');
      await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${initial.carId} FOR UPDATE`;
      await db.$queryRaw`SELECT id FROM "Booking" WHERE id = ${initial.id} FOR UPDATE`;
      const previous=await db.booking.findUnique({where:{id:initial.id},include:{car:true}});
      const active=['ACTIVE','RETURNING'].includes(previous.status);
      if(!['NEW','CONFIRMED','PREPARING','ACTIVE','RETURNING'].includes(previous.status))throw httpError(400,'Завершённую или отменённую заявку нельзя редактировать');
      const dates={pickupDate:req.body.pickupDate??localDateString(previous.pickupDate),pickupTime:req.body.pickupTime??previous.pickupTime,returnDate:req.body.returnDate??localDateString(previous.returnDate),returnTime:req.body.returnTime??previous.returnTime};
      let period;try{period=rentalPeriod(dates,{future:!active});}catch(error){throw httpError(400,error.message);}
      if(active&&(period.start.getTime()!==previous.pickupDate.getTime()||period.end<previous.returnDate||period.end<=new Date()))throw httpError(400,'Для активной аренды можно только продлить дату возврата');
      if(active&&req.body.selectedServices!==undefined)throw httpError(400,'Состав услуг активной аренды сохраняется');
      if(!await checkAvailability(previous.carId,period.start,period.end,previous.id,db))throw httpError(409,'Новый период пересекается с бронированием или обслуживанием');
      let services=previous.selectedServices||[];
      if(req.body.selectedServices!==undefined){
        if(!Array.isArray(req.body.selectedServices))throw httpError(400,'Некорректные услуги');
        const ids=req.body.selectedServices.map(item=>typeof item==='string'?item:item?.id);
        if(ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw httpError(400,'Проверьте список услуг');
        const records=await db.service.findMany({where:{id:{in:ids},isActive:true}});
        if(records.length!==ids.length)throw httpError(400,'Услуга недоступна');
        services=records.map(({id,name,price})=>({id,name,price}));
      }
      const rate=previous.basePrice/previous.daysCount;
      const pricing=calculatePricing(rate,period.start,period.end,services,previous.deliveryFee,previous.insuranceFee);
      const updated=await db.booking.update({where:{id:previous.id},data:{...pricing,pickupDate:period.start,returnDate:period.end,pickupTime:dates.pickupTime,returnTime:dates.returnTime,selectedServices:services,pickupLocation:text(req.body.pickupLocation??previous.pickupLocation,'место получения',{max:200,nullable:true}),returnLocation:text(req.body.returnLocation??previous.returnLocation,'место возврата',{max:200,nullable:true}),managerNotes:text(req.body.managerNotes??previous.managerNotes,'заметки',{max:2000,nullable:true})}});
      await db.auditLog.create({data:{userId:req.user.id,action:active?'EXTEND':'EDIT',entity:'Booking',entityId:previous.id,details:{before:{pickupDate:previous.pickupDate.toISOString(),returnDate:previous.returnDate.toISOString(),totalPrice:previous.totalPrice},after:{pickupDate:updated.pickupDate.toISOString(),returnDate:updated.returnDate.toISOString(),totalPrice:updated.totalPrice}}}});
      await db.notification.create({data:{userId:previous.userId,title:active?'Аренда продлена':'Бронирование изменено',message:`${previous.bookingNumber}: обновлён период и расчёт стоимости.`,type:'BOOKING_EDIT',link:'/my-bookings'}});
      return updated;
    });res.json(booking);
  }catch(error){next(error);}
};
