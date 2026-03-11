'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { MenuItem } from '@/types';
import { formatPrice } from '@/lib/utils';

interface FeaturedBannerProps {
    item: MenuItem;
    currency: string;
    restaurantId: string;
    tableNumber: string;
}

export function FeaturedBanner({ item, currency, restaurantId, tableNumber }: FeaturedBannerProps) {
    return (
        <Link
            href={`/r/${restaurantId}/table/${tableNumber}/item/${item.id}`}
            className="block mx-4 rounded-3xl overflow-hidden bg-gradient-to-r from-red-600 to-red-500 relative h-40 shadow-lg"
        >
            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                <div>
                    <p className="text-red-100 text-xs font-medium uppercase tracking-wider">Featured</p>
                    <h2 className="text-white font-bold text-xl mt-1 leading-tight">{item.name}</h2>
                    {item.description && (
                        <p className="text-red-100 text-xs mt-1 line-clamp-2">{item.description}</p>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">{formatPrice(item.price, currency)}</span>
                    <span className="bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                        Order Now <ArrowRight size={12} />
                    </span>
                </div>
            </div>
            {item.image_url && (
                <div className="absolute right-0 top-0 w-2/5 h-full opacity-30">
                    <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                </div>
            )}
        </Link>
    );
}
