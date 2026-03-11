'use client';
import { CheckCircle2, ChefHat, Clock3, Truck, XCircle, Package } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode; description: string }[] = [
    { status: 'received', label: 'Order Received', icon: <CheckCircle2 size={20} />, description: 'The kitchen has your order' },
    { status: 'preparing', label: 'Preparing', icon: <ChefHat size={20} />, description: 'Your food is being made' },
    { status: 'ready', label: 'Ready', icon: <Package size={20} />, description: 'Your order is ready!' },
    { status: 'served', label: 'Served', icon: <Truck size={20} />, description: 'Enjoy your meal 🎉' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'received', 'preparing', 'ready', 'served'];

interface OrderStatusTrackerProps {
    status: OrderStatus;
    orderNumber: number;
    estimatedMinutes?: number;
}

export function OrderStatusTracker({ status, orderNumber, estimatedMinutes }: OrderStatusTrackerProps) {
    if (status === 'cancelled') {
        return (
            <div className="flex flex-col items-center gap-3 py-8">
                <XCircle size={48} className="text-red-400" />
                <p className="font-semibold text-gray-700">Order Cancelled</p>
                <p className="text-sm text-gray-500 text-center">Please speak to a staff member if you have questions.</p>
            </div>
        );
    }

    const currentIdx = STATUS_ORDER.indexOf(status);

    return (
        <div className="space-y-6">
            {/* Order number pill */}
            <div className="flex justify-center">
                <div className="bg-red-50 text-red-600 px-6 py-2 rounded-full">
                    <span className="text-sm font-medium">Order </span>
                    <span className="font-bold">#{String(orderNumber).padStart(4, '0')}</span>
                </div>
            </div>

            {estimatedMinutes && status !== 'served' && (
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <Clock3 size={16} />
                    <span>Est. ready in <strong>{estimatedMinutes} minutes</strong></span>
                </div>
            )}

            {/* Steps */}
            <div className="space-y-4">
                {STEPS.map((step, idx) => {
                    const stepIdx = STATUS_ORDER.indexOf(step.status);
                    const completed = stepIdx < currentIdx || status === 'served';
                    const active = stepIdx === currentIdx;
                    const pending = stepIdx > currentIdx;

                    return (
                        <div key={step.status} className="flex items-center gap-4">
                            {/* Icon circle */}
                            <div
                                className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500',
                                    completed && 'bg-green-500 text-white',
                                    active && 'bg-red-600 text-white shadow-lg shadow-red-200 scale-110 animate-pulse-slow',
                                    pending && 'bg-gray-100 text-gray-300'
                                )}
                            >
                                {step.icon}
                            </div>

                            {/* Text */}
                            <div className="flex-1">
                                <p className={cn('font-semibold text-sm', pending ? 'text-gray-300' : 'text-gray-900')}>
                                    {step.label}
                                </p>
                                {active && (
                                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                                )}
                            </div>

                            {completed && <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
