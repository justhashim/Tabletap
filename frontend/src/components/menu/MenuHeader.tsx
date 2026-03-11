'use client';
import Image from 'next/image';
import { MapPin, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Restaurant } from '@/types';

interface MenuHeaderProps {
    restaurant: Restaurant;
    tableNumber: string;
    showBack?: boolean;
}

export function MenuHeader({ restaurant, tableNumber, showBack }: MenuHeaderProps) {
    const router = useRouter();

    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
                {showBack && (
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Go back"
                    >
                        <ChevronLeft size={22} />
                    </button>
                )}

                {restaurant.logo_url ? (
                    <Image
                        src={restaurant.logo_url}
                        alt={restaurant.name}
                        width={32}
                        height={32}
                        className="rounded-lg object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                            {restaurant.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{restaurant.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={10} />
                        <span>Table {tableNumber}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
