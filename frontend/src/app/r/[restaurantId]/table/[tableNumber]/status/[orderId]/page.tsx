'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { joinOrderRoom, onOrderStatusUpdate } from '@/lib/socket';
import { OrderStatusTracker } from '@/components/order/OrderStatusTracker';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatPrice, formatTime } from '@/lib/utils';
import { Home } from 'lucide-react';
import Link from 'next/link';
import type { OrderStatus } from '@/types';

export default function OrderStatusPage() {
    const { restaurantId, tableNumber, orderId } = useParams<{
        restaurantId: string; tableNumber: string; orderId: string;
    }>();
    const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);

    // Fetch initial order
    const { data: order, isLoading, refetch } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => ordersApi.getById(orderId),
        refetchInterval: 15000, // poll every 15s as fallback
    });

    // Real-time socket updates
    useEffect(() => {
        joinOrderRoom(orderId);
        const unsub = onOrderStatusUpdate(({ orderId: id, status }) => {
            if (id === orderId) {
                setLiveStatus(status as OrderStatus);
                refetch();
            }
        });
        return unsub;
    }, [orderId, refetch]);

    if (isLoading || !order) return <PageLoader />;

    const displayStatus = liveStatus ?? order.status;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                    <h1 className="font-bold text-lg text-gray-900">Order Status</h1>
                    <Link href={`/r/${restaurantId}/table/${tableNumber}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Home size={20} />
                    </Link>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Status tracker */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <OrderStatusTracker
                        status={displayStatus}
                        orderNumber={order.order_number}
                    />
                </div>

                {/* Order details */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h2 className="font-semibold text-gray-900 mb-3">Order Details</h2>
                    <div className="space-y-2">
                        {(order.items ?? []).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                    <span className="text-gray-700">{item.quantity}× {item.menu_item_name}</span>
                                    {item.selected_options?.length > 0 && (
                                        <p className="text-xs text-gray-400">
                                            {item.selected_options.map((o) => o.choice_name).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <span className="font-medium text-gray-900">{formatPrice(item.total_price)}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                            </div>
                            {order.tax_amount > 0 && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Tax</span><span>{formatPrice(order.tax_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900">
                                <span>Total</span><span className="text-red-600">{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meta info */}
                <div className="bg-white rounded-2xl p-4 shadow-sm text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Table</span>
                        <span className="font-medium text-gray-900">{order.table_number ?? tableNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Payment</span>
                        <span className="font-medium text-gray-900 capitalize">
                            {order.payment_method === 'counter' ? 'Pay at Counter' : 'Card'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Ordered at</span>
                        <span className="font-medium text-gray-900">{formatTime(order.created_at)}</span>
                    </div>
                </div>

                {/* Back to menu */}
                <Link
                    href={`/r/${restaurantId}/table/${tableNumber}`}
                    className="block w-full text-center text-sm text-red-600 font-semibold py-3 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"
                >
                    + Order More Items
                </Link>
            </div>
        </div>
    );
}
