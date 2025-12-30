'use client';

import React from 'react';
import { Receipt, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GovtFeesPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Link href="/portal" className="hover:text-blue-600 transition-colors">功能導覽</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">規費紀錄</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/portal" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft size={20} className="text-slate-600" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Receipt className="text-amber-600" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">規費代墊管理</h1>
                                    <p className="text-sm text-slate-500">Government Fees Tracking</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Receipt className="text-amber-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">政府規費與代墊款</h2>
                    <p className="text-slate-600 mb-6">登記與請款各項代墊予政府之規費</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
                        <p className="text-sm text-amber-800">
                            <span className="font-bold">🚧 功能開發中</span><br />
                            此頁面將提供以下功能：<br />
                            • 居留證費代墊紀錄<br />
                            • 健保費代墊紀錄<br />
                            • 其他行政規費登記<br />
                            • 費用請款單產生
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
