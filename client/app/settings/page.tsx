'use client';

import React from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
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
        title: '主檔資料管理',
        description: '管理下拉選單資料：合約類別、招募類型、國籍等',
        href: '/system/references',
        icon: <Database className="h-6 w-6 text-blue-500" />
    },
    {
        title: '仲介公司設定',
        description: '管理國內仲介公司基本資料',
        href: '/settings/agencies',
        icon: <Building2 className="h-6 w-6 text-green-500" />
    },
    {
        title: '費用項目定義',
        description: '設定帳務計費項目',
        href: '/settings/billing-item-definitions',
        icon: <Receipt className="h-6 w-6 text-amber-500" />
    },
    {
        title: '文件範本管理',
        description: '管理各類文件範本及欄位設定',
        href: '/settings/templates',
        icon: <FileText className="h-6 w-6 text-purple-500" />
    },
    {
        title: '批次處理',
        description: '批次作業設定',
        href: '/settings/batch',
        icon: <Settings2 className="h-6 w-6 text-gray-500" />
    },
];

export default function SettingsPage() {
    return (
        <PageContainer
            title="系統設定 (Settings)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '系統設定' }
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
        </PageContainer>
    );
}
