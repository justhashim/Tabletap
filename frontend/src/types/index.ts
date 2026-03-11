// ─── Shared types for the customer frontend ───────────────────────────────────

export interface Restaurant {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    address?: string;
    phone?: string;
    currency: string;
}

export interface MenuCategory {
    id: string;
    restaurant_id: string;
    name: string;
    description?: string;
    image_url?: string;
    sort_order: number;
    is_active: boolean;
    items: MenuItem[];
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
    options: MenuItemOption[];
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

export interface CartItem {
    id: string;           // unique cart line ID
    menuItemId: string;
    name: string;
    price: number;        // base price
    image_url?: string;
    quantity: number;
    selectedOptions: SelectedOption[];
    notes?: string;
    lineTotal: number;    // (price + option modifiers) * quantity
}

export type OrderStatus = 'pending' | 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderType = 'dine_in' | 'takeout';
export type PaymentMethod = 'counter' | 'card';

export interface Order {
    id: string;
    restaurant_id: string;
    table_number?: string;
    order_number: number;
    status: OrderStatus;
    order_type: OrderType;
    customer_name?: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    payment_method: PaymentMethod;
    items: OrderItemRecord[];
    created_at: string;
    updated_at: string;
}

export interface OrderItemRecord {
    id: string;
    menu_item_name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
    selected_options: SelectedOption[];
    notes?: string;
}

export interface FullMenu {
    restaurant: Restaurant;
    categories: MenuCategory[];
    featured: MenuItem[];
    popular: MenuItem[];
}
