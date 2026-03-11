import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'TableTap – Scan. Tap. Dine.',
    description: 'QR-based restaurant ordering. No app download needed.',
    manifest: '/manifest.json',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: 'TableTap' },
    formatDetection: { telephone: false },
};

export const viewport: Viewport = {
    themeColor: '#DC2626',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body className="bg-gray-50">
                <Providers>
                    {children}
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            duration: 3000,
                            style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
                            success: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
                        }}
                    />
                </Providers>
            </body>
        </html>
    );
}
