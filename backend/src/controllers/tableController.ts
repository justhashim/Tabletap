import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import { generateTableQR } from '../utils/qrGenerator.js';
import type { Table } from '../types/index.js';

// ─── GET /api/tables/:restaurantId ───────────────────────────────────────────
export async function getTables(req: Request, res: Response, next: NextFunction) {
    try {
        const { restaurantId } = req.params;
        const tables = await query<Table>(
            `SELECT t.*,
              (SELECT COUNT(*) FROM orders o
                WHERE o.table_id = t.id
                  AND o.status NOT IN ('served','cancelled')
                  AND DATE(o.created_at) = CURRENT_DATE) AS active_orders
         FROM tables t
        WHERE t.restaurant_id = $1
        ORDER BY t.table_number::INTEGER NULLS LAST, t.table_number`,
            [restaurantId]
        );
        res.json(tables);
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/tables ─────────────────────────────────────────────────────────
export async function createTable(req: Request, res: Response, next: NextFunction) {
    try {
        const { table_number, name, capacity } = req.body as Partial<Table>;
        const restaurantId = req.user!.restaurantId;

        if (!table_number) throw createError('table_number is required', 400);

        // Generate QR code
        const { cloudinaryUrl } = await generateTableQR(restaurantId, table_number);

        const [table] = await query<Table>(
            `INSERT INTO tables (restaurant_id, table_number, name, capacity, qr_code_url)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [restaurantId, table_number, name, capacity ?? 4, cloudinaryUrl]
        );
        res.status(201).json(table);
    } catch (err) {
        next(err);
    }
}

// ─── PUT /api/tables/:id ──────────────────────────────────────────────────────
export async function updateTable(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const { name, capacity, is_active } = req.body as Partial<Table>;
        const restaurantId = req.user!.restaurantId;

        const [table] = await query<Table>(
            `UPDATE tables
          SET name     = COALESCE($1, name),
              capacity = COALESCE($2, capacity),
              is_active = COALESCE($3, is_active)
        WHERE id = $4 AND restaurant_id = $5
       RETURNING *`,
            [name, capacity, is_active, id, restaurantId]
        );
        if (!table) throw createError('Table not found', 404);
        res.json(table);
    } catch (err) {
        next(err);
    }
}

// ─── DELETE /api/tables/:id ───────────────────────────────────────────────────
export async function deleteTable(req: Request, res: Response, next: NextFunction) {
    try {
        await query(
            `DELETE FROM tables WHERE id = $1 AND restaurant_id = $2`,
            [req.params.id, req.user!.restaurantId]
        );
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/tables/:id/qr ───────────────────────────────────────────────────
// Returns QR PNG as base64 (regenerates if needed)
export async function getTableQR(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const restaurantId = req.user!.restaurantId;

        const table = await queryOne<Table>(
            `SELECT * FROM tables WHERE id = $1 AND restaurant_id = $2`,
            [id, restaurantId]
        );
        if (!table) throw createError('Table not found', 404);

        const { dataUrl, cloudinaryUrl } = await generateTableQR(restaurantId, table.table_number);

        // Persist cloudinary URL if changed
        if (cloudinaryUrl !== table.qr_code_url) {
            await query(`UPDATE tables SET qr_code_url = $1 WHERE id = $2`, [cloudinaryUrl, id]);
        }

        res.json({ dataUrl, cloudinaryUrl, tableNumber: table.table_number });
    } catch (err) {
        next(err);
    }
}
