
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    Grid
} from 'lucide-react';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: '儀表板', subLabel: '(Dashboard)', icon: LayoutDashboard },
        { href: '/portal', label: '功能導覽', subLabel: '(Portal)', icon: Grid },
        { href: '/workers', label: '移工管理', subLabel: '(Workers)', icon: Users },
        { href: '/employers', label: '雇主資料', subLabel: '(Employers)', icon: Briefcase },
        { href: '/recruitment', label: '招募進度', subLabel: '(Recruitment)', icon: FileText },
    ];

    return (
        <aside
            className={`
                bg-slate-900 text-white flex flex-col transition-all duration-300 relative
                ${collapsed ? 'w-20' : 'w-64'}
            `}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-8 bg-blue-600 rounded-full p-1 text-white shadow-lg hover:bg-blue-700 z-10"
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Header */}
            <div className={`p-6 border-b border-slate-800 flex items-center ${collapsed ? 'justify-center' : ''}`}>
                {collapsed ? (
                    <span className="font-bold text-xl tracking-wider">T</span>
                ) : (
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider">TMS 系统</h1>
                        <p className="text-xs text-slate-400 mt-1">移工生命週期管理</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group
                                ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}
                                ${collapsed ? 'justify-center' : ''}
                            `}
                            title={collapsed ? item.label : ''}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            {!collapsed && (
                                <div className="whitespace-nowrap overflow-hidden">
                                    <span className="block">{item.label}</span>
                                    <span className="text-xs opacity-70">{item.subLabel}</span>
                                </div>
                            )}
                        </Link>
                    );
                })}

                {/* Divider for Settings */}
                <div className="pt-4 mt-4 border-t border-slate-800">
                    <Link
                        href="/settings"
                        className={`
                            flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors
                            ${pathname === '/settings' ? 'bg-blue-600 text-white' : ''}
                            ${collapsed ? 'justify-center' : ''}
                        `}
                        title={collapsed ? '系統設定' : ''}
                    >
                        <Settings size={20} className="flex-shrink-0" />
                        {!collapsed && (
                            <div className="whitespace-nowrap">
                                <span className="block">系統設定</span>
                                <span className="text-xs opacity-70">(Settings)</span>
                            </div>
                        )}
                    </Link>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 bg-slate-950 text-xs text-center text-slate-500 overflow-hidden whitespace-nowrap">
                {collapsed ? 'v1.0' : 'v1.0.0'}
            </div>
        </aside>
    );
}
