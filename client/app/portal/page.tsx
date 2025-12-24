"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Users, Briefcase, FileText, UserPlus,
    Plane, Stamp, FileCheck, LogOut, Files,
    Stethoscope, Activity, Building2,
    DollarSign, Receipt, Calculator, ClipboardList,
    Home, Bed, Zap, Settings, Shield,
    ArrowRightLeft, Users2, History, Search, Landmark,
    Globe2, Megaphone
} from 'lucide-react';

// Data Definition
const categories = [
    {
        title: '核心業務 (Core Business)',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        items: [
            { title: '候選人管理', desc: '履歷匯入與人才庫', icon: UserPlus, href: '/candidates' },
            { title: '招募訂單管理', desc: '職缺媒合與面試追蹤', icon: Briefcase, href: '/job-orders' },
            { title: '移工管理', desc: '基本資料、證件與合約', icon: Users, href: '/workers' },
            { title: '雇主管理', desc: '雇主資料與需求追蹤', icon: Briefcase, href: '/employers' },
            { title: '招募單管理', desc: '國外引進與履歷挑選', icon: FileText, href: '/recruitment' },
            { title: '聘僱派工', desc: '指派服務團隊與任務', icon: UserPlus, href: '/deployments' }
        ]
    },
    {
        title: '行政函文 (Govt Compliance)',
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        items: [
            { title: '國內求才證明', desc: '國內招募與求才登記', icon: Megaphone, href: '/recruitment-proofs' },
            { title: '入國通報', desc: '通報勞工局與案號登錄', icon: Plane, href: '/govt/entry-report' },
            { title: '簽證申請', desc: '駐台辦事處函文製作', icon: Stamp, href: '/govt/visa' },
            { title: '聘僱許可申請', desc: '勞動部許可函申請', icon: FileCheck, href: '/govt/permit' },
            { title: '離境報備', desc: '解約與離境搭機安排', icon: LogOut, href: '/govt/departure' },
            { title: '函文範本管理', desc: '系統標準文件維護', icon: Files, href: '/documents/templates' }
        ]
    },
    {
        title: '衛政與健檢 (Medical)',
        bg: 'bg-teal-50',
        text: 'text-teal-800',
        items: [
            { title: '初次體檢', desc: '入國後3日內體檢', icon: Stethoscope, href: '/medical/initial' },
            { title: '定期體檢', desc: '6/18/30個月定期檢查', icon: Activity, href: '/medical/periodic' },
            { title: '複檢追蹤', desc: '體檢異常項目追蹤', icon: ClipboardList, href: '/medical/followup' },
            { title: '衛生局核備', desc: '體檢函文核備作業', icon: Building2, href: '/medical/approval' }
        ]
    },
    {
        title: '財務與會計 (Finance)',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        items: [
            { title: '每月服務費', desc: '產生與確認服務費帳單', icon: DollarSign, href: '/accounting/service-fees' },
            { title: '規費紀錄', desc: '居留證與健保費代墊', icon: Receipt, href: '/accounting/government-fees' },
            { title: '宿舍費分攤', desc: '計算水電與租金分攤', icon: Calculator, href: '/accounting/utility-split' },
            { title: '帳單管理', desc: '應收帳款與催收紀錄', icon: ClipboardList, href: '/accounting/invoices' }
        ]
    },
    {
        title: '宿舍管理 (Dormitory)',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        items: [
            { title: '宿舍環境', desc: '各據點宿舍資料維護', icon: Home, href: '/dormitories' },
            { title: '房間與床位', desc: '床位分配與異動紀錄', icon: Bed, href: '/dormitories/assign' },
            { title: '水電抄表', desc: '每月度數抄錄作業', icon: Zap, href: '/dormitories/meter-reading' }
        ]
    },
    {
        title: '系統工具 (System Tools)',
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        items: [
            { title: '批次轉移', desc: '大量移工轉換雇主', icon: ArrowRightLeft, href: '/system/batch-transfer' },
            { title: '服務團隊', desc: '業務與雙語人員指派', icon: Users2, href: '/system/teams' },
            { title: '操作歷程', desc: '系統存取與修改紀錄', icon: History, href: '/system/audit-logs' },
            { title: '員工管理', desc: '管理公司內部員工資料', icon: Users2, href: '/employees' }
        ]
    },
    {
        title: '基本設定 (Basic Settings)',
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        items: [
            { title: '部門管理', desc: '維護公司內部部門組織', icon: Users, href: '/departments' },
            { title: '雇主類別', desc: '維護雇主分類代碼與名稱', icon: Files, href: '/employer-categories' },
            { title: '工種設定', desc: '維護工種資料與費用設定', icon: Briefcase, href: '/job-types' },
            { title: '行業別設定', desc: '維護行業別代碼與多語言名稱', icon: Building2, href: '/industries' },
            { title: '行業職稱', desc: '維護各行業別下的標準職稱', icon: Users2, href: '/industry-job-titles' },
            { title: '國內仲介公司', desc: '管理使用系統的仲介公司資料', icon: Building2, href: '/domestic-agencies' },
            { title: '國外仲介公司', desc: '管理合作的國外仲介資料', icon: Plane, href: '/partner-agencies' },
            { title: '互貿合約管理', desc: '維護國外仲介合約與授權', icon: FileCheck, href: '/partner-agency-contracts' },
            { title: '銀行管理', desc: '維護銀行代碼與分行資料', icon: Landmark, href: '/banks' },
            { title: '貸款銀行管理', desc: '維護外勞貸款銀行資料', icon: DollarSign, href: '/loan-banks' },
            { title: '合約類別', desc: '維護系統合約分類', icon: FileCheck, href: '/contract-types' },
            { title: '國別管理', desc: '維護外勞來源國與代碼', icon: Globe2, href: '/countries' }
        ]
    }
];

export default function PortalPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories;

        return categories.map(cat => ({
            ...cat,
            items: cat.items.filter(item =>
                item.title.includes(searchTerm) ||
                item.desc.includes(searchTerm)
            )
        })).filter(cat => cat.items.length > 0);
    }, [searchTerm]);

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
            {/* Header & Search */}
            <div className="mb-10 max-w-3xl">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-6">服務導覽 (Service Directory)</h1>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg placeholder:text-slate-400"
                        placeholder="搜尋功能... (Search features e.g., '體檢', '帳單')"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

                {filteredCategories.map((category) => (
                    <div key={category.title} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid">
                        {/* Column Header */}
                        <div className={`px-4 py-3 border-b border-slate-100 ${category.bg} font-bold ${category.text} flex items-center gap-2`}>
                            <h2 className="text-base tracking-wide">{category.title}</h2>
                        </div>

                        {/* List Items */}
                        <div className="divide-y divide-slate-50">
                            {category.items.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="group flex flex-col p-4 hover:bg-blue-50 transition-colors duration-200"
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            <item.icon size={18} />
                                        </div>
                                        <span className="font-bold text-slate-800 group-hover:text-blue-800 text-[15px]">
                                            {item.title}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400 pl-[42px] group-hover:text-slate-500">
                                        {item.desc}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

            </div>

            {filteredCategories.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                    <p className="text-lg">找不到相關功能 (No results for "{searchTerm}")</p>
                </div>
            )}
        </div>
    );
}
