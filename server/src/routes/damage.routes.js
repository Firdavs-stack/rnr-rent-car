import { Router } from 'express';
import { getDamages, createDamage, updateDamage } from '../controllers/damage.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isManager, isFleetManager } from '../middleware/rbac.js';

const router = Router();
router.get('/', authenticate, isFleetManager, getDamages);
router.post('/', authenticate, isFleetManager, createDamage);
router.put('/:id', authenticate, isFleetManager, updateDamage);
export default router;