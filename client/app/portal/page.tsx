
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
        items: [
            {
                title: '移工管理 (Workers)',
                description: 'Manage worker profiles, timelines, and documents.',
                icon: Users,
                href: '/workers',
                color: 'bg-blue-50 text-blue-600',
                border: 'hover:border-blue-200'
            },
            {
                title: '雇主資料 (Employers)',
                description: 'Track employer details and recruitment letters.',
                icon: Briefcase,
                href: '/employers',
                color: 'bg-indigo-50 text-indigo-600',
                border: 'hover:border-indigo-200'
            }
        ]
    },
    {
        category: 'Operations',
        items: [
            {
                title: '儀表板 (Dashboard)',
                description: 'Overview of critical alerts and system status.',
                icon: LayoutDashboard,
                href: '/',
                color: 'bg-emerald-50 text-emerald-600',
                border: 'hover:border-emerald-200'
            },
            {
                title: '招募進度 (Recruitment)',
                description: 'Manage Job Orders and Interview Candidates.',
                icon: FileText,
                href: '/recruitment',
                color: 'bg-amber-50 text-amber-600',
                border: 'hover:border-amber-200'
            },
            {
                title: '功能導覽 (Portal)',
                description: 'View all system capabilities (You are here).',
                icon: Grid,
                href: '/portal',
                color: 'bg-purple-50 text-purple-600',
                border: 'hover:border-purple-200'
            }
        ]
    },
    {
        category: 'System',
        items: [
            {
                title: '系統設定 (Settings)',
                description: 'Configure system preferences and user access.',
                icon: Settings,
                href: '/settings',
                color: 'bg-slate-50 text-slate-600',
                border: 'hover:border-slate-200'
            }
        ]
    }
];

export default function PortalPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">功能導覽 (Feature Portal)</h1>
                <p className="text-slate-500 mt-2">Access all system modules from a central directory.</p>
            </div>

            <div className="space-y-10">
                {features.map((section) => (
                    <div key={section.category}>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-blue-600 pl-3">
                            {section.category}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.items.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className={`
                                        group bg-white rounded-xl shadow-sm border border-slate-200 p-6 
                                        transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${item.border}
                                    `}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-lg ${item.color}`}>
                                            <item.icon size={28} />
                                        </div>
                                        <ArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">
                                        {item.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
