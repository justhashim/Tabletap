import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';

// ─── GET /api/analytics/daily/:restaurantId ───────────────────────────────────
export async function getDailyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
        const { restaurantId } = req.params;
        const { date } = req.query as { date?: string };
        const targetDate = date ?? new Date().toISOString().split('T')[0];

        // Revenue & order counts
        const [summary] = await query<{
            total_orders: string;
            completed_orders: string;
            revenue: string;
            avg_order_value: string;
        }>(
            `SELECT
         COUNT(*)                                     AS total_orders,
         COUNT(*) FILTER (WHERE status = 'served')   AS completed_orders,
         COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled')), 0) AS revenue,
         COALESCE(AVG(total) FILTER (WHERE status NOT IN ('cancelled')), 0) AS avg_order_value
       FROM orders
      WHERE restaurant_id = $1 AND DATE(created_at) = $2`,
            [restaurantId, targetDate]
        );

        // Orders per hour (today)
        const hourly = await query<{ hour: string; count: string }>(
            `SELECT DATE_PART('hour', created_at)::INT AS hour, COUNT(*) AS count
         FROM orders
        WHERE restaurant_id = $1 AND DATE(created_at) = $2
          AND status != 'cancelled'
        GROUP BY hour ORDER BY hour`,
            [restaurantId, targetDate]
        );

        // Status breakdown
        const statusBreakdown = await query<{ status: string; count: string }>(
            `SELECT status, COUNT(*) AS count
         FROM orders
        WHERE restaurant_id = $1 AND DATE(created_at) = $2
        GROUP BY status`,
            [restaurantId, targetDate]
        );

        res.json({
            date: targetDate,
            summary: {
                totalOrders: parseInt(summary.total_orders),
                completedOrders: parseInt(summary.completed_orders),
                revenue: parseFloat(summary.revenue),
                avgOrderValue: parseFloat(summary.avg_order_value),
            },
            ordersByHour: hourly.map((h) => ({ hour: parseInt(h.hour), count: parseInt(h.count) })),
            statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: parseInt(s.count) })),
        });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/analytics/popular/:restaurantId ─────────────────────────────────
export async function getPopularItems(req: Request, res: Response, next: NextFunction) {
    try {
        const { restaurantId } = req.params;
        const { days = '30', limit = '10' } = req.query as { days?: string; limit?: string };

        const items = await query<{
            menu_item_id: string;
            menu_item_name: string;
            total_quantity: string;
            total_revenue: string;
            order_count: string;
        }>(
            `SELECT
         oi.menu_item_id,
         oi.menu_item_name,
         SUM(oi.quantity)    AS total_quantity,
         SUM(oi.total_price) AS total_revenue,
         COUNT(DISTINCT oi.order_id) AS order_count
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.restaurant_id = $1
        AND o.status != 'cancelled'
        AND o.created_at >= NOW() - ($2 || ' days')::INTERVAL
      GROUP BY oi.menu_item_id, oi.menu_item_name
      ORDER BY total_quantity DESC
      LIMIT $3`,
            [restaurantId, parseInt(days), parseInt(limit)]
        );

        res.json(
            items.map((i) => ({
                menuItemId: i.menu_item_id,
                menuItemName: i.menu_item_name,
                totalQuantity: parseInt(i.total_quantity),
                totalRevenue: parseFloat(i.total_revenue),
                orderCount: parseInt(i.order_count),
            }))
        );
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/analytics/revenue/:restaurantId ─────────────────────────────────
// Last 30 days revenue trend
export async function getRevenueTrend(req: Request, res: Response, next: NextFunction) {
    try {
        const { restaurantId } = req.params;

        const trend = await query<{ date: string; revenue: string; orders: string }>(
            `SELECT
         DATE(created_at)       AS date,
         SUM(total)             AS revenue,
         COUNT(*)               AS orders
       FROM orders
      WHERE restaurant_id = $1
        AND status != 'cancelled'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date`,
            [restaurantId]
        );

        res.json(trend.map((r) => ({ date: r.date, revenue: parseFloat(r.revenue), orders: parseInt(r.orders) })));
    } catch (err) {
        next(err);
    }
}
