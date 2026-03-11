import Link from 'next/link';
import { QrCode, ChefHat, Zap, Star } from 'lucide-react';

// ─── Splash / Landing page ────────────────────────────────────────────────────
// Customers normally land here only via QR code; this page serves as a fallback

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white flex flex-col">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 pointer-events-none" />

            <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
                {/* Logo */}
                <div className="w-24 h-24 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                    <ChefHat size={44} className="text-white" />
                </div>

                <h1 className="text-5xl font-extrabold tracking-tight mb-2">TableTap</h1>
                <p className="text-red-200 text-xl font-medium mb-10">Scan. Tap. Dine.</p>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {[
                        { icon: QrCode, text: 'Scan QR' },
                        { icon: Zap, text: 'Instant Order' },
                        { icon: Star, text: 'No Wait' },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm font-medium">
                            <Icon size={15} />
                            {text}
                        </div>
                    ))}
                </div>

                <p className="text-red-100 text-sm max-w-xs leading-relaxed mb-8">
                    Scan the QR code on your table to view the menu and order directly from your phone.
                </p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-sm text-center text-red-100">
                        📷 Scan the QR code on your table to get started
                    </div>
                    <Link
                        href="/admin/login"
                        className="text-red-200 hover:text-white text-sm underline underline-offset-2 transition-colors"
                    >
                        Restaurant Admin →
                    </Link>
                </div>
            </div>

            <footer className="text-center pb-6 text-red-300/60 text-xs">
                &copy; {new Date().getFullYear()} TableTap
            </footer>
        </main>
    );
}
