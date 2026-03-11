import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/database.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { createError } from '../middleware/errorHandler.js';
import type { User } from '../types/index.js';

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, email, password, restaurantName, restaurantSlug } = req.body as {
            name: string; email: string; password: string;
            restaurantName: string; restaurantSlug: string;
        };

        // Check email uniqueness
        const existing = await queryOne<User>('SELECT id FROM users WHERE email = $1', [email]);
        if (existing) throw createError('Email already registered', 409);

        // Check slug uniqueness
        const slugTaken = await queryOne('SELECT id FROM restaurants WHERE slug = $1', [restaurantSlug]);
        if (slugTaken) throw createError('Restaurant slug already taken', 409);

        // Hash password
        const password_hash = await bcrypt.hash(password, 12);

        // Create restaurant
        const [restaurant] = await query<{ id: string }>(
            `INSERT INTO restaurants (name, slug, email) VALUES ($1, $2, $3) RETURNING id`,
            [restaurantName, restaurantSlug, email]
        );

        // Create owner user
        const [user] = await query<User>(
            `INSERT INTO users (restaurant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'owner') RETURNING id, restaurant_id, name, email, role`,
            [restaurant.id, name, email, password_hash]
        );

        const payload = { userId: user.id, restaurantId: user.restaurant_id, role: user.role, email: user.email };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken({ userId: user.id });

        res.status(201).json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: restaurant.id } });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body as { email: string; password: string };

        const user = await queryOne<User>(
            `SELECT u.*, r.id as "restaurantId"
         FROM users u
         JOIN restaurants r ON r.id = u.restaurant_id
        WHERE u.email = $1 AND u.is_active = true`,
            [email]
        );
        if (!user) throw createError('Invalid credentials', 401);

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) throw createError('Invalid credentials', 401);

        // Update last login
        await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        const payload = { userId: user.id, restaurantId: user.restaurant_id, role: user.role, email: user.email };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken({ userId: user.id });

        res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurant_id } });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { refreshToken: token } = req.body as { refreshToken: string };
        if (!token) throw createError('Refresh token required', 400);

        const decoded = verifyRefreshToken(token);
        const user = await queryOne<User>(
            `SELECT u.*, u.restaurant_id FROM users u WHERE u.id = $1 AND u.is_active = true`,
            [decoded.userId]
        );
        if (!user) throw createError('User not found', 404);

        const payload = { userId: user.id, restaurantId: user.restaurant_id, role: user.role, email: user.email };
        const accessToken = signAccessToken(payload);

        res.json({ accessToken });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export async function me(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await queryOne<User>(
            `SELECT id, restaurant_id, name, email, role, avatar_url, created_at
         FROM users WHERE id = $1`,
            [req.user!.userId]
        );
        if (!user) throw createError('User not found', 404);
        res.json(user);
    } catch (err) {
        next(err);
    }
}
