import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem, SelectedOption } from '@/types';

interface CartStore {
    restaurantId: string | null;
    tableNumber: string | null;
    items: CartItem[];

    // Actions
    setContext: (restaurantId: string, tableNumber: string) => void;
    addItem: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    removeItem: (cartItemId: string) => void;
    updateNotes: (cartItemId: string, notes: string) => void;
    clearCart: () => void;

    // Computed
    totalItems: () => number;
    subtotal: () => number;
}

function calcLineTotal(basePrice: number, options: SelectedOption[], qty: number): number {
    const optionPrice = options.reduce((sum, o) => sum + o.price_modifier, 0);
    return (basePrice + optionPrice) * qty;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            restaurantId: null,
            tableNumber: null,
            items: [],

            setContext: (restaurantId, tableNumber) => set({ restaurantId, tableNumber }),

            addItem: (item) => {
                const { items } = get();
                // Check if same item + same options exists
                const existing = items.find(
                    (c) =>
                        c.menuItemId === item.menuItemId &&
                        JSON.stringify(c.selectedOptions) === JSON.stringify(item.selectedOptions) &&
                        c.notes === item.notes
                );

                if (existing) {
                    set({
                        items: items.map((c) =>
                            c.id === existing.id
                                ? { ...c, quantity: c.quantity + item.quantity, lineTotal: calcLineTotal(c.price, c.selectedOptions, c.quantity + item.quantity) }
                                : c
                        ),
                    });
                } else {
                    const newItem: CartItem = {
                        ...item,
                        id: uuidv4(),
                        lineTotal: calcLineTotal(item.price, item.selectedOptions, item.quantity),
                    };
                    set({ items: [...items, newItem] });
                }
            },

            updateQuantity: (cartItemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(cartItemId);
                    return;
                }
                set({
                    items: get().items.map((c) =>
                        c.id === cartItemId
                            ? { ...c, quantity, lineTotal: calcLineTotal(c.price, c.selectedOptions, quantity) }
                            : c
                    ),
                });
            },

            removeItem: (cartItemId) =>
                set({ items: get().items.filter((c) => c.id !== cartItemId) }),

            updateNotes: (cartItemId, notes) =>
                set({ items: get().items.map((c) => (c.id === cartItemId ? { ...c, notes } : c)) }),

            clearCart: () => set({ items: [] }),

            totalItems: () => get().items.reduce((sum, c) => sum + c.quantity, 0),

            subtotal: () => get().items.reduce((sum, c) => sum + c.lineTotal, 0),
        }),
        {
            name: 'tabletap-cart',
            // Only persist items, restaurantId and tableNumber
            partialize: (state) => ({
                restaurantId: state.restaurantId,
                tableNumber: state.tableNumber,
                items: state.items,
            }),
        }
    )
);
