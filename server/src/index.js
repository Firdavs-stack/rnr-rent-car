import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import carRoutes from './routes/car.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import userRoutes from './routes/user.routes.js';
import reviewRoutes from './routes/review.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import serviceRoutes from './routes/service.routes.js';
import damageRoutes from './routes/damage.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import operationsRoutes from './routes/operations.routes.js';
import {UPLOAD_DIRECTORY} from './utils/uploads.js';
import prisma from './config/db.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Задайте DATABASE_URL и JWT_SECRET длиной минимум 32 символа в server/.env');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers.origin && req.headers.origin !== (process.env.CLIENT_URL || 'http://localhost:5173')) return res.status(403).json({ error: 'Недопустимый источник запроса' });
  next();
});
const attempts = new Map();
app.use('/api/auth', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const item = attempts.get(req.ip) || { count: 0, until: now + 60000 };
  item.count++; attempts.set(req.ip, item);
  if (item.count > 30) return res.status(429).json({ error: 'Слишком много попыток. Подождите минуту.' });
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIRECTORY, { dotfiles: 'deny', index: false }));

app.use('/api', operationsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/damages', damageRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', async (req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});
app.use('/api', (req,res)=>res.status(404).json({error:'Маршрут API не найден'}));
app.use((error, req, res, next) => {
  if(res.headersSent)return next(error);
  const status = error.code==='LIMIT_FILE_SIZE'||error.type==='entity.too.large' ? 413 : error.name==='MulterError'||error.type==='entity.parse.failed' ? 400 : error.status || (error.code==='P2002'?409:error.code==='P2025'?404:error.code==='P2003'||error.name==='PrismaClientValidationError'?400:500);
  const message = error.code==='LIMIT_FILE_SIZE'?'Максимальный размер фотографии — 8 МБ':error.name==='MulterError'?'Отправьте один файл в поле file':error.type==='entity.parse.failed'?'Некорректный JSON':error.code==='P2002'?'Запись с такими данными уже существует':error.code==='P2025'?'Запись не найдена':error.code==='P2003'?'Связанная запись не найдена':error.name==='PrismaClientValidationError'?'Проверьте переданные данные':status>=500?'Ошибка сервера':error.message;
  if(status>=500)console.error(error.message);
  res.status(status).json({error:message});
});

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`RNR Rent Car API running on port ${PORT}`));