// ─── Shared TypeScript types shared across the backend ───────────────────────

export type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter';
export type OrderStatus = 'pending' | 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderType = 'dine_in' | 'takeout';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'counter' | 'card';

export interface Restaurant {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    address?: string;
    phone?: string;
    email: string;
    currency: string;
    timezone: string;
    tax_rate: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface User {
    id: string;
    restaurant_id: string;
    name: string;
    email: string;
    password_hash: string;
    role: StaffRole;
    avatar_url?: string;
    is_active: boolean;
    last_login_at?: Date;
    created_at: Date;
}

export interface Table {
    id: string;
    restaurant_id: string;
    table_number: string;
    name?: string;
    capacity: number;
    qr_code_url?: string;
    is_active: boolean;
    created_at: Date;
}

export interface MenuCategory {
    id: string;
    restaurant_id: string;
    name: string;
    description?: string;
    image_url?: string;
    sort_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface MenuItem {
    id: string;
    restaurant_id: string;
    category_id?: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    ingredients: string[];
    allergens: string[];
    preparation_time: number;
    calories?: number;
    is_available: boolean;
    is_featured: boolean;
    is_popular: boolean;
    sort_order: number;
    options?: MenuItemOption[];
    created_at: Date;
    updated_at: Date;
}

export interface MenuItemOption {
    id: string;
    menu_item_id: string;
    name: string;
    type: 'single' | 'multiple';
    is_required: boolean;
    sort_order: number;
    choices: MenuItemOptionChoice[];
}

export interface MenuItemOptionChoice {
    id: string;
    option_id: string;
    name: string;
    price_modifier: number;
    is_default: boolean;
}

export interface SelectedOption {
    option_id: string;
    option_name: string;
    choice_id: string;
    choice_name: string;
    price_modifier: number;
}

export interface OrderItem {
    id: string;
    order_id: string;
    menu_item_id: string;
    menu_item_name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
    selected_options: SelectedOption[];
    notes?: string;
    created_at: Date;
}

export interface Order {
    id: string;
    restaurant_id: string;
    table_id?: string;
    table_number?: string;
    order_number: number;
    status: OrderStatus;
    order_type: OrderType;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod;
    stripe_payment_intent_id?: string;
    estimated_ready_at?: Date;
    served_at?: Date;
    items?: OrderItem[];
    created_at: Date;
    updated_at: Date;
}

export interface Payment {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    stripe_payment_intent_id?: string;
    stripe_charge_id?: string;
    metadata?: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

// ─── JWT payload ─────────────────────────────────────────────────────────────
export interface JwtPayload {
    userId: string;
    restaurantId: string;
    role: StaffRole;
    email: string;
}

// ─── Express request extension ───────────────────────────────────────────────
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
