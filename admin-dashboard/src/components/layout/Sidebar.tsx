'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ChefHat, LayoutDashboard, UtensilsCrossed, QrCode, BarChart3, LogOut, MonitorCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
    { href: '/dashboard', label: 'Orders', icon: LayoutDashboard },
    { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/dashboard/tables', label: 'Tables', icon: QrCode },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/kitchen', label: 'Kitchen', icon: MonitorCheck },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, clearAuth } = useAuthStore();
    const router = useRouter();

    function handleLogout() {
        clearAuth();
        router.push('/login');
    }

    return (
        <aside className="w-60 bg-gray-900 text-white flex flex-col h-full flex-shrink-0">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ChefHat size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-white">TableTap</p>
                        <p className="text-xs text-gray-400">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                active ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <Icon size={18} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User + logout */}
            <div className="px-3 py-4 border-t border-gray-800 space-y-1">
                <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-all"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
