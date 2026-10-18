export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Необходима авторизация' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
};

export const isAdmin = requireRole('ADMIN');
export const isManager = requireRole('ADMIN', 'MANAGER');
export const isFleetManager = requireRole('ADMIN', 'MANAGER', 'FLEET_MANAGER');
export const isContentManager = requireRole('ADMIN', 'MANAGER', 'CONTENT_MANAGER');
export const isStaff = requireRole('ADMIN', 'MANAGER', 'FLEET_MANAGER', 'CONTENT_MANAGER');