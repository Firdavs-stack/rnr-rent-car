import { Router } from 'express';
import { getNotifications, markRead } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markRead);
export default router;