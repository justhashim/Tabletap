'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
        const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1';

        const variants = {
            primary: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md focus:ring-red-500',
            secondary: 'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-900 border border-gray-200 focus:ring-gray-300',
            ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 focus:ring-gray-300',
            danger: 'bg-red-50 hover:bg-red-100 text-red-600 focus:ring-red-400',
        };

        const sizes = {
            sm: 'py-2 px-4 text-sm',
            md: 'py-3 px-6 text-sm',
            lg: 'py-4 px-8 text-base',
        };

        return (
            <button
                ref={ref}
                className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
