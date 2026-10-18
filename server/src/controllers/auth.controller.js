import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';
import { emailAddress, passwordValue, text, httpError } from '../utils/validation.js';
const publicUser = { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatar: true, createdAt: true };
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
async function startSession(userId, res) {
  const id = randomUUID();
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { jwtid: id, algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  const expiresAt = new Date(jwt.decode(token).exp * 1000);
  await prisma.$transaction([
    prisma.authSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.authSession.create({ data: { id, userId, expiresAt } }),
  ]);
  res.cookie('token', token, { ...cookieOptions, expires: expiresAt });
}
export const register = async (req, res, next) => {
  try {
    const email = emailAddress(req.body.email), password = passwordValue(req.body.password);
    const firstName = text(req.body.firstName, 'имя', { required: true, max: 100 });
    const lastName = text(req.body.lastName, 'фамилию', { required: true, max: 100 });
    const phone = text(req.body.phone, 'телефон', { max: 40 });
    if (await prisma.user.findUnique({ where: { email } })) throw httpError(409, 'Пользователь с таким email уже существует');
    const user = await prisma.user.create({ data: { email, password: await bcrypt.hash(password, 12), firstName, lastName, phone, role: 'CUSTOMER' }, select: publicUser });
    await startSession(user.id, res);
    res.status(201).json({ user });
  } catch (error) { next(error); }
};
export const login = async (req, res, next) => {
  try {
    const email = emailAddress(req.body.email);
    if (typeof req.body.password !== 'string' || Buffer.byteLength(req.body.password) > 72) throw httpError(400, 'Укажите корректный пароль');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || user.deletedAt || !await bcrypt.compare(req.body.password, user.password)) throw httpError(401, 'Неверный email или пароль');
    await startSession(user.id, res);
    const safe = Object.fromEntries(Object.keys(publicUser).map(key => [key, user[key]]));
    res.json({ user: safe });
  } catch (error) { next(error); }
};
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer /, '');
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); } catch {}
    if (decoded?.jti && decoded?.userId) await prisma.authSession.deleteMany({ where: { id: decoded.jti, userId: decoded.userId } });
    res.clearCookie('token', cookieOptions);
    res.json({ message: 'Вы вышли из системы' });
  } catch (error) { next(error); }
};
export const changePassword = async (req, res, next) => {
  try {
    const password = passwordValue(req.body.newPassword);
    if (typeof req.body.currentPassword !== 'string') throw httpError(400, 'Укажите текущий пароль');
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!await bcrypt.compare(req.body.currentPassword, user.password)) throw httpError(400, 'Текущий пароль неверен');
    if (await bcrypt.compare(password, user.password)) throw httpError(400, 'Новый пароль должен отличаться от текущего');
    const hash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async db => {
      const updated = await db.user.updateMany({ where: { id: user.id, password: user.password }, data: { password: hash } });
      if (!updated.count) throw httpError(409, 'Пароль уже изменён. Войдите заново.');
      await db.authSession.deleteMany({ where: { userId: user.id } });
      await db.auditLog.create({ data: { userId: user.id, action: 'PASSWORD_CHANGE', entity: 'User', entityId: user.id } });
    });
    res.clearCookie('token', cookieOptions);
    res.json({ message: 'Пароль изменён. Войдите снова.' });
  } catch (error) { next(error); }
};
export const me = async (req, res, next) => {
  try { res.json(await prisma.user.findUnique({ where: { id: req.user.id }, select: publicUser })); }
  catch (error) { next(error); }
};
