import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    createOrder, getOrders, getOrderById, updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

// Public – customers place orders
router.post('/', createOrder);

// Public – customers track their order
router.get('/detail/:id', getOrderById);

// Protected – staff view & manage orders
router.get('/:restaurantId', authenticate, authorize('owner', 'admin', 'manager', 'kitchen', 'waiter'), getOrders);
router.put('/:id/status', authenticate, authorize('owner', 'admin', 'manager', 'kitchen', 'waiter'), updateOrderStatus);

export { router as ordersRouter };
