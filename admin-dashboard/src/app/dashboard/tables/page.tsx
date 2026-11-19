'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Table } from '@/types';
import toast from 'react-hot-toast';

export default function TablesPage() {
    const { user } = useAuthStore();
    const restaurantId = user?.restaurant_id!;
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [qrModal, setQrModal] = useState<{ table: Table; qrUrl: string } | null>(null);
    const [newTable, setNewTable] = useState({ table_number: '', capacity: '4', location: '' });

    const { data: tables = [], isLoading } = useQuery<Table[]>({
        queryKey: ['tables', restaurantId],
        queryFn: () => tablesApi.getAll(restaurantId),
        enabled: !!restaurantId,
    });

    const createTable = useMutation({
        mutationFn: () =>
            tablesApi.create(restaurantId, {
                table_number: parseInt(newTable.table_number),
                capacity: parseInt(newTable.capacity),
                location: newTable.location,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
            setShowForm(false);
            setNewTable({ table_number: '', capacity: '4', location: '' });
            toast.success('Table created');
        },
        onError: () => toast.error('Failed to create table'),
    });

    const deleteTable = useMutation({
        mutationFn: (id: string) => tablesApi.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
            toast.success('Table deleted');
        },
        onError: () => toast.error('Failed to delete table'),
    });

    const showQR = async (table: Table) => {
        try {
            const data = await tablesApi.getQR(table.id);
            setQrModal({ table, qrUrl: data.qr_code_url });
        } catch {
            toast.error('Failed to load QR code');
        }
    };

    const downloadQR = async (qrUrl: string, tableNumber: number) => {
        const res = await fetch(qrUrl);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `table-${tableNumber}-qr.png`;
        a.click();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
                    <p className="text-sm text-gray-500 mt-1">{tables.length} tables configured</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                    + Add Table
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">New Table</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Table Number *</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={newTable.table_number}
                                onChange={e => setNewTable(f => ({ ...f, table_number: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                            <input
                                type="number"
                                min="1"
                                value={newTable.capacity}
                                onChange={e => setNewTable(f => ({ ...f, capacity: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                placeholder="e.g. Patio, Bar"
                                value={newTable.location}
                                onChange={e => setNewTable(f => ({ ...f, location: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setShowForm(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={() => createTable.mutate()}
                            disabled={!newTable.table_number || createTable.isPending}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                            Create Table
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {tables.map(table => (
                        <div key={table.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                                <span className="text-lg font-bold text-red-600">{table.table_number}</span>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Seats {table.capacity}</p>
                                {table.location && <p className="text-xs text-gray-400">{table.location}</p>}
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${table.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {table.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5 w-full">
                                <button
                                    onClick={() => showQR(table)}
                                    className="w-full py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                                >
                                    View QR
                                </button>
                                <button
                                    onClick={() => { if (confirm(`Delete table ${table.table_number}?`)) deleteTable.mutate(table.id); }}
                                    className="w-full py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {qrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full flex flex-col items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Table {qrModal.table.table_number} QR Code</h2>
                        <img src={qrModal.qrUrl} alt="QR code" className="w-56 h-56" />
                        <p className="text-xs text-gray-400 text-center">Customers scan this QR to order from this table</p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => downloadQR(qrModal.qrUrl, qrModal.table.table_number)}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Download PNG
                            </button>
                            <button
                                onClick={() => setQrModal(null)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
