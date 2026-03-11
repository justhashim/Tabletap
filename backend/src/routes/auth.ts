import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refreshToken, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Strict rate limit on auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 20,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);
router.get('/me', authenticate, me);

export { router as authRouter };
