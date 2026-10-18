import { Router } from 'express';
import { getPayments, createPayment } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isManager } from '../middleware/rbac.js';

const router = Router();
router.get('/', authenticate, isManager, getPayments);
router.post('/', authenticate, isManager, createPayment);
export default router;