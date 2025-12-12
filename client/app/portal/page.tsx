"use client";

import React from 'react';
import Link from 'next/link';
import {
    Users,
    Briefcase,
    FileText,
    LayoutDashboard,
    Grid,
    Settings,
    ArrowRight
} from 'lucide-react';

const features = [
    {
        category: 'Management',
        description: 'Core entities and profiles',
        items: [
            {
                title: '移工管理 (Workers)',
                description: 'Manage worker profiles, timelines, and documents.',
                icon: Users,
                href: '/workers',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                gradient: 'group-hover:from-blue-50 group-hover:to-white'
            },
            {
                title: '雇主資料 (Employers)',
                description: 'Track employer details and recruitment letters.',
                icon: Briefcase,
                href: '/employers',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                gradient: 'group-hover:from-indigo-50 group-hover:to-white'
            }
        ]
    },
    {
        category: 'Recruitment',
        description: 'Hiring and job orders',
        items: [
            {
                title: '招募進度 (Recruitment)',
                description: 'Manage Job Orders, Interview Candidates, and Progress.',
                icon: FileText,
                href: '/recruitment',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                gradient: 'group-hover:from-amber-50 group-hover:to-white'
            }
        ]
    },
    {
        category: 'System',
        description: 'Platform status and settings',
        items: [
            {
                title: '儀表板 (Dashboard)',
                description: 'System overview, critical alerts, and statistics.',
                icon: LayoutDashboard,
                href: '/',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                gradient: 'group-hover:from-emerald-50 group-hover:to-white'
            },
            {
                title: '系統設定 (Settings)',
                description: 'Configure system preferences, user access, and logs.',
                icon: Settings,
                href: '/settings',
                color: 'text-slate-600',
                bg: 'bg-slate-50',
                gradient: 'group-hover:from-slate-50 group-hover:to-white'
            }
        ]
    }
];

export default function PortalPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">功能導覽 (Feature Portal)</h1>
                <p className="text-slate-500 mt-2 text-lg">Central hub for all system modules and capabilities.</p>
            </div>

            <div className="space-y-12">
                {features.map((section) => (
                    <div key={section.category} className="space-y-4">
                        <div className="flex items-baseline gap-4 border-b border-slate-200 pb-2">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {section.category}
                            </h2>
                            <span className="text-sm text-slate-400 font-medium">{section.description}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.items.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className={`
                                        group relative bg-white rounded-2xl p-6 border border-slate-200
                                        shadow-sm hover:shadow-xl hover:shadow-slate-200/50 
                                        transition-all duration-300 hover:-translate-y-1
                                        overflow-hidden
                                    `}
                                >
                                    {/* Gradient Background on Hover */}
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br transition-opacity duration-300 ${item.gradient}`} />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${item.bg} ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                                <item.icon size={28} strokeWidth={1.5} />
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
