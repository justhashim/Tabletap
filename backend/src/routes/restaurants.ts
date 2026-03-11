import { Router } from 'express';
import { getRestaurant, updateRestaurant, getStaff } from '../controllers/restaurantController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/:id', getRestaurant);
router.put('/:id', authenticate, authorize('owner', 'admin'), updateRestaurant);
router.get('/:id/staff', authenticate, authorize('owner', 'admin'), getStaff);

export { router as restaurantsRouter };
