import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '../components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'TMS - Taiwan Migrant Worker System',
    description: 'Migrant Worker Lifecycle Management',
};

import { Providers } from './providers';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-TW">
            <body className={`${inter.className} bg-gray-50 flex h-screen`}>
                <Providers>
                    {/* Sidebar */}
                    <Sidebar />

                    {/* Main Content */}
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
