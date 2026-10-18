import { Router } from 'express';
import { register, login, logout, me, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/password', authenticate, changePassword);
router.get('/me', authenticate, me);
export default router;