'use client';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus, Trash2, X, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface CartDrawerProps {
    open: boolean;
    onClose: () => void;
    restaurantId: string;
    tableNumber: string;
    currency?: string;
}

export function CartDrawer({ open, onClose, restaurantId, tableNumber, currency = 'USD' }: CartDrawerProps) {
    const { items, updateQuantity, removeItem, subtotal } = useCartStore();

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] flex flex-col max-w-lg mx-auto"
                    >
                        {/* Handle + header */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                            <div className="w-10 h-1 bg-gray-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2" />
                            <div className="flex items-center gap-2 mt-2">
                                <ShoppingBag size={20} className="text-red-600" />
                                <h2 className="font-bold text-lg text-gray-900">Your Cart</h2>
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {items.length}
                                </span>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors mt-2">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                            {items.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingBag size={40} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">Your cart is empty</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                                            {item.selectedOptions.length > 0 && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {item.selectedOptions.map((o) => o.choice_name).join(', ')}
                                                </p>
                                            )}
                                            <p className="text-red-600 font-bold text-sm mt-1">
                                                {formatPrice(item.lineTotal, currency)}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-600"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-600"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="px-4 pb-6 pt-3 border-t border-gray-100 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-bold text-gray-900">{formatPrice(subtotal(), currency)}</span>
                                </div>
                                <Link href={`/r/${restaurantId}/table/${tableNumber}/checkout`} onClick={onClose}>
                                    <Button fullWidth size="lg">
                                        Proceed to Checkout → {formatPrice(subtotal(), currency)}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
