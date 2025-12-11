import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { LayoutDashboard, Users, Briefcase, FileText, Settings } from 'lucide-react';

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
                    <aside className="w-64 bg-slate-900 text-white flex flex-col">
                        <div className="p-6 border-b border-slate-800">
                            <h1 className="text-2xl font-bold tracking-wider">TMS 系统</h1>
                            <p className="text-xs text-slate-400 mt-1">移工生命週期管理</p>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            <a href="/" className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg text-white">
                                <LayoutDashboard size={20} />
                                <span>儀表板 (Dashboard)</span>
                            </a>
                            <a href="/workers" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
                                <Users size={20} />
                                <span>移工管理 (Workers)</span>
                            </a>
                            <a href="/employers" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
                                <Briefcase size={20} />
                                <span>雇主資料 (Employers)</span>
                            </a>
                            <a href="/recruitment" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
                                <FileText size={20} />
                                <span>招募進度 (Recruitment)</span>
                            </a>
                            <div className="pt-4 mt-4 border-t border-slate-800">
                                <a href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors">
                                    <Settings size={20} />
                                    <span>系統設定 (Settings)</span>
                                </a>
                            </div>
                        </nav>
                        <div className="p-4 bg-slate-950 text-xs text-center text-slate-500">
                            v1.0.0
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
