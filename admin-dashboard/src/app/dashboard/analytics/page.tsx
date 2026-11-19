'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { DailyAnalytics, PopularItem } from '@/types';
import { formatPrice } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area,
} from 'recharts';

export default function AnalyticsPage() {
    const { user } = useAuthStore();
    const restaurantId = user?.restaurant_id!;

    const { data: daily, isLoading: loadingDaily } = useQuery<DailyAnalytics>({
        queryKey: ['analytics:daily', restaurantId],
        queryFn: () => analyticsApi.getDaily(restaurantId),
        enabled: !!restaurantId,
    });

    const { data: popular = [], isLoading: loadingPopular } = useQuery<PopularItem[]>({
        queryKey: ['analytics:popular', restaurantId],
        queryFn: () => analyticsApi.getPopular(restaurantId, 14),
        enabled: !!restaurantId,
    });

    const { data: trend = [], isLoading: loadingTrend } = useQuery<{ date: string; revenue: number; orders: number }[]>({
        queryKey: ['analytics:trend', restaurantId],
        queryFn: () => analyticsApi.getTrend(restaurantId),
        enabled: !!restaurantId,
    });

    const totalRevenue = trend.reduce((s, d) => s + Number(d.revenue), 0);
    const totalOrders = trend.reduce((s, d) => s + d.orders, 0);

    const kpis = [
        { label: "Today's Revenue", value: formatPrice(daily?.total_revenue ?? 0), sub: `${daily?.total_orders ?? 0} orders` },
        { label: 'Avg Order Value', value: daily?.total_orders ? formatPrice(daily.total_revenue / daily.total_orders) : '$0.00', sub: 'today' },
        { label: '30-Day Revenue', value: formatPrice(totalRevenue), sub: `${totalOrders} orders` },
        { label: 'Avg Daily Revenue', value: trend.length ? formatPrice(totalRevenue / trend.length) : '$0.00', sub: 'last 30 days' },
    ];

    const isLoading = loadingDaily || loadingPopular || loadingTrend;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Performance overview for your restaurant</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(kpi => (
                    <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-sm text-gray-500">{kpi.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            {/* 30-day revenue trend */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue — Last 30 Days</h2>
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={trend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} width={50} />
                        <Tooltip formatter={(v: number) => formatPrice(v)} labelFormatter={d => `Date: ${d}`} />
                        <Area type="monotone" dataKey="revenue" stroke="#DC2626" fill="url(#revenueGrad)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Hourly orders today */}
            {daily?.hourly_orders && daily.hourly_orders.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Orders by Hour — Today</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={daily.hourly_orders} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={h => `${h}:00`} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip labelFormatter={h => `${h}:00`} />
                            <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Popular items */}
            {popular.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Top Items — Last 14 Days</h2>
                    <div className="space-y-3">
                        {popular.slice(0, 10).map((item, idx) => {
                            const max = popular[0].total_sold;
                            const pct = Math.round((item.total_sold / max) * 100);
                            return (
                                <div key={item.id} className="flex items-center gap-3">
                                    <span className="w-5 text-sm text-gray-400 font-medium">{idx + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-800">{item.name}</span>
                                            <span className="text-gray-500">{item.total_sold} sold · {formatPrice(item.revenue)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
