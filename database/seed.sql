-- =============================================================================
-- TableTap – Demo Seed Data
-- =============================================================================

-- Restaurant
INSERT INTO restaurants (id, name, slug, description, email, currency, tax_rate, is_active)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'The Crimson Fork',
  'crimson-fork',
  'Modern American cuisine with a bold twist.',
  'owner@crimsonfork.com',
  'USD',
  0.0875,
  true
);

-- Owner user  (password: Admin123!)
-- bcrypt hash generated outside DB – replace with real hash in production
INSERT INTO users (restaurant_id, name, email, password_hash, role)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Alex Manager',
  'owner@crimsonfork.com',
  '$2b$12$LKgIXEI9R4b8GKBR7Lc09eqJ5MKJF3TQ1lYwSmHMBVl6S4CJsv3a',  -- Admin123!
  'owner'
);

-- Kitchen staff (password: Kitchen1!)
INSERT INTO users (restaurant_id, name, email, password_hash, role)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Chef Maria',
  'kitchen@crimsonfork.com',
  '$2b$12$LKgIXEI9R4b8GKBR7Lc09eqJ5MKJF3TQ1lYwSmHMBVl6S4CJsv3a',
  'kitchen'
);

-- Tables
INSERT INTO tables (restaurant_id, table_number, name, capacity) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', '1',  'Table 1',      4),
  ('a1b2c3d4-0000-0000-0000-000000000001', '2',  'Table 2',      2),
  ('a1b2c3d4-0000-0000-0000-000000000001', '3',  'Table 3',      6),
  ('a1b2c3d4-0000-0000-0000-000000000001', '4',  'Window Seat',  2),
  ('a1b2c3d4-0000-0000-0000-000000000001', '5',  'Patio 1',      4),
  ('a1b2c3d4-0000-0000-0000-000000000001', '6',  'Patio 2',      4),
  ('a1b2c3d4-0000-0000-0000-000000000001', '7',  'Bar Seat',     1),
  ('a1b2c3d4-0000-0000-0000-000000000001', '8',  'VIP Booth',    8);

-- Menu categories
INSERT INTO menu_categories (id, restaurant_id, name, description, sort_order) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Starters',    'Light bites to kick things off',      1),
  ('c0000001-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Burgers',     'Handcrafted gourmet burgers',         2),
  ('c0000001-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Pizza',       'Stone-baked thin crust pizzas',       3),
  ('c0000001-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'Sandwiches',  'Fresh pressed sandwiches & wraps',    4),
  ('c0000001-0000-0000-0000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000001', 'Sides',       'Fries, rings, slaw & more',           5),
  ('c0000001-0000-0000-0000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000001', 'Drinks',      'Soft drinks, shakes & fresh juices',  6),
  ('c0000001-0000-0000-0000-000000000007', 'a1b2c3d4-0000-0000-0000-000000000001', 'Desserts',    'Sweet endings',                       7);

-- Menu items
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, ingredients, is_featured, is_popular, preparation_time) VALUES
  -- Starters
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000001','Crispy Calamari','Golden fried calamari with marinara dipping sauce',10.99,ARRAY['calamari','flour','seasoning','marinara'],false,true,10),
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000001','Loaded Nachos','Tortilla chips with cheese, jalapeños, sour cream & salsa',12.99,ARRAY['tortilla chips','cheddar','jalapeños','sour cream','salsa'],true,false,8),
  -- Burgers
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000002','Classic Smash Burger','Double smash patty, American cheese, pickles, special sauce',14.99,ARRAY['beef','American cheese','pickles','lettuce','special sauce','brioche bun'],true,true,12),
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000002','BBQ Bacon Burger','Smoked bacon, cheddar, crispy onions, BBQ sauce',16.99,ARRAY['beef','bacon','cheddar','onion rings','BBQ sauce','brioche bun'],true,true,14),
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000002','Mushroom Swiss','Sautéed mushrooms, Swiss cheese, garlic aioli',14.99,ARRAY['beef','mushrooms','Swiss cheese','garlic aioli','brioche bun'],false,false,13),
  -- Pizza
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000003','Margherita','Fresh mozzarella, San Marzano tomatoes, basil',13.99,ARRAY['dough','mozzarella','San Marzano tomatoes','basil','olive oil'],false,true,18),
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000003','Pepperoni Feast','Double pepperoni, mozzarella, spicy tomato sauce',15.99,ARRAY['dough','pepperoni','mozzarella','tomato sauce'],true,true,18),
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000003','BBQ Chicken','Grilled chicken, red onion, BBQ base, mozzarella',16.99,ARRAY['dough','chicken','red onion','BBQ sauce','mozzarella'],false,false,20),
  -- Sandwiches
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000004','Club Sandwich','Triple decker with turkey, bacon, egg, lettuce',12.99,ARRAY['sourdough','turkey','bacon','egg','lettuce','tomato','mayo'],false,true,10),
  -- Sides
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000005','Crispy Fries','Hand-cut fries with house seasoning',4.99,ARRAY['potatoes','seasoning','oil'],false,true,8),
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000005','Onion Rings','Beer-battered golden rings with ranch dip',5.99,ARRAY['onion','beer batter','ranch'],false,false,8),
  -- Drinks
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000006','Fresh Lemonade','Freshly squeezed with mint',4.49,ARRAY['lemon','sugar','mint','water'],false,true,3),
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000006','Vanilla Shake','Thick hand-spun vanilla milkshake',6.99,ARRAY['vanilla ice cream','whole milk','whipped cream'],false,false,5),
  -- Desserts
  ('a1b2c3d4-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000007','Molten Lava Cake','Warm chocolate cake with vanilla ice cream',8.99,ARRAY['dark chocolate','butter','eggs','flour','vanilla ice cream'],false,true,15);
