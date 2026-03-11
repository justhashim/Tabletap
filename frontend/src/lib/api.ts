import axios from 'axios';
import type { FullMenu, MenuItem, Order, CartItem } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const apiClient = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 15000,
});

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const menuApi = {
    getFull: (restaurantId: string) =>
        apiClient.get<FullMenu>(`/menu/${restaurantId}`).then((r) => r.data),

    getItem: (restaurantId: string, itemId: string) =>
        apiClient.get<MenuItem>(`/menu/${restaurantId}/item/${itemId}`).then((r) => r.data),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
interface PlaceOrderPayload {
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
        selectedOptions?: CartItem['selectedOptions'];
    }>;
}

export const ordersApi = {
    place: (payload: PlaceOrderPayload) =>
        apiClient.post<Order>('/orders', payload).then((r) => r.data),

    getById: (orderId: string) =>
        apiClient.get<Order>(`/orders/detail/${orderId}`).then((r) => r.data),
};

// ─── Restaurant ───────────────────────────────────────────────────────────────
export const restaurantsApi = {
    get: (restaurantId: string) =>
        apiClient.get(`/restaurants/${restaurantId}`).then((r) => r.data),
};
