import { Order } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchActiveOrders(restaurantId: string): Promise<Order[]> {
  const res = await fetch(
    `${API_URL}/api/orders?restaurantId=${restaurantId}&statuses=pending,received,preparing,ready`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.data ?? data;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
}
