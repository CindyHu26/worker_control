"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useLayout } from '@/context/LayoutContext';

export function MainContent({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { isSidebarCollapsed } = useLayout();
    const isLoginPage = pathname === '/login';

    return (
        <main className={`flex-1 overflow-auto min-w-0 bg-gray-50 transition-all duration-300 ${isLoginPage ? '' : (isSidebarCollapsed ? 'md:pl-20' : 'md:pl-[280px]')}`}>
            {children}
        </main>
    );
}
