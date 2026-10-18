import prisma from '../config/db.js';

export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, text } = req.body;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof text !== 'string' || text.trim().length < 10 || text.length > 3000) return res.status(400).json({error:'Укажите оценку 1–5 и отзыв от 10 до 3000 символов'});

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Отзыв можно оставить только после завершённой аренды' });
    }

    const existing = await prisma.review.findFirst({ where: { bookingId, userId: req.user.id } });
    if (existing) {
      return res.status(409).json({ error: 'Вы уже оставили отзыв для этого бронирования' });
    }

    const review = await prisma.review.create({
      data: { bookingId, userId: req.user.id, carId: booking.carId, rating, text },
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания отзыва' });
  }
};

export const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'APPROVED' },
      include: { user: { select: { firstName: true, lastName: true, avatar: true } }, booking: { select: { car: { select: { brand: true, model: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

export const getAllReviewsAdmin = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: { select: { firstName: true, lastName: true } }, booking: { select: { car: { select: { brand: true, model: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

export const moderateReview = async (req, res) => {
  try {
    const { status } = req.body;
    if(!['PENDING','APPROVED','REJECTED'].includes(status)) return res.status(400).json({error:'Некорректный статус'});
    const review = await prisma.$transaction(async db=>{const item=await db.review.update({where:{id:req.params.id},data:{status}});await db.auditLog.create({data:{userId:req.user.id,action:'MODERATE',entity:'Review',entityId:item.id,details:{status}}});return item;});
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};