import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    getTables, createTable, updateTable, deleteTable, getTableQR,
} from '../controllers/tableController.js';

const router = Router();

// Public – resolve table on QR scan
router.get('/:restaurantId', getTables);

// Protected
router.post('/', authenticate, authorize('owner', 'admin', 'manager'), createTable);
router.put('/:id', authenticate, authorize('owner', 'admin', 'manager'), updateTable);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteTable);
router.get('/:id/qr', authenticate, authorize('owner', 'admin', 'manager'), getTableQR);

export { router as tablesRouter };
