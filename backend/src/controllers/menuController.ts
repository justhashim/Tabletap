import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database.js';
import { cloudinary } from '../config/cloudinary.js';
import { createError } from '../middleware/errorHandler.js';
import type { MenuCategory, MenuItem } from '../types/index.js';

// ─── GET /api/menu/:restaurantId ──────────────────────────────────────────────
// Public – returns full menu grouped by category
export async function getFullMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId } = req.params;

    const restaurant = await queryOne<{ id: string; name: string; logo_url: string; currency: string }>(
      `SELECT id, name, logo_url, currency FROM restaurants WHERE id = $1 AND is_active = true`,
      [restaurantId]
    );
    if (!restaurant) throw createError('Restaurant not found', 404);

    const categories = await query<MenuCategory>(
      `SELECT * FROM menu_categories
        WHERE restaurant_id = $1 AND is_active = true
        ORDER BY sort_order, name`,
      [restaurantId]
    );

    // Fetch all items with their options
    const items = await query<MenuItem>(
      `SELECT mi.*,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', mio.id,
                    'name', mio.name,
                    'type', mio.type,
                    'is_required', mio.is_required,
                    'sort_order', mio.sort_order,
                    'choices', (
                      SELECT COALESCE(
                        JSON_AGG(
                          JSON_BUILD_OBJECT(
                            'id', mioc.id,
                            'name', mioc.name,
                            'price_modifier', mioc.price_modifier,
                            'is_default', mioc.is_default
                          ) ORDER BY mioc.price_modifier
                        ),
                        '[]'::json
                      )
                      FROM menu_item_option_choices mioc
                      WHERE mioc.option_id = mio.id
                    )
                  ) ORDER BY mio.sort_order
                ) FILTER (WHERE mio.id IS NOT NULL),
                '[]'::json
              ) AS options
         FROM menu_items mi
         LEFT JOIN menu_item_options mio ON mio.menu_item_id = mi.id
        WHERE mi.restaurant_id = $1 AND mi.is_available = true
        GROUP BY mi.id
        ORDER BY mi.sort_order, mi.name`,
      [restaurantId]
    );

    // Group items by category
    const grouped = categories.map((cat) => ({
      ...cat,
      items: items.filter((item) => item.category_id === cat.id),
    }));

    res.json({
      restaurant,
      categories: grouped,
      featured:   items.filter((i) => i.is_featured),
      popular:    items.filter((i) => i.is_popular),
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/menu/:restaurantId/item/:itemId ─────────────────────────────────
export async function getMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { restaurantId, itemId } = req.params;

    const [item] = await query<MenuItem>(
      `SELECT mi.*,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', mio.id,
                    'name', mio.name,
                    'type', mio.type,
                    'is_required', mio.is_required,
                    'choices', (
                      SELECT COALESCE(
                        JSON_AGG(
                          JSON_BUILD_OBJECT(
                            'id', mioc.id,
                            'name', mioc.name,
                            'price_modifier', mioc.price_modifier,
                            'is_default', mioc.is_default
                          )
                        ),
                        '[]'::json
                      )
                      FROM menu_item_option_choices mioc
                      WHERE mioc.option_id = mio.id
                    )
                  ) ORDER BY mio.sort_order
                ) FILTER (WHERE mio.id IS NOT NULL),
                '[]'::json
              ) AS options
         FROM menu_items mi
         LEFT JOIN menu_item_options mio ON mio.menu_item_id = mi.id
        WHERE mi.id = $1 AND mi.restaurant_id = $2
        GROUP BY mi.id`,
      [itemId, restaurantId]
    );

    if (!item) throw createError('Menu item not found', 404);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/menu/categories ────────────────────────────────────────────────
export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, sort_order } = req.body as MenuCategory;
    const restaurantId = req.user!.restaurantId;

    const [cat] = await query<MenuCategory>(
      `INSERT INTO menu_categories (restaurant_id, name, description, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [restaurantId, name, description, sort_order ?? 0]
    );
    res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/menu/categories/:id ────────────────────────────────────────────
export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, description, sort_order, is_active } = req.body as Partial<MenuCategory>;
    const restaurantId = req.user!.restaurantId;

    const [cat] = await query<MenuCategory>(
      `UPDATE menu_categories
          SET name = COALESCE($1, name),
              description = COALESCE($2, description),
              sort_order = COALESCE($3, sort_order),
              is_active = COALESCE($4, is_active)
        WHERE id = $5 AND restaurant_id = $6
       RETURNING *`,
      [name, description, sort_order, is_active, id, restaurantId]
    );
    if (!cat) throw createError('Category not found', 404);
    res.json(cat);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/menu/categories/:id ─────────────────────────────────────────
export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await query(
      `DELETE FROM menu_categories WHERE id = $1 AND restaurant_id = $2`,
      [id, req.user!.restaurantId]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/menu/items ─────────────────────────────────────────────────────
export async function createMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { category_id, name, description, price, ingredients, allergens, preparation_time, calories, is_featured, is_popular, sort_order } = req.body as Partial<MenuItem>;
    const restaurantId = req.user!.restaurantId;

    const [item] = await query<MenuItem>(
      `INSERT INTO menu_items
         (restaurant_id, category_id, name, description, price, ingredients, allergens, preparation_time, calories, is_featured, is_popular, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [restaurantId, category_id, name, description, price, ingredients ?? [], allergens ?? [], preparation_time ?? 15, calories, is_featured ?? false, is_popular ?? false, sort_order ?? 0]
    );
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/menu/items/:id ──────────────────────────────────────────────────
export async function updateMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const fields = req.body as Partial<MenuItem>;
    const restaurantId = req.user!.restaurantId;

    const [item] = await query<MenuItem>(
      `UPDATE menu_items
          SET category_id       = COALESCE($1, category_id),
              name              = COALESCE($2, name),
              description       = COALESCE($3, description),
              price             = COALESCE($4, price),
              ingredients       = COALESCE($5, ingredients),
              allergens         = COALESCE($6, allergens),
              preparation_time  = COALESCE($7, preparation_time),
              calories          = COALESCE($8, calories),
              is_available      = COALESCE($9, is_available),
              is_featured       = COALESCE($10, is_featured),
              is_popular        = COALESCE($11, is_popular),
              sort_order        = COALESCE($12, sort_order)
        WHERE id = $13 AND restaurant_id = $14
       RETURNING *`,
      [fields.category_id, fields.name, fields.description, fields.price, fields.ingredients, fields.allergens, fields.preparation_time, fields.calories, fields.is_available, fields.is_featured, fields.is_popular, fields.sort_order, id, restaurantId]
    );
    if (!item) throw createError('Item not found', 404);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/menu/items/:id ───────────────────────────────────────────────
export async function deleteMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await query(
      `DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2`,
      [id, req.user!.restaurantId]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/menu/items/:id/image ──────────────────────────────────────────
export async function uploadMenuItemImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const file = req.file;
    if (!file) throw createError('No image file provided', 400);

    // File is already uploaded to Cloudinary via multer-storage-cloudinary
    const imageUrl = (file as unknown as { path: string }).path;

    const [item] = await query<MenuItem>(
      `UPDATE menu_items SET image_url = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING *`,
      [imageUrl, id, req.user!.restaurantId]
    );
    if (!item) throw createError('Item not found', 404);
    res.json(item);
  } catch (err) {
    next(err);
  }
}
