import prisma from '../config/db.js';

export const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER', deletedAt: null },
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers.map(({ password, ...user }) => user));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

export const getCustomerDetail = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: { include: { car: { select: { brand: true, model: true } } }, orderBy: { createdAt: 'desc' } },
        reviews: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Клиент не найден' });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

export const getStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { not: 'CUSTOMER' }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    res.json(staff.map(({ password, ...user }) => user));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    if(typeof firstName!=='string'||!firstName.trim()||typeof lastName!=='string'||!lastName.trim()||firstName.length>100||lastName.length>100||(phone&&typeof phone!=='string'))return res.status(400).json({error:'Проверьте имя и фамилию'});
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true },
    });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка' });
  }
};