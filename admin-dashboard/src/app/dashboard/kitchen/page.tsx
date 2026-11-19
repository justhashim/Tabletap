'use client';

export default function KitchenRedirectPage() {
    return (
        <div className="p-6 flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-900">Kitchen Display System</h1>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                    The Kitchen Display runs as a separate full-screen app optimised for kitchen screens.
                    Open it on the kitchen device at the address below.
                </p>
            </div>
            <a
                href={process.env.NEXT_PUBLIC_KITCHEN_URL ?? 'http://localhost:3002'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors text-sm"
            >
                Open Kitchen Display →
            </a>
        </div>
    );
}
