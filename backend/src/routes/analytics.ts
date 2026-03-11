import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDailyAnalytics, getPopularItems, getRevenueTrend } from '../controllers/analyticsController.js';

const router = Router();

router.use(authenticate, authorize('owner', 'admin', 'manager'));

router.get('/daily/:restaurantId', getDailyAnalytics);
router.get('/popular/:restaurantId', getPopularItems);
router.get('/revenue/:restaurantId', getRevenueTrend);

export { router as analyticsRouter };
