'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/store/cartStore';
import { menuApi, ordersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowLeft, MapPin, Package, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

type OrderType = 'dine_in' | 'takeout';
type PaymentMethod = 'counter' | 'card';

export default function CheckoutPage() {
    const { restaurantId, tableNumber } = useParams<{ restaurantId: string; tableNumber: string }>();
    const router = useRouter();
    const { items, subtotal, clearCart } = useCartStore();

    const [orderType, setOrderType] = useState<OrderType>('dine_in');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('counter');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const { data: menu } = useQuery({
        queryKey: ['menu', restaurantId],
        queryFn: () => menuApi.getFull(restaurantId),
    });

    const restaurant = menu?.restaurant;
    const currency = restaurant?.currency ?? 'USD';

    // Tax rate isn't exposed publicly; show approximate
    const sub = subtotal();
    const taxRate = 0.0875; // display estimate
    const tax = sub * taxRate;
    const total = sub + tax;

    async function handlePlaceOrder() {
        if (items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        setLoading(true);
        try {
            const order = await ordersApi.place({
                restaurantId,
                tableNumber,
                orderType,
                customerName: customerName || undefined,
                customerPhone: customerPhone || undefined,
                notes: notes || undefined,
                paymentMethod,
                items: items.map((ci) => ({
                    menuItemId: ci.menuItemId,
                    quantity: ci.quantity,
                    notes: ci.notes,
                    selectedOptions: ci.selectedOptions,
                })),
            });
            clearCart();
            router.push(`/r/${restaurantId}/table/${tableNumber}/status/${order.id}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to place order';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-36">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="font-bold text-lg text-gray-900">Checkout</h1>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* Order type */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h2 className="font-semibold text-gray-900 mb-3">Order Type</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {([
                            { value: 'dine_in' as OrderType, label: 'Dine In', sub: 'Served at your table', icon: MapPin },
                            { value: 'takeout' as OrderType, label: 'Take Away', sub: 'Pick up at counter', icon: Package },
                        ] as const).map(({ value, label, sub, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => setOrderType(value)}
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                                    orderType === value ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                )}
                            >
                                <Icon size={22} className={orderType === value ? 'text-red-600' : 'text-gray-400'} />
                                <span className={cn('font-semibold text-sm', orderType === value ? 'text-red-600' : 'text-gray-700')}>{label}</span>
                                <span className="text-xs text-gray-400">{sub}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Customer info (optional) */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h2 className="font-semibold text-gray-900 mb-3">Your Details <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Your name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                        />
                        <input
                            type="tel"
                            placeholder="Phone number (for takeout)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h2 className="font-semibold text-gray-900 mb-3">Payment Method</h2>
                    <div className="space-y-2">
                        {([
                            { value: 'counter' as PaymentMethod, label: 'Pay at Counter', sub: 'Cash or card when collected', icon: Banknote },
                            { value: 'card' as PaymentMethod, label: 'Pay Online', sub: 'Secure card payment', icon: CreditCard },
                        ] as const).map(({ value, label, sub, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => setPaymentMethod(value)}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                                    paymentMethod === value ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                )}
                            >
                                <Icon size={22} className={paymentMethod === value ? 'text-red-600' : 'text-gray-400'} />
                                <div className="flex-1">
                                    <p className={cn('font-semibold text-sm', paymentMethod === value ? 'text-red-600' : 'text-gray-700')}>{label}</p>
                                    <p className="text-xs text-gray-400">{sub}</p>
                                </div>
                                {paymentMethod === value && <CheckCircle2 size={18} className="text-red-600" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Order notes */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h2 className="font-semibold text-gray-900 mb-3">Order Notes <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
                    <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any allergies or notes for the kitchen?"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                    />
                </div>

                {/* Order summary */}
                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                    <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}× {item.name}</span>
                            <span className="font-medium text-gray-900">{formatPrice(item.lineTotal, currency)}</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span><span>{formatPrice(sub, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tax (est.)</span><span>{formatPrice(tax, currency)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900">
                            <span>Total</span><span className="text-red-600">{formatPrice(total, currency)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Place order button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 max-w-lg mx-auto shadow-2xl">
                <Button fullWidth size="lg" loading={loading} onClick={handlePlaceOrder}>
                    Place Order – {formatPrice(total, currency)}
                </Button>
            </div>
        </div>
    );
}
