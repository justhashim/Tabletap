export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (
        <div className={`${sizeMap[size]} border-3 border-red-200 border-t-red-600 rounded-full animate-spin ${className}`} />
    );
}

export function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center animate-pulse-slow">
                    <span className="text-white text-2xl font-bold">T</span>
                </div>
                <LoadingSpinner size="md" />
            </div>
        </div>
    );
}
