import axios, { AxiosError } from 'axios';
import type { FullMenu, Order, Table, DailyAnalytics, PopularItem } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const apiClient = axios.create({ baseURL: `${BASE}/api`, timeout: 15000 });

// Inject token from localStorage on each request
apiClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem('tabletap-admin-auth');
            if (raw) {
                const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
                const token = parsed?.state?.accessToken;
                if (token) config.headers.Authorization = `Bearer ${token}`;
            }
        } catch { }
    }
    return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
    login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }).then((r) => r.data),
    register: (data: Record<string, string>) => apiClient.post('/auth/register', data).then((r) => r.data),
    me: () => apiClient.get('/auth/me').then((r) => r.data),
};

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const menuApi = {
    getFull: (restaurantId: string) => apiClient.get<FullMenu>(`/menu/${restaurantId}`).then((r) => r.data),
    createCategory: (data: Record<string, unknown>) => apiClient.post('/menu/categories', data).then((r) => r.data),
    updateCategory: (id: string, data: Record<string, unknown>) => apiClient.put(`/menu/categories/${id}`, data).then((r) => r.data),
    deleteCategory: (id: string) => apiClient.delete(`/menu/categories/${id}`),
    createItem: (data: Record<string, unknown>) => apiClient.post('/menu/items', data).then((r) => r.data),
    updateItem: (id: string, data: Record<string, unknown>) => apiClient.put(`/menu/items/${id}`, data).then((r) => r.data),
    deleteItem: (id: string) => apiClient.delete(`/menu/items/${id}`),
    uploadImage: (id: string, file: File) => {
        const fd = new FormData();
        fd.append('image', file);
        return apiClient.post(`/menu/items/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
    },
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
    getAll: (restaurantId: string, params?: Record<string, string>) =>
        apiClient.get<Order[]>(`/orders/${restaurantId}`, { params }).then((r) => r.data),
    updateStatus: (orderId: string, status: string) =>
        apiClient.put(`/orders/${orderId}/status`, { status }).then((r) => r.data),
};

// ─── Tables ───────────────────────────────────────────────────────────────────
export const tablesApi = {
    getAll: (restaurantId: string) => apiClient.get<Table[]>(`/tables/${restaurantId}`).then((r) => r.data),
    create: (data: Partial<Table>) => apiClient.post<Table>('/tables', data).then((r) => r.data),
    update: (id: string, data: Partial<Table>) => apiClient.put<Table>(`/tables/${id}`, data).then((r) => r.data),
    delete: (id: string) => apiClient.delete(`/tables/${id}`),
    getQR: (id: string) => apiClient.get<{ dataUrl: string; cloudinaryUrl: string; tableNumber: string }>(`/tables/${id}/qr`).then((r) => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
    daily: (restaurantId: string, date?: string) =>
        apiClient.get<DailyAnalytics>(`/analytics/daily/${restaurantId}`, { params: { date } }).then((r) => r.data),
    popular: (restaurantId: string) =>
        apiClient.get<PopularItem[]>(`/analytics/popular/${restaurantId}`).then((r) => r.data),
    revenue: (restaurantId: string) =>
        apiClient.get(`/analytics/revenue/${restaurantId}`).then((r) => r.data),
};
