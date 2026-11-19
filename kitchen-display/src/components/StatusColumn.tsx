import { Order } from '@/types';
import OrderCard from './OrderCard';

interface Props {
  status: Order['status'];
  label: string;
  colorClass: string;
  orders: Order[];
  restaurantId: string;
}

export default function StatusColumn({ status, label, colorClass, orders, restaurantId }: Props) {
  return (
    <div className="flex flex-col border-r border-gray-700 last:border-r-0 overflow-hidden">
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-700 ${colorClass}`}>
        <span className="font-bold text-sm uppercase tracking-wider">{label}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 font-mono">
          {orders.length}
        </span>
      </div>

      {/* Order cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
            No orders
          </div>
        ) : (
          orders
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map(order => (
              <OrderCard key={order.id} order={order} restaurantId={restaurantId} />
            ))
        )}
      </div>
    </div>
  );
}
