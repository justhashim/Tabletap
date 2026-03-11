'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { menuApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatPrice, cn } from '@/lib/utils';
import { Minus, Plus, Clock, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SelectedOption, MenuItemOption } from '@/types';

export default function ItemDetailPage() {
    const { restaurantId, tableNumber, itemId } = useParams<{
        restaurantId: string; tableNumber: string; itemId: string;
    }>();
    const router = useRouter();
    const { addItem } = useCartStore();

    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectedOption[]>>({});
    const [showIngredients, setShowIngredients] = useState(false);

    const { data: item, isLoading } = useQuery({
        queryKey: ['menuItem', restaurantId, itemId],
        queryFn: () => menuApi.getItem(restaurantId, itemId),
    });

    // Also get restaurant name for header
    const { data: menu } = useQuery({
        queryKey: ['menu', restaurantId],
        queryFn: () => menuApi.getFull(restaurantId),
    });

    if (isLoading || !item) return <PageLoader />;

    const restaurant = menu?.restaurant ?? { id: restaurantId, name: 'Restaurant', currency: 'USD', slug: '' };

    function handleOptionChange(option: MenuItemOption, choiceId: string, choiceName: string, priceModifier: number) {
        const sel: SelectedOption = {
            option_id: option.id,
            option_name: option.name,
            choice_id: choiceId,
            choice_name: choiceName,
            price_modifier: priceModifier,
        };

        if (option.type === 'single') {
            setSelectedOptions((prev) => ({ ...prev, [option.id]: [sel] }));
        } else {
            const current = selectedOptions[option.id] ?? [];
            const exists = current.find((s) => s.choice_id === choiceId);
            if (exists) {
                setSelectedOptions((prev) => ({ ...prev, [option.id]: current.filter((s) => s.choice_id !== choiceId) }));
            } else {
                setSelectedOptions((prev) => ({ ...prev, [option.id]: [...current, sel] }));
            }
        }
    }

    function isChoiceSelected(optionId: string, choiceId: string) {
        return (selectedOptions[optionId] ?? []).some((s) => s.choice_id === choiceId);
    }

    const allOptions = Object.values(selectedOptions).flat();
    const optionsTotal = allOptions.reduce((sum, o) => sum + o.price_modifier, 0);
    const totalPrice = (item.price + optionsTotal) * quantity;

    // Validate required options
    const missingRequired = (item.options ?? []).filter(
        (opt) => opt.is_required && !(selectedOptions[opt.id]?.length)
    );

    function handleAddToCart() {
        if (missingRequired.length > 0) {
            toast.error(`Please select ${missingRequired[0].name}`);
            return;
        }
        addItem({
            menuItemId: item!.id,
            name: item!.name,
            price: item!.price + optionsTotal,
            image_url: item!.image_url,
            quantity,
            selectedOptions: allOptions,
            notes: notes || undefined,
        });
        toast.success(`${item!.name} added to cart!`);
        router.back();
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <MenuHeader restaurant={restaurant as never} tableNumber={tableNumber} showBack />

            {/* Hero image */}
            <div className="relative h-64 bg-gray-200">
                {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">🍽️</div>
                )}
            </div>

            <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
                {/* Title & price */}
                <div>
                    <div className="flex items-start justify-between gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                        {item.is_popular && (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                                <Flame size={12} /> Popular
                            </span>
                        )}
                    </div>
                    {item.description && (
                        <p className="text-gray-500 text-sm mt-2 leading-relaxed">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-2xl font-extrabold text-red-600">{formatPrice(item.price, restaurant.currency)}</span>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                            <Clock size={14} />
                            <span>{item.preparation_time} min</span>
                        </div>
                        {item.calories && (
                            <div className="text-gray-400 text-sm">{item.calories} cal</div>
                        )}
                    </div>
                </div>

                {/* Options */}
                {(item.options ?? []).map((option) => (
                    <div key={option.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">{option.name}</h3>
                            {option.is_required && (
                                <span className="text-xs bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">Required</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {option.choices.map((choice) => {
                                const selected = isChoiceSelected(option.id, choice.id);
                                return (
                                    <button
                                        key={choice.id}
                                        onClick={() => handleOptionChange(option, choice.id, choice.name, choice.price_modifier)}
                                        className={cn(
                                            'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-150 text-left',
                                            selected ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                                    selected ? 'border-red-500 bg-red-500' : 'border-gray-300'
                                                )}
                                            >
                                                {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className="text-sm font-medium text-gray-800">{choice.name}</span>
                                        </div>
                                        {choice.price_modifier !== 0 && (
                                            <span className="text-sm text-gray-500">
                                                +{formatPrice(choice.price_modifier, restaurant.currency)}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Special notes */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3">Special Instructions</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any allergies or special requests? (optional)"
                        rows={3}
                        className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-400"
                    />
                </div>

                {/* Ingredients (collapsible) */}
                {item.ingredients?.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <button
                            onClick={() => setShowIngredients(!showIngredients)}
                            className="w-full flex items-center justify-between text-sm font-semibold text-gray-900"
                        >
                            Ingredients
                            {showIngredients ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {showIngredients && (
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                {item.ingredients.join(', ')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 max-w-lg mx-auto shadow-2xl">
                <div className="flex items-center gap-4">
                    {/* Quantity */}
                    <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-3 py-2">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-700 hover:text-red-600 transition-colors"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="font-bold text-gray-900 w-5 text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Add to cart */}
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleAddToCart}
                        disabled={!item.is_available}
                    >
                        {item.is_available
                            ? `Add to Cart – ${formatPrice(totalPrice, restaurant.currency)}`
                            : 'Currently Unavailable'
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
}
