'use client';

import { useState } from 'react';
import { Order } from '@/types';
import { updateOrderStatus } from '@/lib/api';
import { elapsed, timeAgo } from '@/lib/utils';

const NEXT_STATUS: Record<string, string> = {
  pending:   'received',
  received:  'preparing',
  preparing: 'ready',
  ready:     'served',
};

const NEXT_LABEL: Record<string, string> = {
  pending:   'Accept',
  received:  'Start Preparing',
  preparing: 'Mark Ready',
  ready:     'Mark Served',
};

interface Props { order: Order; restaurantId: string; }

export default function OrderCard({ order }: Props) {
  const [updating, setUpdating] = useState(false);
  const mins = elapsed(order.created_at);
  const isUrgent = mins >= 15;
  const next = NEXT_STATUS[order.status];

  const advance = async () => {
    if (!next) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, next);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isUrgent
        ? 'border-red-500 shadow-lg shadow-red-500/20'
        : 'border-gray-700'
    } bg-gray-800`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white font-mono">#{order.order_number}</span>
          {order.table_number && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">
              T{order.table_number}
            </span>
          )}
          {order.order_type === 'takeout' && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-900 text-blue-300 rounded">
              Takeout
            </span>
          )}
        </div>
        <span className={`text-xs font-mono font-semibold ${isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
          {timeAgo(order.created_at)}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="text-sm">
            <div className="flex justify-between">
              <span className="text-white font-medium">{item.quantity}× {item.menu_item_name}</span>
            </div>
            {item.selected_options && item.selected_options.length > 0 && (
              <div className="mt-0.5 pl-4 text-xs text-gray-400 space-y-0.5">
                {item.selected_options.map((opt, i) => (
                  <div key={i}>• {opt.option_name}: {opt.choice_name}</div>
                ))}
              </div>
            )}
            {item.special_instructions && (
              <div className="mt-0.5 pl-4 text-xs text-yellow-400">
                ⚠ {item.special_instructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Order-level notes */}
      {order.notes && (
        <div className="px-4 pb-3">
          <p className="text-xs text-yellow-400 bg-yellow-400/10 rounded-lg px-3 py-1.5">
            ⚠ {order.notes}
          </p>
        </div>
      )}

      {/* Action button */}
      {next && (
        <div className="px-4 pb-3">
          <button
            onClick={advance}
            disabled={updating}
            className="w-full py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {updating ? 'Updating…' : NEXT_LABEL[order.status]}
          </button>
        </div>
      )}
    </div>
  );
}
