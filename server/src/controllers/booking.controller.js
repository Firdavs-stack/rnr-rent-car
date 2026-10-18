import {text,moneyValue} from '../utils/validation.js';
import {requireUpload} from '../utils/uploads.js';
import { rentalPeriod } from '../../../shared/dates.js';
import prisma from '../config/db.js';
import { checkAvailability } from '../utils/availability.js';
import { calculatePricing } from '../utils/pricing.js';

function generateBookingNumber() {
  const d = new Date();
  const prefix = `RNR-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

const safeUser = { id: true, firstName: true, lastName: true, email: true, phone: true };
function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
function period(body) { try{return rentalPeriod(body,{future:true});}catch(error){fail(400,error.message);} }
export const createBooking = async (req, res, next) => {
  try {
    const { start, end } = period(req.body);
    const { carId, pickupTime = '10:00', returnTime = '10:00', pickupLocation, returnLocation } = req.body;
    if(!Array.isArray(req.body.selectedServices || [])) fail(400, 'Некорректные услуги');
    if(typeof carId !== 'string') fail(400, 'Укажите автомобиль');
    text(pickupLocation,'место получения',{max:200});text(returnLocation,'место возврата',{max:200});
    const ids = (req.body.selectedServices || []).map(s => typeof s === 'string' ? s : s?.id);
    if (!Array.isArray(req.body.selectedServices || []) || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) fail(400, 'Некорректные услуги');
    const booking = await prisma.$transaction(async db => {
      await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${carId} FOR UPDATE`;
      const car = await db.car.findUnique({ where: { id: carId } });
      if (!car || !car.isActive || car.deletedAt || ['MAINTENANCE', 'DAMAGED', 'UNAVAILABLE', 'WASHING'].includes(car.status)) fail(409, 'Автомобиль недоступен');
      if (!await checkAvailability(carId, start, end, null, db)) fail(409, 'Автомобиль уже забронирован на этот период');
      const services = await db.service.findMany({ where: { id: { in: ids }, isActive: true } });
      if (services.length !== ids.length) fail(400, 'Услуга недоступна');
      const created = await db.booking.create({ data: {
        bookingNumber: generateBookingNumber(), carId, userId: req.user.id,
        pickupDate: start, returnDate: end, pickupTime, returnTime, pickupLocation, returnLocation,
        selectedServices: services.map(({ id, name, price }) => ({ id, name, price })),
        ...calculatePricing(car.pricePerDay, start, end, services), currency: 'USD',
      }, include: { car: { include: { images: { where: { isMain: true }, take: 1 } } }, user: { select: safeUser } } });
      await db.notification.create({ data: { userId: req.user.id, title: 'Бронирование создано', message: created.bookingNumber, type: 'BOOKING_CREATED' } });
      await db.auditLog.create({ data: { userId: req.user.id, action: 'CREATE', entity: 'Booking', entityId: created.id } });
      return created;
    });
    res.status(201).json(booking);
  } catch (error) { next(error); }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: { car: { include: { images: { where: { isMain: true }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings.map(customerBooking));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения бронирований' });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const { status, carId, userId, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (carId) where.carId = carId;
    if (userId) where.userId = userId;
    if (from || to) {
      where.pickupDate = {};
      if (from) where.pickupDate.gte = new Date(from);
      if (to) where.pickupDate.lte = new Date(to);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        car: { select: { id: true, brand: true, model: true, licensePlate: true, images: { where: { isMain: true }, take: 1 } } },
        user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения бронирований' });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        car: { include: { images: true } },
        user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, documents: true } },
        payments: true,
        reviews: true,
      },
    });
    if (!booking) return res.status(404).json({ error: 'Бронирование не найдено' });
    if (!['ADMIN','MANAGER'].includes(req.user.role) && booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    res.json(['ADMIN','MANAGER'].includes(req.user.role)?booking:customerBooking(booking));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

const transitions = { NEW: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PREPARING', 'CANCELLED'], PREPARING: ['CANCELLED'], ACTIVE: ['RETURNING'], RETURNING: [] };
export const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await prisma.$transaction(async db => {
      const initial=await db.booking.findUnique({where:{id:req.params.id}});
      if(!initial)fail(404,'Бронирование не найдено');
      await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${initial.carId} FOR UPDATE`;
      await db.$queryRaw`SELECT id FROM "Booking" WHERE id = ${req.params.id} FOR UPDATE`;
      const previous = await db.booking.findUnique({ where: { id: req.params.id } });
      if (!previous) fail(404, 'Бронирование не найдено');
      if (!(transitions[previous.status] || []).includes(req.body.status)) fail(400, 'Недопустимый переход статуса');
      const updated = await db.booking.update({ where: { id: previous.id }, data: { status: req.body.status, managerNotes: text(req.body.managerNotes,'заметки',{max:2000}), ...(req.body.status === 'CANCELLED' ? { cancelledAt: new Date() } : {}) }, include: { car: true, user: { select: safeUser } } });
      await db.auditLog.create({ data: { userId: req.user.id, action: 'STATUS', entity: 'Booking', entityId: previous.id, details: { from: previous.status, to: updated.status } } });
      await db.notification.create({data:{userId:previous.userId,title:'Статус бронирования изменён',message:previous.bookingNumber,type:'BOOKING_STATUS',link:'/my-bookings'}});
      return updated;
    });
    res.json(booking);
  } catch (error) { next(error); }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await prisma.$transaction(async db => {
      await db.$queryRaw`SELECT id FROM "Booking" WHERE id = ${req.params.id} FOR UPDATE`;
      const current = await db.booking.findUnique({ where: { id: req.params.id } });
      if (!current || current.userId !== req.user.id) fail(404, 'Бронирование не найдено');
      if (!['NEW', 'CONFIRMED'].includes(current.status) || current.pickupDate <= new Date()) fail(400, 'Отмена доступна до выдачи и начала аренды');
      await db.auditLog.create({ data: { userId: req.user.id, action: 'CANCEL', entity: 'Booking', entityId: current.id } });
      await db.notification.create({data:{userId:current.userId,title:'Бронирование отменено',message:current.bookingNumber,type:'BOOKING_CANCELLED',link:'/my-bookings'}});
      return db.booking.update({ where: { id: current.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    });
    res.json(booking);
  } catch (error) { next(error); }
};

function inspection(body) {
  if (!Number.isInteger(body.mileage) || body.mileage < 0 || !Number.isInteger(body.fuelLevel) || body.fuelLevel < 0 || body.fuelLevel > 100) fail(400, 'Укажите пробег и уровень топлива от 0 до 100');
  if (body.photos && (!Array.isArray(body.photos) || body.photos.some(p => typeof p !== 'string' || !/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p)))) fail(400, 'Некорректные фотографии');
}
async function operate(req, returning) {
  inspection(req.body);
  text(req.body.notes,'заметки осмотра',{max:3000});text(req.body.damageDescription,'описание повреждения',{max:3000});
  if(req.body.extraCharges!==undefined)moneyValue(req.body.extraCharges,'дополнительные расходы');
  await Promise.all((req.body.photos||[]).map(requireUpload));
  return prisma.$transaction(async db => {
    const initial=await db.booking.findUnique({where:{id:req.params.id}});
    if(!initial)fail(404,'Бронирование не найдено');
    await db.$queryRaw`SELECT id FROM "Car" WHERE id = ${initial.carId} FOR UPDATE`;
    await db.$queryRaw`SELECT id FROM "Booking" WHERE id = ${initial.id} FOR UPDATE`;
    const previous=await db.booking.findUnique({where:{id:initial.id},include:{car:true}});
    const car = await db.car.findUnique({ where: { id: previous.carId } });
    if (!(returning ? ['ACTIVE', 'RETURNING'] : ['CONFIRMED', 'PREPARING']).includes(previous.status)) fail(400, 'Операция недоступна в текущем статусе');
    if (req.body.mileage < (returning ? previous.handoverMileage : car.mileage)) fail(400, 'Пробег не может уменьшаться');
    if (!returning && (!['AVAILABLE','RESERVED'].includes(car.status) || !await checkAvailability(car.id, previous.pickupDate, previous.returnDate, previous.id, db))) fail(409, 'Автомобиль не готов к выдаче');
    if(!returning&&previous.returnDate<=new Date())fail(409,'Заявка просрочена: измените период до выдачи');
    if (!returning && req.body.documentsChecked !== true) fail(400, 'Подтвердите проверку документов клиента');
    if(!returning)await db.customer.upsert({where:{userId:previous.userId},update:{verified:true},create:{userId:previous.userId,verified:true}});
    const prefix = returning ? 'return' : 'handover';
    const updated = await db.booking.update({ where: { id: previous.id }, data: { status: returning ? 'COMPLETED' : 'ACTIVE', [prefix + 'Mileage']: req.body.mileage, [prefix + 'Fuel']: req.body.fuelLevel, [prefix + 'Photos']: req.body.photos || [], [prefix + 'Notes']: req.body.notes, [prefix + 'At']: new Date(), [prefix + 'By']: req.user.id } });
    await db.car.update({ where: { id: car.id }, data: { status: returning ? 'PREPARATION' : 'RENTED', mileage: req.body.mileage, fuelLevel: req.body.fuelLevel } });
    if (returning && req.body.extraCharges) {
      if (!Number.isFinite(req.body.extraCharges) || req.body.extraCharges < 0) fail(400, 'Некорректные дополнительные расходы');
      await db.payment.create({ data: { bookingId: previous.id, amount: req.body.extraCharges, type: 'EXTRA', status: 'PENDING', description: 'Учебное начисление при возврате' } });
    }
    if (req.body.damageDescription?.trim()) await db.damageReport.create({ data: { carId: car.id, bookingId: previous.id, phase: returning ? 'RETURN' : 'HANDOVER', description: req.body.damageDescription, photos: req.body.photos || [] } });
    await db.auditLog.create({ data: { userId: req.user.id, action: returning ? 'RETURN' : 'HANDOVER', entity: 'Booking', entityId: previous.id } });
    await db.notification.create({data:{userId:previous.userId,title:returning?'Аренда завершена':'Автомобиль выдан',message:previous.bookingNumber,type:'RENTAL_OPERATION',link:'/my-bookings'}});
    return updated;
  });
}
export const handoverBooking = async (req, res, next) => { try { res.json(await operate(req, false)); } catch (e) { next(e); } };
export const returnBooking = async (req, res, next) => { try { res.json(await operate(req, true)); } catch (e) { next(e); } };

export const getTodayOperations = async (req, res) => {
  try {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(new Date());
    const today = new Date(`${date}T00:00:00+05:00`);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const handovers = await prisma.booking.findMany({
      where: { pickupDate: { gte: today, lt: tomorrow }, status: { in: ['CONFIRMED', 'PREPARING'] } },
      include: { car: { select: { brand: true, model: true } }, user: { select: { firstName: true, lastName: true } } },
      orderBy: { pickupDate: 'asc' },
    });

    const returns = await prisma.booking.findMany({
      where: { returnDate: { gte: today, lt: tomorrow }, status: { in: ['ACTIVE', 'RETURNING'] } },
      include: { car: { select: { brand: true, model: true } }, user: { select: { firstName: true, lastName: true } } },
      orderBy: { returnDate: 'asc' },
    });

    res.json({ handovers, returns });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

export const getCalendarData = async (req, res) => {
  try {
    const { from, to } = req.query;
    const bookings = await prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
        pickupDate: { lte: new Date(to) },
        returnDate: { gte: new Date(from) },
      },
      include: {
        car: { select: { id: true, brand: true, model: true, licensePlate: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};
function customerBooking(booking) {
  const {managerNotes,managerId,handoverBy,returnBy,...publicBooking}=booking;
  return publicBooking;
}
