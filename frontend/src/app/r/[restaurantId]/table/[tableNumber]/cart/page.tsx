'use client';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
    const { restaurantId, tableNumber } = useParams<{ restaurantId: string; tableNumber: string }>();
    const { items, updateQuantity, removeItem, subtotal } = useCartStore();
    const router = useRouter();

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 gap-4">
                <ShoppingBag size={60} className="text-gray-200" />
                <h2 className="font-bold text-xl text-gray-700">Your cart is empty</h2>
                <p className="text-gray-400 text-sm text-center">Add items from the menu to start your order.</p>
                <Link href={`/r/${restaurantId}/table/${tableNumber}`}>
                    <Button variant="primary">Browse Menu</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="font-bold text-lg text-gray-900">My Cart</h1>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                        {items.length}
                    </span>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            {item.selectedOptions.length > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {item.selectedOptions.map((o) => o.choice_name).join(' · ')}
                                </p>
                            )}
                            {item.notes && (
                                <p className="text-xs text-amber-600 mt-0.5 italic">Note: {item.notes}</p>
                            )}
                            <p className="font-bold text-red-600 mt-2">{formatPrice(item.lineTotal)}</p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <button
                                onClick={() => removeItem(item.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                                aria-label="Remove"
                            >
                                <Trash2 size={16} />
                            </button>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2.5 py-1.5">
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="text-gray-500 hover:text-red-600 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add more items */}
                <Link href={`/r/${restaurantId}/table/${tableNumber}`} className="block">
                    <button className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors">
                        + Add more items
                    </button>
                </Link>
            </div>

            {/* Order summary sticky bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 max-w-lg mx-auto shadow-2xl">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatPrice(subtotal())}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Tax calculated at checkout</span>
                    </div>
                </div>
                <Link href={`/r/${restaurantId}/table/${tableNumber}/checkout`}>
                    <Button fullWidth size="lg">Proceed to Checkout</Button>
                </Link>
            </div>
        </div>
    );
}
