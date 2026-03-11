'use client';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
    categories: Array<{ id: string; name: string }>;
    activeId: string;
    onSelect: (id: string) => void;
}

export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll active tab into view
    useEffect(() => {
        const active = scrollRef.current?.querySelector('[data-active="true"]') as HTMLElement;
        active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [activeId]);

    return (
        <div
            ref={scrollRef}
            className="flex gap-2 px-4 overflow-x-auto scrollbar-none py-3 bg-white border-b border-gray-100 sticky top-14 z-20"
            style={{ scrollbarWidth: 'none' }}
        >
            {categories.map((cat) => {
                const isActive = cat.id === activeId;
                return (
                    <button
                        key={cat.id}
                        data-active={isActive}
                        onClick={() => onSelect(cat.id)}
                        className={cn(
                            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150',
                            isActive
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                    >
                        {cat.name}
                    </button>
                );
            })}
        </div>
    );
}
