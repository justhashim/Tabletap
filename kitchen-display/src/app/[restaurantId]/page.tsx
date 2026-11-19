'use client';

import { useEffect, useState, useCallback } from 'react';
import { Order } from '@/types';
import { fetchActiveOrders } from '@/lib/api';
import { getKitchenSocket } from '@/lib/socket';
import KitchenBoard from '@/components/KitchenBoard';

export default function KitchenPage({ params }: { params: { restaurantId: string } }) {
  const { restaurantId } = params;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      const data = await fetchActiveOrders(restaurantId);
      setOrders(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    refresh();

    // Poll every 10s as fallback
    const poll = setInterval(refresh, 10_000);

    const socket = getKitchenSocket(restaurantId);
    socket.on('order:new', refresh);
    socket.on('order:statusUpdated', refresh);

    return () => {
      clearInterval(poll);
      socket.off('order:new', refresh);
      socket.off('order:statusUpdated', refresh);
    };
  }, [restaurantId, refresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-red-600" />
      </div>
    );
  }

  return <KitchenBoard orders={orders} restaurantId={restaurantId} lastUpdate={lastUpdate} onRefresh={refresh} />;
}
