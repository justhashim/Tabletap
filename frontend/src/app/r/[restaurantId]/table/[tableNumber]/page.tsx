'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { menuApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { FeaturedBanner } from '@/components/menu/FeaturedBanner';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ShoppingBag, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MenuItem } from '@/types';

export default function MenuPage() {
    const { restaurantId, tableNumber } = useParams<{ restaurantId: string; tableNumber: string }>();
    const router = useRouter();
    const { items, addItem, setContext, totalItems } = useCartStore();

    const [activeCategoryId, setActiveCategoryId] = useState<string>('');
    const [cartOpen, setCartOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

    // Set cart context
    useEffect(() => {
        setContext(restaurantId, tableNumber);
    }, [restaurantId, tableNumber, setContext]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['menu', restaurantId],
        queryFn: () => menuApi.getFull(restaurantId),
    });

    // Set initial active category
    useEffect(() => {
        if (data?.categories?.length && !activeCategoryId) {
            setActiveCategoryId(data.categories[0].id);
        }
    }, [data, activeCategoryId]);

    if (isLoading) return <PageLoader />;

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-4xl mb-3">😕</p>
                    <h2 className="font-bold text-gray-800 mb-2">Menu unavailable</h2>
                    <p className="text-gray-500 text-sm">Could not load the menu. Please scan the QR code again.</p>
                </div>
            </div>
        );
    }

    const { restaurant, categories, featured } = data;

    // Search filtering
    const searchResults: MenuItem[] = searchQuery.length > 1
        ? categories.flatMap((c) =>
            c.items.filter((i) =>
                i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : [];

    function handleQuickAdd(item: MenuItem) {
        addItem({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
            quantity: 1,
            selectedOptions: [],
        });
        toast.success(`${item.name} added!`);
    }

    function handleCategorySelect(id: string) {
        setActiveCategoryId(id);
        categoryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const cartCount = totalItems();

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <MenuHeader restaurant={restaurant} tableNumber={tableNumber} />

            {/* Search bar */}
            <div className="bg-white px-4 pt-3 pb-2">
                <div className="relative max-w-lg mx-auto">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search your favourite food..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                        className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Search results overlay */}
            {searchQuery.length > 1 && (
                <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{searchResults.length} results</p>
                    {searchResults.map((item) => (
                        <MenuItemCard
                            key={item.id}
                            item={item}
                            currency={restaurant.currency}
                            compact
                            onClick={() => router.push(`/r/${restaurantId}/table/${tableNumber}/item/${item.id}`)}
                            onQuickAdd={() => handleQuickAdd(item)}
                        />
                    ))}
                    {searchResults.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-8">No items found for &quot;{searchQuery}&quot;</p>
                    )}
                </div>
            )}

            {/* Normal menu (hidden during search) */}
            {!searchQuery && (
                <>
                    {/* Featured banner */}
                    {featured.length > 0 && (
                        <div className="pt-4 max-w-lg mx-auto">
                            <FeaturedBanner
                                item={featured[0]}
                                currency={restaurant.currency}
                                restaurantId={restaurantId}
                                tableNumber={tableNumber}
                            />
                        </div>
                    )}

                    {/* Category tabs */}
                    <CategoryTabs
                        categories={categories}
                        activeId={activeCategoryId}
                        onSelect={handleCategorySelect}
                    />

                    {/* Menu sections */}
                    <div className="max-w-lg mx-auto px-4 pt-4 space-y-8">
                        {categories.map((category) => (
                            <section
                                key={category.id}
                                ref={(el) => { categoryRefs.current[category.id] = el; }}
                            >
                                <h2 className="font-bold text-lg text-gray-900 mb-3">{category.name}</h2>
                                {category.items.length === 0 ? (
                                    <p className="text-sm text-gray-400">No items in this category yet.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {category.items.map((item) => (
                                            <MenuItemCard
                                                key={item.id}
                                                item={item}
                                                currency={restaurant.currency}
                                                onClick={() => router.push(`/r/${restaurantId}/table/${tableNumber}/item/${item.id}`)}
                                                onQuickAdd={() => handleQuickAdd(item)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </>
            )}

            {/* Floating Cart Button */}
            {cartCount > 0 && (
                <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-30">
                    <button
                        onClick={() => setCartOpen(true)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-red-700 rounded-xl p-1.5">
                                <ShoppingBag size={18} />
                            </div>
                            <span className="font-semibold">{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</span>
                        </div>
                        <span className="font-bold">View Cart →</span>
                    </button>
                </div>
            )}

            <CartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                restaurantId={restaurantId}
                tableNumber={tableNumber}
                currency={restaurant.currency}
            />
        </div>
    );
}
