'use client';

import React from 'react';
import Link from 'next/link';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Building2,
    Receipt,
    FileText,
    Database,
    Settings2
} from 'lucide-react';

interface SettingItem {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
}

const settingsItems: SettingItem[] = [
    {
        title: 'ä¸»æ?è³‡æ?ç®¡ç?',
        description: 'ç®¡ç?ä¸‹æ??¸å–®è³‡æ?ï¼šå?ç´„é??¥ã€æ??Ÿé??‹ã€å?ç±ç?',
        href: '/system/references',
        icon: <Database className="h-6 w-6 text-blue-500" />
    },
    {
        title: 'ä»²ä??¬å¸è¨­å?',
        description: 'ç®¡ç??‹å…§ä»²ä??¬å¸?ºæœ¬è³‡æ?',
        href: '/settings/agencies',
        icon: <Building2 className="h-6 w-6 text-green-500" />
    },
    {
        title: 'è²»ç”¨?…ç›®å®šç¾©',
        description: 'è¨­å?å¸³å?è¨ˆè²»?…ç›®',
        href: '/settings/billing-item-definitions',
        icon: <Receipt className="h-6 w-6 text-amber-500" />
    },
    {
        title: '?‡ä»¶ç¯„æœ¬ç®¡ç?',
        description: 'ç®¡ç??„é??‡ä»¶ç¯„æœ¬?Šæ?ä½è¨­å®?,
        href: '/settings/templates',
        icon: <FileText className="h-6 w-6 text-purple-500" />
    },
    {
        title: '?¹æ¬¡?•ç?',
        description: '?¹æ¬¡ä½œæ¥­è¨­å?',
        href: '/settings/batch',
        icon: <Settings2 className="h-6 w-6 text-gray-500" />
    },
];

export default function SettingsPage() {
    return (
        <StandardPageLayout
            title="ç³»çµ±è¨­å? (Settings)"
            breadcrumbs={[
                { label: 'é¦–é?', href: '/' },
                { label: 'ç³»çµ±è¨­å?' }
            ]}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settingsItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    {item.icon}
                                </div>
                                <CardTitle className="text-base">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{item.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </StandardPageLayout>
    );
}
