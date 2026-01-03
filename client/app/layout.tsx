import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '../components/layout/Sidebar';
import { MainContent } from '../components/layout/MainContent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'TMS - Taiwan Migrant Worker System',
    description: 'Migrant Worker Lifecycle Management',
};

import { Providers } from './providers';
import { LayoutProvider } from '@/context/LayoutContext';
import CommandPalette from '@/components/CommandPalette';
import { Toaster } from 'sonner';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-TW" suppressHydrationWarning>
            <body className={`${inter.className} bg-gray-50 flex h-screen`} suppressHydrationWarning>
                <Providers>
                    <LayoutProvider>
                        {/* Sidebar */}
                        <Sidebar />
                        <CommandPalette />

                        {/* Main Content */}
                        <MainContent>
                            {children}
                        </MainContent>
                        <Toaster position="top-right" richColors />
                    </LayoutProvider>
                </Providers>
            </body>
        </html>
    );
}
