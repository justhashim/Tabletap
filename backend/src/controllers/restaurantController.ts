import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import type { Restaurant } from '../types/index.js';

// ─── GET /api/restaurants/:id ─────────────────────────────────────────────────
// Public – used on QR scan to verify restaurant exists
export async function getRestaurant(req: Request, res: Response, next: NextFunction) {
    try {
        const restaurant = await queryOne<Restaurant>(
            `SELECT id, name, slug, description, logo_url, banner_url, address, phone, currency
         FROM restaurants WHERE id = $1 AND is_active = true`,
            [req.params.id]
        );
        if (!restaurant) throw createError('Restaurant not found', 404);
        res.json(restaurant);
    } catch (err) {
        next(err);
    }
}

// ─── PUT /api/restaurants/:id ─────────────────────────────────────────────────
export async function updateRestaurant(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (req.user!.restaurantId !== id) throw createError('Forbidden', 403);

        const fields = req.body as Partial<Restaurant>;
        const [restaurant] = await query<Restaurant>(
            `UPDATE restaurants
          SET name        = COALESCE($1, name),
              description = COALESCE($2, description),
              address     = COALESCE($3, address),
              phone       = COALESCE($4, phone),
              timezone    = COALESCE($5, timezone),
              tax_rate    = COALESCE($6, tax_rate)
        WHERE id = $7
       RETURNING *`,
            [fields.name, fields.description, fields.address, fields.phone, fields.timezone, fields.tax_rate, id]
        );
        res.json(restaurant);
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/restaurants/:id/staff ──────────────────────────────────────────
export async function getStaff(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (req.user!.restaurantId !== id) throw createError('Forbidden', 403);

        const staff = await query(
            `SELECT id, name, email, role, avatar_url, is_active, last_login_at, created_at
         FROM users WHERE restaurant_id = $1 ORDER BY created_at`,
            [id]
        );
        res.json(staff);
    } catch (err) {
        next(err);
    }
}
