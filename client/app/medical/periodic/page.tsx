'use client';

import React from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PeriodicCheckupPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Link href="/portal" className="hover:text-blue-600 transition-colors">功能導覽</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">定期體檢</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/portal" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft size={20} className="text-slate-600" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-100 rounded-lg">
                                    <Activity className="text-teal-600" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">定期體檢管理</h1>
                                    <p className="text-sm text-slate-500">Periodic Medical Checkup</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="text-teal-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">6/18/30個月定期檢查</h2>
                    <p className="text-slate-600 mb-6">追蹤移工法定定期健康檢查時程</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
                        <p className="text-sm text-amber-800">
                            <span className="font-bold">🚧 功能開發中</span><br />
                            此頁面將提供以下功能：<br />
                            • 應體檢名單自動排程產生<br />
                            • 批次預約醫院<br />
                            • 逾期未體檢警示<br />
                            • 補充體檢(補充健檢)管理
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
