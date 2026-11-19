export interface OrderItem {
    id: string;
    menu_item_id: string;
    menu_item_name: string;
    quantity: number;
    unit_price: number;
    item_total: number;
    special_instructions?: string;
    selected_options?: { option_name: string; choice_name: string; price_modifier: number }[];
}

export interface Order {
    id: string;
    restaurant_id: string;
    table_id?: string;
    table_number?: number;
    order_number: number;
    status: 'pending' | 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
    order_type: 'dine_in' | 'takeout';
    customer_name?: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
}
