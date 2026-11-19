'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { MenuItem, MenuCategory } from '@/types';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MenuPage() {
    const { user } = useAuthStore();
    const restaurantId = user?.restaurant_id!;
    const qc = useQueryClient();
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    const { data: categories = [] } = useQuery<MenuCategory[]>({
        queryKey: ['menu', restaurantId],
        queryFn: () => menuApi.getCategories(restaurantId),
        enabled: !!restaurantId,
    });

    const toggleAvailability = useMutation({
        mutationFn: (item: MenuItem) =>
            menuApi.updateItem(item.id, { ...item, is_available: !item.is_available }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['menu', restaurantId] }),
        onError: () => toast.error('Failed to update item'),
    });

    const toggleFeatured = useMutation({
        mutationFn: (item: MenuItem) =>
            menuApi.updateItem(item.id, { ...item, is_featured: !item.is_featured }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['menu', restaurantId] }),
        onError: () => toast.error('Failed to update item'),
    });

    const deleteItem = useMutation({
        mutationFn: (id: string) => menuApi.deleteItem(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['menu', restaurantId] });
            toast.success('Item deleted');
        },
        onError: () => toast.error('Failed to delete item'),
    });

    const allItems = categories.flatMap(c => c.items ?? []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
                    <p className="text-sm text-gray-500 mt-1">{allItems.length} items across {categories.length} categories</p>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setShowForm(true); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                    + Add Item
                </button>
            </div>

            {categories.map(category => (
                <div key={category.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-800">{category.name}</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {(category.items ?? []).map(item => (
                            <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                                {item.image_url && (
                                    <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                        {item.is_featured && (
                                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">Featured</span>
                                        )}
                                        {!item.is_available && (
                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">Unavailable</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="font-semibold text-gray-900">{formatPrice(item.base_price)}</span>
                                    <button
                                        onClick={() => toggleFeatured.mutate(item)}
                                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        {item.is_featured ? 'Unfeature' : 'Feature'}
                                    </button>
                                    <button
                                        onClick={() => toggleAvailability.mutate(item)}
                                        className={`text-xs px-2 py-1 rounded border transition-colors ${item.is_available
                                                ? 'border-gray-200 hover:bg-gray-50'
                                                : 'border-green-300 text-green-700 hover:bg-green-50'
                                            }`}
                                    >
                                        {item.is_available ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                        onClick={() => { setEditingItem(item); setShowForm(true); }}
                                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('Delete this item?')) deleteItem.mutate(item.id); }}
                                        className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(category.items ?? []).length === 0 && (
                            <p className="px-5 py-4 text-sm text-gray-400">No items in this category</p>
                        )}
                    </div>
                </div>
            ))}

            {showForm && (
                <MenuItemModal
                    item={editingItem}
                    categories={categories}
                    restaurantId={restaurantId}
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        qc.invalidateQueries({ queryKey: ['menu', restaurantId] });
                    }}
                />
            )}
        </div>
    );
}

function MenuItemModal({
    item,
    categories,
    restaurantId,
    onClose,
    onSuccess,
}: {
    item: MenuItem | null;
    categories: MenuCategory[];
    restaurantId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        name: item?.name ?? '',
        description: item?.description ?? '',
        base_price: item?.base_price?.toString() ?? '',
        category_id: item?.category_id ?? categories[0]?.id ?? '',
        is_available: item?.is_available ?? true,
        is_featured: item?.is_featured ?? false,
        dietary_info: item?.dietary_info?.join(', ') ?? '',
        allergens: item?.allergens?.join(', ') ?? '',
        prep_time_minutes: item?.prep_time_minutes?.toString() ?? '',
        calories: item?.calories?.toString() ?? '',
    });
    const [submitting, setSubmitting] = useState(false);

    const set = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
            if (fileRef.current?.files?.[0]) fd.append('image', fileRef.current.files[0]);

            if (item) {
                await menuApi.updateItem(item.id, fd as any);
                toast.success('Item updated');
            } else {
                await menuApi.createItem(fd as any);
                toast.success('Item created');
            }
            onSuccess();
        } catch {
            toast.error('Failed to save item');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">{item ? 'Edit Item' : 'Add Item'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input required value={form.name} onChange={e => set('name', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
                            <input required type="number" step="0.01" min="0" value={form.base_price} onChange={e => set('base_price', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select required value={form.category_id} onChange={e => set('category_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prep time (min)</label>
                            <input type="number" min="0" value={form.prep_time_minutes} onChange={e => set('prep_time_minutes', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                            <input type="number" min="0" value={form.calories} onChange={e => set('calories', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dietary info (comma-separated)</label>
                        <input placeholder="vegetarian, gluten-free, vegan" value={form.dietary_info} onChange={e => set('dietary_info', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergens (comma-separated)</label>
                        <input placeholder="nuts, dairy, gluten" value={form.allergens} onChange={e => set('allergens', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_available} onChange={e => set('is_available', e.target.checked)}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                            <span className="text-sm text-gray-700">Available</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                            <span className="text-sm text-gray-700">Featured</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                        <input ref={fileRef} type="file" accept="image/*"
                            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-600 hover:file:bg-red-100" />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                            {submitting ? 'Saving…' : item ? 'Save Changes' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
