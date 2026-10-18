import {bookingConflict} from './car-query.js';
import prisma from '../config/db.js';

export async function checkAvailability(carId, pickupDate, returnDate, excludeBookingId = null, db = prisma) {
  const overlapping = await db.booking.findFirst({where:{carId,...bookingConflict(pickupDate,returnDate),...(excludeBookingId?{id:{not:excludeBookingId}}:{})}});

  const maintenance = await db.maintenance.findFirst({ where: { carId, status: { not: 'COMPLETED' }, startAt: { lt: new Date(returnDate) }, OR: [{ endAt: null }, { endAt: { gt: new Date(pickupDate) } }] } });
  return !overlapping && !maintenance;
}

