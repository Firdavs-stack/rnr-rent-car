import { Router } from 'express';
import { getServices, getAllServices, createService } from '../controllers/service.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isManager, isAdmin } from '../middleware/rbac.js';

const router = Router();
router.get('/', getServices);
router.get('/all', authenticate, isManager, getAllServices);
router.post('/', authenticate, isAdmin, createService);
export default router;