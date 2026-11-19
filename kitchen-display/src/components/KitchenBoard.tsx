'use client';

import { Order } from '@/types';
import StatusColumn from './StatusColumn';

const COLUMNS: { key: Order['status']; label: string; color: string }[] = [
  { key: 'pending',   label: 'New Orders',  color: 'text-yellow-400 border-yellow-500' },
  { key: 'received',  label: 'Received',    color: 'text-blue-400 border-blue-500' },
  { key: 'preparing', label: 'Preparing',   color: 'text-orange-400 border-orange-500' },
  { key: 'ready',     label: 'Ready',       color: 'text-green-400 border-green-500' },
];

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface Props {
  orders: Order[];
  restaurantId: string;
  lastUpdate: Date;
  onRefresh: () => void;
}

export default function KitchenBoard({ orders, restaurantId, lastUpdate, onRefresh }: Props) {
  return (
    <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">TableTap Kitchen</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-400">
          <span>{orders.length} active orders</span>
          <span>Updated {formatTime(lastUpdate)}</span>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Columns */}
      <div className="flex-1 grid grid-cols-4 gap-0 overflow-hidden">
        {COLUMNS.map(col => (
          <StatusColumn
            key={col.key}
            status={col.key}
            label={col.label}
            colorClass={col.color}
            orders={orders.filter(o => o.status === col.key)}
            restaurantId={restaurantId}
          />
        ))}
      </div>
    </div>
  );
}
