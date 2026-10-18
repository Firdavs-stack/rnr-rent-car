import {editBooking} from '../controllers/booking-edit.controller.js';
import { Router } from 'express';
import { cancelBooking, createBooking, getMyBookings, getAllBookings, getBookingById, updateBookingStatus, handoverBooking, returnBooking, getTodayOperations, getCalendarData } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isManager } from '../middleware/rbac.js';

const router = Router();
router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/today', authenticate, isManager, getTodayOperations);
router.get('/calendar', authenticate, isManager, getCalendarData);
router.get('/all', authenticate, isManager, getAllBookings);
router.get('/:id', authenticate, getBookingById);
router.put('/:id', authenticate, isManager, editBooking);
router.put('/:id/cancel', authenticate, cancelBooking);
router.put('/:id/status', authenticate, isManager, updateBookingStatus);
router.put('/:id/handover', authenticate, isManager, handoverBooking);
router.put('/:id/return', authenticate, isManager, returnBooking);
export default router;