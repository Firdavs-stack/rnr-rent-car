import { Router } from 'express';
import { getCars, getCarBySlug, checkCarAvailability, createCar, restoreCar, updateCar, deleteCar, getAllCarsAdmin, getFleetStats } from '../controllers/car.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isManager, isContentManager } from '../middleware/rbac.js';

const router = Router();
router.get('/', getCars);
router.get('/stats', authenticate, isManager, getFleetStats);
router.get('/admin', authenticate, isManager, getAllCarsAdmin);
router.get('/:slug', getCarBySlug);
router.post('/availability', checkCarAvailability);
router.post('/', authenticate, isContentManager, createCar);
router.put('/:id/restore', authenticate, isManager, restoreCar);
router.put('/:id', authenticate, isContentManager, updateCar);
router.delete('/:id', authenticate, isManager, deleteCar);
export default router;