-- =============================================================================
-- TableTap – PostgreSQL Database Schema
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE staff_role     AS ENUM ('owner', 'admin', 'manager', 'kitchen', 'waiter');
CREATE TYPE order_status   AS ENUM ('pending', 'received', 'preparing', 'ready', 'served', 'cancelled');
CREATE TYPE order_type     AS ENUM ('dine_in', 'takeout');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('counter', 'card');

-- =============================================================================
-- RESTAURANTS
-- =============================================================================

CREATE TABLE restaurants (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(100) UNIQUE NOT NULL,
  description      TEXT,
  logo_url         TEXT,
  banner_url       TEXT,
  address          TEXT,
  phone            VARCHAR(30),
  email            VARCHAR(255) UNIQUE NOT NULL,
  currency         VARCHAR(10)  DEFAULT 'USD',
  timezone         VARCHAR(60)  DEFAULT 'UTC',
  tax_rate         DECIMAL(5,4) DEFAULT 0.0,       -- e.g. 0.0875 = 8.75%
  stripe_account   VARCHAR(255),
  is_active        BOOLEAN      DEFAULT true,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- =============================================================================
-- USERS  (restaurant staff)
-- =============================================================================

CREATE TABLE users (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            staff_role   DEFAULT 'waiter',
  avatar_url      TEXT,
  is_active       BOOLEAN      DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- =============================================================================
-- TABLES  (physical restaurant tables)
-- =============================================================================

CREATE TABLE tables (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number    VARCHAR(20)  NOT NULL,
  name            VARCHAR(100),                    -- e.g. "Window Seat", "Patio 3"
  capacity        INTEGER      DEFAULT 4,
  qr_code_url     TEXT,
  is_active       BOOLEAN      DEFAULT true,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (restaurant_id, table_number)
);

-- =============================================================================
-- MENU CATEGORIES
-- =============================================================================

CREATE TABLE menu_categories (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  image_url       TEXT,
  sort_order      INTEGER      DEFAULT 0,
  is_active       BOOLEAN      DEFAULT true,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- =============================================================================
-- MENU ITEMS
-- =============================================================================

CREATE TABLE menu_items (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id     UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id       UUID         REFERENCES menu_categories(id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  price             DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url         TEXT,
  ingredients       TEXT[]       DEFAULT '{}',
  allergens         TEXT[]       DEFAULT '{}',
  preparation_time  INTEGER      DEFAULT 15,        -- minutes
  calories          INTEGER,
  is_available      BOOLEAN      DEFAULT true,
  is_featured       BOOLEAN      DEFAULT false,
  is_popular        BOOLEAN      DEFAULT false,
  sort_order        INTEGER      DEFAULT 0,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- =============================================================================
-- MENU ITEM OPTIONS  (e.g. "Size", "Sauce")
-- =============================================================================

CREATE TABLE menu_item_options (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id    UUID         NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(20)  DEFAULT 'single'   CHECK (type IN ('single','multiple')),
  is_required     BOOLEAN      DEFAULT false,
  sort_order      INTEGER      DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- =============================================================================
-- MENU ITEM OPTION CHOICES  (e.g. "Small +$0", "Large +$2")
-- =============================================================================

CREATE TABLE menu_item_option_choices (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id       UUID          NOT NULL REFERENCES menu_item_options(id) ON DELETE CASCADE,
  name            VARCHAR(100)  NOT NULL,
  price_modifier  DECIMAL(10,2) DEFAULT 0.00,
  is_default      BOOLEAN       DEFAULT false,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- =============================================================================
-- ORDERS
-- =============================================================================

CREATE TABLE orders (
  id                        UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id             UUID            NOT NULL REFERENCES restaurants(id),
  table_id                  UUID            REFERENCES tables(id),
  table_number              VARCHAR(20),
  -- Human-readable sequential number scoped per restaurant
  order_number              INTEGER         NOT NULL,
  status                    order_status    DEFAULT 'pending',
  order_type                order_type      DEFAULT 'dine_in',
  customer_name             VARCHAR(255),
  customer_phone            VARCHAR(30),
  notes                     TEXT,
  subtotal                  DECIMAL(10,2)   NOT NULL DEFAULT 0,
  tax_amount                DECIMAL(10,2)   DEFAULT 0,
  discount_amount           DECIMAL(10,2)   DEFAULT 0,
  total                     DECIMAL(10,2)   NOT NULL DEFAULT 0,
  payment_status            payment_status  DEFAULT 'pending',
  payment_method            payment_method  DEFAULT 'counter',
  stripe_payment_intent_id  VARCHAR(255),
  estimated_ready_at        TIMESTAMPTZ,
  served_at                 TIMESTAMPTZ,
  created_at                TIMESTAMPTZ     DEFAULT NOW(),
  updated_at                TIMESTAMPTZ     DEFAULT NOW()
);

-- Per-restaurant sequential order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- =============================================================================
-- ORDER ITEMS
-- =============================================================================

CREATE TABLE order_items (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id      UUID          NOT NULL REFERENCES menu_items(id),
  -- Snapshot fields (preserve values even if menu changes)
  menu_item_name    VARCHAR(255)  NOT NULL,
  unit_price        DECIMAL(10,2) NOT NULL,
  quantity          INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price       DECIMAL(10,2) NOT NULL,
  -- [{option_name, choice_name, price_modifier}]
  selected_options  JSONB         DEFAULT '[]',
  notes             TEXT,
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE payments (
  id                        UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                  UUID            NOT NULL REFERENCES orders(id),
  amount                    DECIMAL(10,2)   NOT NULL,
  currency                  VARCHAR(10)     DEFAULT 'USD',
  method                    payment_method  NOT NULL,
  status                    payment_status  DEFAULT 'pending',
  stripe_payment_intent_id  VARCHAR(255),
  stripe_charge_id          VARCHAR(255),
  metadata                  JSONB,
  created_at                TIMESTAMPTZ     DEFAULT NOW(),
  updated_at                TIMESTAMPTZ     DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_users_restaurant_id       ON users(restaurant_id);
CREATE INDEX idx_users_email               ON users(email);
CREATE INDEX idx_tables_restaurant_id      ON tables(restaurant_id);
CREATE INDEX idx_menu_categories_rest      ON menu_categories(restaurant_id);
CREATE INDEX idx_menu_items_restaurant_id  ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id    ON menu_items(category_id);
CREATE INDEX idx_menu_item_options_item    ON menu_item_options(menu_item_id);
CREATE INDEX idx_menu_item_choices_option  ON menu_item_option_choices(option_id);
CREATE INDEX idx_orders_restaurant_id      ON orders(restaurant_id);
CREATE INDEX idx_orders_status             ON orders(status);
CREATE INDEX idx_orders_created_at         ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id      ON order_items(order_id);
CREATE INDEX idx_payments_order_id         ON payments(order_id);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restaurants_updated_at     BEFORE UPDATE ON restaurants     FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_menu_items_updated_at      BEFORE UPDATE ON menu_items      FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_orders_updated_at          BEFORE UPDATE ON orders          FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_payments_updated_at        BEFORE UPDATE ON payments        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- AUTO ORDER NUMBER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_assign_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
    INTO next_num
    FROM orders
   WHERE restaurant_id = NEW.restaurant_id;
  NEW.order_number = next_num;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_assign_order_number();
