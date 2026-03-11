import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';
import type { Order, OrderItem, OrderStatus } from '../types/index.js';

interface CreateOrderBody {
    restaurantId: string;
    tableId?: string;
    tableNumber?: string;
    orderType: 'dine_in' | 'takeout';
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    paymentMethod: 'counter' | 'card';
    items: Array<{
        menuItemId: string;
        quantity: number;
        notes?: string;
        selectedOptions?: Array<{
            option_id: string;
            option_name: string;
            choice_id: string;
            choice_name: string;
            price_modifier: number;
        }>;
    }>;
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
export async function createOrder(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body as CreateOrderBody;
        const { restaurantId, tableId, tableNumber, orderType, customerName, customerPhone, notes, paymentMethod, items } = body;

        if (!items?.length) throw createError('Order must contain at least one item', 400);

        // Validate restaurant
        const restaurant = await queryOne<{ id: string; tax_rate: number }>(
            `SELECT id, tax_rate FROM restaurants WHERE id = $1 AND is_active = true`,
            [restaurantId]
        );
        if (!restaurant) throw createError('Restaurant not found', 404);

        // Resolve menu items & calculate totals
        let subtotal = 0;
        const resolvedItems: Array<OrderItem & { tempMenuItemId: string }> = [];

        for (const cartItem of items) {
            const menuItem = await queryOne<{ id: string; name: string; price: number; is_available: boolean }>(
                `SELECT id, name, price, is_available FROM menu_items WHERE id = $1 AND restaurant_id = $2`,
                [cartItem.menuItemId, restaurantId]
            );
            if (!menuItem) throw createError(`Menu item ${cartItem.menuItemId} not found`, 404);
            if (!menuItem.is_available) throw createError(`${menuItem.name} is currently unavailable`, 400);

            const optionsTotal = (cartItem.selectedOptions ?? []).reduce(
                (sum, o) => sum + Number(o.price_modifier),
                0
            );
            const unitPrice = Number(menuItem.price) + optionsTotal;
            const totalPrice = unitPrice * cartItem.quantity;
            subtotal += totalPrice;

            resolvedItems.push({
                id: '',
                order_id: '',
                menu_item_id: menuItem.id,
                menu_item_name: menuItem.name,
                unit_price: unitPrice,
                quantity: cartItem.quantity,
                total_price: totalPrice,
                selected_options: cartItem.selectedOptions ?? [],
                notes: cartItem.notes,
                created_at: new Date(),
                tempMenuItemId: menuItem.id,
            });
        }

        const taxAmount = subtotal * Number(restaurant.tax_rate);
        const total = subtotal + taxAmount;

        // Insert order
        const [order] = await query<Order>(
            `INSERT INTO orders
         (restaurant_id, table_id, table_number, order_type, customer_name, customer_phone,
          notes, subtotal, tax_amount, total, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [restaurantId, tableId, tableNumber, orderType, customerName, customerPhone, notes, subtotal, taxAmount, total, paymentMethod]
        );

        // Insert order items
        for (const ri of resolvedItems) {
            await query(
                `INSERT INTO order_items
           (order_id, menu_item_id, menu_item_name, unit_price, quantity, total_price, selected_options, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [order.id, ri.menu_item_id, ri.menu_item_name, ri.unit_price, ri.quantity, ri.total_price, JSON.stringify(ri.selected_options), ri.notes]
            );
        }

        // Fetch full order with items
        const fullOrder = await getOrderWithItems(order.id);

        // Emit via Socket.io
        const io = req.app.get('io');
        io.to(`restaurant:${restaurantId}`).emit('order:new', fullOrder);

        res.status(201).json(fullOrder);
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/orders/:restaurantId ───────────────────────────────────────────
export async function getOrders(req: Request, res: Response, next: NextFunction) {
    try {
        const { restaurantId } = req.params;
        const { status, date, limit = '50', offset = '0' } = req.query as Record<string, string>;

        let whereClause = 'WHERE o.restaurant_id = $1';
        const params: unknown[] = [restaurantId];
        let paramIdx = 2;

        if (status) {
            whereClause += ` AND o.status = $${paramIdx++}`;
            params.push(status);
        }
        if (date) {
            whereClause += ` AND DATE(o.created_at) = $${paramIdx++}`;
            params.push(date);
        }

        const orders = await query<Order>(
            `SELECT o.*,
              COALESCE(JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', oi.id,
                  'menu_item_id', oi.menu_item_id,
                  'menu_item_name', oi.menu_item_name,
                  'unit_price', oi.unit_price,
                  'quantity', oi.quantity,
                  'total_price', oi.total_price,
                  'selected_options', oi.selected_options,
                  'notes', oi.notes
                )
              ) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         ${whereClause}
         GROUP BY o.id
         ORDER BY o.created_at DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json(orders);
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/orders/detail/:id ───────────────────────────────────────────────
export async function getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
        const order = await getOrderWithItems(req.params.id);
        if (!order) throw createError('Order not found', 404);
        res.json(order);
    } catch (err) {
        next(err);
    }
}

// ─── PUT /api/orders/:id/status ───────────────────────────────────────────────
export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const { status } = req.body as { status: OrderStatus };

        const validStatuses: OrderStatus[] = ['pending', 'received', 'preparing', 'ready', 'served', 'cancelled'];
        if (!validStatuses.includes(status)) throw createError('Invalid status', 400);

        const [order] = await query<Order>(
            `UPDATE orders SET status = $1, served_at = CASE WHEN $1 = 'served' THEN NOW() ELSE served_at END
        WHERE id = $2 RETURNING *`,
            [status, id]
        );
        if (!order) throw createError('Order not found', 404);

        const fullOrder = await getOrderWithItems(id);

        // Broadcast status update
        const io = req.app.get('io');
        io.to(`restaurant:${order.restaurant_id}`).emit('order:statusUpdated', { orderId: id, status, order: fullOrder });
        // Notify customer room too
        io.to(`order:${id}`).emit('order:statusUpdated', { orderId: id, status });

        res.json(fullOrder);
    } catch (err) {
        next(err);
    }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
async function getOrderWithItems(orderId: string) {
    return queryOne<Order>(
        `SELECT o.*,
            COALESCE(JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', oi.id,
                'menu_item_id', oi.menu_item_id,
                'menu_item_name', oi.menu_item_name,
                'unit_price', oi.unit_price,
                'quantity', oi.quantity,
                'total_price', oi.total_price,
                'selected_options', oi.selected_options,
                'notes', oi.notes
              )
            ) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = $1
      GROUP BY o.id`,
        [orderId]
    );
}
