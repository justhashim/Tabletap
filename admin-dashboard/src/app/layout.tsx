import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { AdminProviders } from './providers';

export const metadata: Metadata = {
    title: 'TableTap Admin',
    description: 'Restaurant management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body>
                <AdminProviders>
                    {children}
                    <Toaster position="top-right" toastOptions={{ duration: 3500, style: { borderRadius: '12px', fontSize: '13px' } }} />
                </AdminProviders>
            </body>
        </html>
    );
}
