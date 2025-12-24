'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

interface BillingPlanItem {
    id?: string;
    billingDate: string;
    amount: number;
    itemCategory: string;
    description?: string;
    isProrated?: boolean;
}

interface BillingPlanReviewProps {
    plan: {
        id: string;
        deploymentId: string;
        totalAmount: number;
        items: BillingPlanItem[];
    };
    deploymentInfo: {
        workerName: string;
        startDate: string;
        endDate?: string;
        passportExpiry?: string;
        dormitoryName?: string;
        serviceFee: number;
    };
    onConfirm: () => void;
}

export default function BillingPlanReview({ plan, deploymentInfo, onConfirm }: BillingPlanReviewProps) {
    const [items, setItems] = useState(plan.items);

    const handleDelete = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleAmountChange = (index: number, newAmount: string) => {
        const newItems = [...items];
        newItems[index].amount = Number(newAmount);
        setItems(newItems);
    };

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Left Sidebar: Context Info */}
            <div className="w-full lg:w-80 bg-slate-50 p-6 rounded-lg border border-slate-200 h-fit space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">計算依據</h3>

                <div className="space-y-4 text-sm">
                    <div>
                        <span className="text-slate-500 block">移工姓名</span>
                        <span className="font-medium text-slate-900">{deploymentInfo.workerName}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block">合約期間</span>
                        <span className="font-medium text-slate-900">
                            {format(new Date(deploymentInfo.startDate), 'yyyy-MM-dd')} ~
                            {deploymentInfo.endDate ? format(new Date(deploymentInfo.endDate), 'yyyy-MM-dd') : '3年'}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 block">護照效期</span>
                        <span className="font-medium text-amber-600">
                            {deploymentInfo.passportExpiry ? format(new Date(deploymentInfo.passportExpiry), 'yyyy-MM-dd') : '未登錄'}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500 block">目前宿舍</span>
                        <span className="font-medium text-slate-900">{deploymentInfo.dormitoryName || '自住/無'}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block">服務費率</span>
                        <span className="font-medium text-slate-900">${deploymentInfo.serviceFee} / 月</span>
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600">總計金額</span>
                        <span className="text-2xl font-bold text-blue-600">${total.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={onConfirm}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <CheckCircle2 size={18} />
                        確認並生成帳單
                    </button>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        確認後將正式寫入應收帳款紀錄
                    </p>
                </div>
            </div>

            {/* Right: Interactive Table */}
            <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">預覽收款計畫 ({items.length} 期)</h2>
                    <div className="flex gap-2">
                        {/* Filters could go here */}
                    </div>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">預計收款日</th>
                                <th className="px-6 py-3">項目</th>
                                <th className="px-6 py-3">金額</th>
                                <th className="px-6 py-3">計算說明</th>
                                <th className="px-6 py-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-900">
                                        {format(new Date(item.billingDate), 'yyyy-MM-dd')}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${item.itemCategory === 'SERVICE_FEE' ? 'bg-blue-100 text-blue-800' :
                                                item.itemCategory === 'ARC_FEE' ? 'bg-purple-100 text-purple-800' :
                                                    item.itemCategory === 'DORMITORY_FEE' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                            {item.itemCategory}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="number"
                                            value={item.amount}
                                            onChange={(e) => handleAmountChange(idx, e.target.value)}
                                            className="w-24 px-2 py-1 border rounded text-right focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-slate-500">
                                        {item.isProrated && <span className="text-amber-600 mr-2">[破月]</span>}
                                        {item.description}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(idx)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
