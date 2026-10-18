import { me } from '../controllers/auth.controller.js';
import { Router } from 'express';
import { getCustomers, getCustomerDetail, getStaff, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isManager } from '../middleware/rbac.js';

const router = Router();
router.get('/profile', authenticate, me);
router.put('/profile', authenticate, updateProfile);
router.get('/customers', authenticate, isManager, getCustomers);
router.get('/customers/:id', authenticate, isManager, getCustomerDetail);
router.get('/staff', authenticate, isManager, getStaff);
export default router;