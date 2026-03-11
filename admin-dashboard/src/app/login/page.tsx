'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) { toast.error('Please fill in all fields'); return; }
        setLoading(true);
        try {
            const data = await authApi.login(email, password);
            setAuth(data.user, data.accessToken, data.refreshToken);
            toast.success(`Welcome back, ${data.user.name}!`);
            router.push('/dashboard');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                        <ChefHat size={30} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">TableTap Admin</h1>
                    <p className="text-gray-400 text-sm mt-1">Restaurant Management Portal</p>
                </div>

                {/* Form card */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl">
                    <h2 className="font-bold text-xl text-gray-900 mb-6">Sign In</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@restaurant.com"
                                required
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="input pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    tabIndex={-1}
                                >
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 justify-center disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        New restaurant?{' '}
                        <a href="/register" className="text-red-600 font-medium hover:underline">Register here</a>
                    </p>
                </div>

                {/* Demo credentials */}
                <div className="mt-4 bg-white/5 rounded-2xl p-4 text-xs text-gray-400 text-center">
                    <p className="font-medium mb-1 text-gray-300">Demo credentials</p>
                    <p>owner@crimsonfork.com / Admin123!</p>
                </div>
            </div>
        </div>
    );
}
