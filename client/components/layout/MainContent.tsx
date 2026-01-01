"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export function MainContent({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <main className={`flex-1 overflow-auto min-w-0 bg-gray-50 ${isLoginPage ? '' : 'md:pl-[280px]'}`}>
            {children}
        </main>
    );
}
