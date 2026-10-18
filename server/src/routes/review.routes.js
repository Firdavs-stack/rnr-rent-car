import { Router } from 'express';
import { createReview, getApprovedReviews, getAllReviewsAdmin, moderateReview } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isManager } from '../middleware/rbac.js';

const router = Router();
router.get('/', getApprovedReviews);
router.get('/admin', authenticate, isManager, getAllReviewsAdmin);
router.post('/', authenticate, createReview);
router.put('/:id/moderate', authenticate, isManager, moderateReview);
export default router;