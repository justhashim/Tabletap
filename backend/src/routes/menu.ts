import { Router } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    getFullMenu, getMenuItem,
    createCategory, updateCategory, deleteCategory,
    createMenuItem, updateMenuItem, deleteMenuItem,
    uploadMenuItemImage,
} from '../controllers/menuController.js';

const router = Router();

// Cloudinary multer storage for menu images
const storage = new CloudinaryStorage({
    cloudinary: cloudinary as never,
    params: async (req, file) => ({
        folder: `tabletap/menu/${req.user?.restaurantId ?? 'unknown'}`,
        allowed_formats: ['jpg', 'png', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }],
    }),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/:restaurantId', getFullMenu);
router.get('/:restaurantId/item/:itemId', getMenuItem);

// ─── Protected (admin) ────────────────────────────────────────────────────────
router.use(authenticate, authorize('owner', 'admin', 'manager'));

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.post('/items', createMenuItem);
router.put('/items/:id', updateMenuItem);
router.delete('/items/:id', deleteMenuItem);
router.post('/items/:id/image', upload.single('image'), uploadMenuItemImage);

export { router as menuRouter };
