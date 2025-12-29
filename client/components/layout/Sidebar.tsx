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
    Grid,
    Megaphone,
    Building2,
    AlertTriangle,
    LogOut,
    LogIn,
    UserX
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<{ label: string; top: number } | null>(null);
    const pathname = usePathname();

    // Hide Sidebar on login page
    if (pathname === '/login') {
        return null;
    }

    const navItems = [
        { href: '/', label: '儀表板', subLabel: 'Dashboard', icon: LayoutDashboard },
        { href: '/portal', label: '功能導覽', subLabel: 'Portal', icon: Grid },
        { href: '/alerts', label: '異常監控', subLabel: 'Alerts', icon: AlertTriangle },
        { href: '/health', label: '體檢管理', subLabel: 'Health Checks', icon: FileText },

        { href: '/workers', label: '移工管理', subLabel: 'Workers', icon: Users },
        { href: '/employers', label: '雇主管理', subLabel: 'Employers', icon: Building2 },
        { href: '/runaway', label: '失聯管理', subLabel: 'Runaway', icon: UserX },
        { href: '/recruitment-proofs', label: '國內求才', subLabel: 'Ind. Recruitment', icon: Megaphone },
    ];

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
        if (!collapsed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        // Since Sidebar is fixed/sticky, rect.top is absolute in viewport
        setHoveredItem({ label, top: rect.top });
    };

    return (
        <aside
            className={`
                bg-slate-900 text-white flex flex-col transition-all duration-300 relative z-40 flex-shrink-0
                ${collapsed ? 'w-20' : 'w-[280px]'} 
                shadow-2xl border-r border-slate-800
            `}
        >
            {/* Toggle Button */}
            <button
                onClick={() => {
                    setCollapsed(!collapsed);
                    setHoveredItem(null);
                }}
                className="absolute -right-3 top-9 bg-blue-600 rounded-full p-1.5 text-white shadow-xl hover:bg-blue-500 transition-transform active:scale-95 z-[60] border-2 border-slate-900"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Header */}
            <div className={`
                h-20 flex items-center border-b border-slate-800/50 
                ${collapsed ? 'justify-center' : 'px-6'}
            `}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="font-bold text-lg text-white">T</span>
                    </div>
                    {!collapsed && (
                        <div className="whitespace-nowrap transition-opacity duration-300">
                            <h1 className="text-xl font-bold tracking-tight text-white">TMS 系統</h1>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">移工管理系統</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={`
                                flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }
                                ${collapsed ? 'justify-center' : ''}
                            `}
                        >
                            <item.icon size={22} className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-white'}`} />

                            {!collapsed && (
                                <div className="whitespace-nowrap overflow-hidden flex-1">
                                    <span className="block text-sm font-medium">{item.label}</span>
                                    <span className="text-[10px] opacity-60 font-light block -mt-0.5">{item.subLabel}</span>
                                </div>
                            )}

                            {/* Active Indicator Strip (when expanded) */}
                            {isActive && !collapsed && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
                            )}
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="my-4 border-t border-slate-800/50 mx-2" />

                <Link
                    href="/settings"
                    onMouseEnter={(e) => handleMouseEnter(e, '系統設定')}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`
                        flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                        ${pathname === '/settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                        ${collapsed ? 'justify-center' : ''}
                    `}
                >
                    <Settings size={22} className="flex-shrink-0" />
                    {!collapsed && (
                        <div className="whitespace-nowrap overflow-hidden">
                            <span className="block text-sm font-medium">系統設定</span>
                        </div>
                    )}
                </Link>
            </nav>

            {/* User Profile / Footer */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-950/30">
                <div className={`flex items-center justify-between ${collapsed ? 'flex-col gap-4' : ''}`}>
                    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''} overflow-hidden`}>
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ring-2 ring-slate-800 flex-shrink-0">
                            <span className="text-xs font-bold text-slate-300">
                                {user?.username?.substring(0, 2).toUpperCase() || 'GU'}
                            </span>
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.username || 'Guest'}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.role || 'Visitor'}</p>
                            </div>
                        )}
                    </div>

                    <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
                        {/* Notifications */}
                        <NotificationBell />

                        {/* Auth Action */}
                        {user ? (
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                                title="登出"
                            >
                                <LogOut size={18} />
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                                title="登入"
                            >
                                <LogIn size={18} />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Tooltip Portal (Rendered via fixed position) */}
            {collapsed && hoveredItem && (
                <div
                    className="fixed z-50 left-20 ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-xl border border-slate-600 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
                    style={{ top: hoveredItem.top + 8 }} // Align roughly with center of item
                >
                    {hoveredItem.label}
                    {/* Tiny Arrow */}
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-slate-600 rotate-45" />
                </div>
            )}
        </aside>
    );
}
