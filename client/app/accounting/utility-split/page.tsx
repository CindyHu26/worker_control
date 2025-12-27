'use client';

import React from 'react';
import { Calculator, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UtilitySplitPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Link href="/portal" className="hover:text-blue-600 transition-colors">功能導覽</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">宿舍費分攤</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/portal" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft size={20} className="text-slate-600" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Calculator className="text-amber-600" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">宿舍水電費分攤</h1>
                                    <p className="text-sm text-slate-500">Utility Cost Splitting</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calculator className="text-amber-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">水電瓦斯費用計算</h2>
                    <p className="text-slate-600 mb-6">依據抄表度數計算宿舍移工應分攤金額</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
                        <p className="text-sm text-amber-800">
                            <span className="font-bold">🚧 功能開發中</span><br />
                            此頁面將提供以下功能：<br />
                            • 宿舍水電總帳單輸入<br />
                            • 費用分攤邏輯運算 (人頭均分/度數分攤)<br />
                            • 個別移工分攤表產生<br />
                            • 異常費用警示
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
