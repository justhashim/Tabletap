import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    restaurantId: string;
}

interface AuthStore {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
            clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
            isAuthenticated: () => !!get().accessToken && !!get().user,
        }),
        { name: 'tabletap-admin-auth' }
    )
);
