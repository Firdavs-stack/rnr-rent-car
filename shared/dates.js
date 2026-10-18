export const RENTAL_TIME_ZONE = 'Asia/Tashkent';
export function localDateString(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: RENTAL_TIME_ZONE }).format(new Date(date)); }
export function rentalDate(date, time = '10:00') {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Укажите корректные дату и время');
  const parsed = new Date(`${date}T${time}:00+05:00`);
  if (!Number.isFinite(+parsed) || localDateString(parsed) !== date) throw new Error('Такой календарной даты не существует');
  return parsed;
}
export function rentalPeriod(body, { future = false, now = new Date() } = {}) {
  const start = rentalDate(body.pickupDate, body.pickupTime || '10:00');
  const end = rentalDate(body.returnDate, body.returnTime || '10:00');
  if (end <= start) throw new Error('Возврат должен быть после получения');
  if (future && start < now) throw new Error('Получение должно быть в будущем');
  if ((end - start) > 366 * 86400000) throw new Error('Период аренды не должен превышать 366 суток');
  return { start, end };
}
export const formatRentalDate = date => new Intl.DateTimeFormat('ru-RU', { timeZone: RENTAL_TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
