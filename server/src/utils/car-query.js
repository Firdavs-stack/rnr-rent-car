import { httpError, text, enumValue } from './validation.js';
import { rentalPeriod } from '../../../shared/dates.js';
export const CAR_STATUSES = ['AVAILABLE','RESERVED','RENTED','PREPARATION','WASHING','MAINTENANCE','DAMAGED','UNAVAILABLE'];
export const BOOKING_BLOCKERS = ['NEW','CONFIRMED','PREPARING','HANDED_OVER','ACTIVE','RETURNING'];
export const UNBOOKABLE_STATUSES = ['MAINTENANCE','DAMAGED','UNAVAILABLE','WASHING'];
export function bookingConflict(start,end) { return {status:{in:BOOKING_BLOCKERS},OR:[{pickupDate:{lt:new Date(end)},returnDate:{gt:new Date(start)}},{status:{in:['ACTIVE','RETURNING','HANDED_OVER']},returnDate:{lte:new Date()}}]}; }
const queryNumber = (value, label, integer = false) => {
  if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0 || (integer && !Number.isInteger(Number(value)))) throw httpError(400, `Некорректный фильтр: ${label}`);
  return Number(value);
};
export function carQuery(query) {
  const where = { isActive: true, deletedAt: null };
  for (const key of ['brand','fuelType','transmission','drive','category','bodyType']) if (query[key]) where[key] = text(query[key], key, { max: 100 });
  if (query.model) where.model = { contains: text(query.model, 'модель', { max: 100 }), mode: 'insensitive' };
  if (query.search) { const search = text(query.search, 'поиск', { max: 100 }); where.OR = [{ brand: { contains: search, mode: 'insensitive' } }, { model: { contains: search, mode: 'insensitive' } }]; }
  if (query.status) where.status = enumValue(query.status, CAR_STATUSES, 'статус');
  if (query.seats) where.seats = queryNumber(query.seats, 'места', true);
  if (query.year) where.year = queryNumber(query.year, 'год', true);
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.pricePerDay = {};
    if (query.minPrice !== undefined) where.pricePerDay.gte = queryNumber(query.minPrice, 'минимальная цена');
    if (query.maxPrice !== undefined) where.pricePerDay.lte = queryNumber(query.maxPrice, 'максимальная цена');
    if (where.pricePerDay.gte > where.pricePerDay.lte) throw httpError(400, 'Минимальная цена больше максимальной');
  }
  if (query.pickupDate && query.returnDate) {
    let period; try { period = rentalPeriod(query); } catch (error) { throw httpError(400, error.message); }
    if (query.status && UNBOOKABLE_STATUSES.includes(query.status)) where.id = '__no_available_cars__';
    else if (!query.status) where.status = { notIn: UNBOOKABLE_STATUSES };
    where.bookings = { none: bookingConflict(period.start,period.end) };
    where.maintenances = { none: { status: { not: 'COMPLETED' }, startAt: { lt: period.end }, OR: [{ endAt: null }, { endAt: { gt: period.start } }] } };
  }
  const page = query.page === undefined ? 1 : queryNumber(query.page, 'страница', true);
  const limit = query.limit === undefined ? 12 : queryNumber(query.limit, 'размер страницы', true);
  if (page < 1 || limit < 1 || page > 1000000) throw httpError(400, 'Страница и размер страницы должны быть положительными');
  const perPage = Math.min(limit, 100);
  const sort = query.sort || 'price_asc';
  enumValue(sort, ['price_asc','price_desc','premium','newest'], 'сортировка');
  const orderBy = sort === 'newest' ? [{ year: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }] : [{ pricePerDay: sort === 'price_asc' ? 'asc' : 'desc' }, { id: 'asc' }];
  return { where, page, perPage, orderBy };
}
