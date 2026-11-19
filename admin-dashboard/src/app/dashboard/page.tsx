'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { getAdminSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { Order } from '@/types';
import { formatPrice, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_TABS = ['all', 'pending', 'received', 'preparing', 'ready', 'served', 'cancelled'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    received: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    served: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
};

const NEXT_STATUS: Record<string, string> = {
    pending: 'received',
    received: 'preparing',
    preparing: 'ready',
    ready: 'served',
};

export default function DashboardPage() {
    const { user } = useAuthStore();
    const restaurantId = user?.restaurant_id;
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<StatusTab>('all');

    const { data: orders = [], isLoading } = useQuery<Order[]>({
        queryKey: ['orders', restaurantId],
        queryFn: () => ordersApi.getAll(restaurantId!),
        enabled: !!restaurantId,
        refetchInterval: 15_000,
    });

    const updateMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
            ordersApi.updateStatus(orderId, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['orders', restaurantId] }),
        onError: () => toast.error('Failed to update order status'),
    });

    useEffect(() => {
        if (!restaurantId) return;
        const socket = getAdminSocket(restaurantId);

        const refresh = () => qc.invalidateQueries({ queryKey: ['orders', restaurantId] });

        socket.on('order:new', (order: Order) => {
            toast.success(`New order #${order.order_number} — Table ${order.table_number}`);
            refresh();
        });
        socket.on('order:statusUpdated', refresh);

        return () => {
            socket.off('order:new', refresh);
            socket.off('order:statusUpdated', refresh);
        };
    }, [restaurantId, qc]);

    const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

    const counts = STATUS_TABS.reduce<Record<string, number>>((acc, s) => {
        acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
        return acc;
    }, {});

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Orders</h1>
                <p className="text-sm text-gray-500 mt-1">Real-time order feed — updates automatically</p>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${activeTab === tab
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {tab} {counts[tab] > 0 && <span className="ml-1 opacity-75">({counts[tab]})</span>}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium">No orders</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onAdvance={() => updateMutation.mutate({ orderId: order.id, status: NEXT_STATUS[order.status] })}
                            isUpdating={updateMutation.isPending}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function OrderCard({ order, onAdvance, isUpdating }: { order: Order; onAdvance: () => void; isUpdating: boolean }) {
    const next = NEXT_STATUS[order.status];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                    <span className="font-bold text-gray-900">#{order.order_number}</span>
                    {order.table_number && (
                        <span className="ml-2 text-sm text-gray-500">Table {order.table_number}</span>
                    )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                </span>
            </div>

            <div className="px-4 py-3 space-y-1 min-h-[80px]">
                {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.quantity}× {item.menu_item_name}</span>
                        <span className="text-gray-500">{formatPrice(item.item_total)}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-400">{timeAgo(order.created_at)}</div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{formatPrice(order.total_amount)}</span>
                    {next && (
                        <button
                            onClick={onAdvance}
                            disabled={isUpdating}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors capitalize"
                        >
                            Mark {next}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
