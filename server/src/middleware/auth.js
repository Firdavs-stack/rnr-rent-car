import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
async function sessionUser(req) {
  const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof decoded.jti !== 'string' || typeof decoded.userId !== 'string') return null;
  const session = await prisma.authSession.findFirst({
    where: { id: decoded.jti, userId: decoded.userId, expiresAt: { gt: new Date() } },
    select: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, deletedAt: true } } },
  });
  return session?.user?.isActive && !session.user.deletedAt ? session.user : null;
}
export const authenticate = async (req, res, next) => {
  try {
    const user = await sessionUser(req);
    if (!user) return res.status(401).json({ error: 'Необходима авторизация или сессия завершена' });
    req.user = user; next();
  } catch (error) {
    if (['TokenExpiredError','JsonWebTokenError','NotBeforeError'].includes(error.name)) return res.status(401).json({ error: 'Сессия истекла или недействительна' });
    next(error);
  }
};
export const optionalAuth = async (req, res, next) => {
  try { req.user = await sessionUser(req); } catch (error) { if (!['TokenExpiredError','JsonWebTokenError','NotBeforeError'].includes(error.name)) return next(error); }
  next();
};
