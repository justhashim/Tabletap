export type OrderStatus = 'pending' | 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type StaffRole = 'owner' | 'admin' | 'manager' | 'kitchen' | 'waiter';

export interface Restaurant { id: string; name: string; slug: string; currency: string; }

export interface MenuCategory {
    id: string; restaurant_id: string; name: string;
    description?: string; image_url?: string; sort_order: number;
    is_active: boolean; items: MenuItem[];
}

export interface MenuItem {
    id: string; restaurant_id: string; category_id?: string;
    name: string; description?: string; price: number;
    image_url?: string; ingredients: string[]; allergens: string[];
    preparation_time: number; calories?: number;
    is_available: boolean; is_featured: boolean; is_popular: boolean;
}

export interface Table {
    id: string; restaurant_id: string; table_number: string;
    name?: string; capacity: number; qr_code_url?: string;
    is_active: boolean; active_orders?: number;
}

export interface Order {
    id: string; restaurant_id: string; table_id?: string;
    table_number?: string; order_number: number;
    status: OrderStatus; order_type: 'dine_in' | 'takeout';
    customer_name?: string; customer_phone?: string; notes?: string;
    subtotal: number; tax_amount: number; total: number;
    payment_status: string; payment_method: string;
    items: OrderItem[];
    created_at: string; updated_at: string;
}

export interface OrderItem {
    id: string; menu_item_id: string; menu_item_name: string;
    unit_price: number; quantity: number; total_price: number;
    selected_options: Array<{ option_name: string; choice_name: string; price_modifier: number }>;
    notes?: string;
}

export interface FullMenu {
    restaurant: Restaurant;
    categories: MenuCategory[];
    featured: MenuItem[];
    popular: MenuItem[];
}

export interface DailyAnalytics {
    date: string;
    summary: {
        totalOrders: number; completedOrders: number;
        revenue: number; avgOrderValue: number;
    };
    ordersByHour: Array<{ hour: number; count: number }>;
    statusBreakdown: Array<{ status: string; count: number }>;
}

export interface PopularItem {
    menuItemId: string; menuItemName: string;
    totalQuantity: number; totalRevenue: number; orderCount: number;
}
