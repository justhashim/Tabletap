'use client';
import Image from 'next/image';
import { Plus, Clock, Flame } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface MenuItemCardProps {
    item: MenuItem;
    currency?: string;
    onClick: () => void;
    onQuickAdd?: () => void;
    compact?: boolean;
}

export function MenuItemCard({ item, currency = 'USD', onClick, onQuickAdd, compact }: MenuItemCardProps) {
    if (compact) {
        return (
            <button
                onClick={onClick}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-150 text-left"
            >
                {item.image_url && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                    {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                    )}
                    <p className="text-sm font-bold text-red-600 mt-1">{formatPrice(item.price, currency)}</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onQuickAdd?.(); }}
                    className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:bg-red-700 transition-colors"
                    aria-label={`Add ${item.name}`}
                >
                    <Plus size={16} />
                </button>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-red-200 hover:shadow-md transition-all duration-200 text-left"
        >
            <div className="relative h-40 bg-gray-100 overflow-hidden">
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">🍽️</div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {item.is_popular && (
                        <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame size={10} /> Popular
                        </span>
                    )}
                    {!item.is_available && (
                        <span className="bg-gray-800/80 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            Unavailable
                        </span>
                    )}
                </div>
                {/* Quick add */}
                <button
                    onClick={(e) => { e.stopPropagation(); onQuickAdd?.(); }}
                    className="absolute bottom-2 right-2 w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    aria-label={`Add ${item.name}`}
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="p-3">
                <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</p>
                {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-red-600">{formatPrice(item.price, currency)}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />
                        <span>{item.preparation_time}m</span>
                    </div>
                </div>
            </div>
        </button>
    );
}
