import { Router } from 'express';
import { getMaintenances, createMaintenance, completeMaintenance } from '../controllers/maintenance.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isFleetManager } from '../middleware/rbac.js';

const router = Router();
router.get('/', authenticate, isFleetManager, getMaintenances);
router.post('/', authenticate, isFleetManager, createMaintenance);
router.put('/:id/complete', authenticate, isFleetManager, completeMaintenance);
export default router;