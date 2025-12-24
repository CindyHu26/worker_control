'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, AlertTriangle, Trash2, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface BillingPlanItem {
    id?: string;
    billingDate: string;
    amount: number;
    itemCategory: string;
    description?: string;
    isProrated?: boolean;
    status: string;
}

interface DiffItem extends BillingPlanItem {
    suggestedAmount?: number;
    diffAmount: number;
    isDifferent: boolean;
    existingAmount?: number | null;
}

interface BillingPlanReviewProps {
    plan: {
        id: string;
        deploymentId: string;
        totalAmount: number;
        status: string;
        reviewStatus: 'NORMAL' | 'NEEDS_REVIEW';
        reviewReason?: string;
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
    onConfirm?: () => void; // Optional if we handle confirm internally
}

export default function BillingPlanReview({ plan, deploymentInfo, onConfirm }: BillingPlanReviewProps) {
    const [items, setItems] = useState<BillingPlanItem[]>(plan.items || []);
    const [diffItems, setDiffItems] = useState<DiffItem[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [viewMode, setViewMode] = useState<'NORMAL' | 'DIFF'>(plan.reviewStatus === 'NEEDS_REVIEW' ? 'DIFF' : 'NORMAL');

    // Accept set of IDs
    const [acceptedIndices, setAcceptedIndices] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (plan.reviewStatus === 'NEEDS_REVIEW' || viewMode === 'DIFF') {
            runSimulation();
        }
    }, [plan.id, viewMode]);

    const runSimulation = async () => {
        setIsSimulating(true);
        try {
            const res = await fetch(`/api/billing-plans/${plan.id}/simulate`, { method: 'POST' });
            const data = await res.json();

            if (data.items) {
                // Merge simulation data with current view items? 
                // Actually simulation returns comprehensive list including diffs.
                // We should use that for display in Diff Mode.
                setDiffItems(data.items);
            }
        } catch (error) {
            console.error('Simulation failed', error);
            toast.error('無法載入模擬數據');
        } finally {
            setIsSimulating(false);
        }
    };

    const handleAcceptSuggestion = (idx: number, suggestion: DiffItem) => {
        const newSet = new Set(acceptedIndices);
        if (newSet.has(idx)) {
            newSet.delete(idx);
            // Revert to original (Wait, complex if mixed. Simply: we build "Final Items" based on selection)
        } else {
            newSet.add(idx);
        }
        setAcceptedIndices(newSet);
    };

    const handleAcceptAll = () => {
        const allDiffIndices = diffItems.map((_, idx) => idx);
        setAcceptedIndices(new Set(allDiffIndices));
    };

    // Construct the "Final View" items based on Acceptance
    // If in Diff Mode, we use DiffItems. If accepted, use suggestedAmount. If not, use existingAmount.
    // If Normal Mode, use local `items`.

    const getFinalItems = () => {
        if (viewMode === 'NORMAL') return items;

        return diffItems.map((d, idx) => {
            if (acceptedIndices.has(idx) && d.suggestedAmount !== undefined) {
                return { ...d, amount: d.suggestedAmount, description: d.description }; // Use new desc too
            }
            // Logic for "Original": Use existingAmount. 
            // Note: DiffItem has `amount` as suggested amount?
            // `simulatePlan` returns `items` as suggested items with extra fields.
            // So `d.amount` is SUGGESTED. `d.existingAmount` is ORIGINAL.
            // If NOT accepted, we should use `existingAmount`. 
            // BUT if it's a NEW item (existingAmount null), and not accepted, maybe we exclude it?
            // Requirement: "Checkbox: Accept Suggestion".

            // If I assume "Unchecked" means "Keep Old", then:
            // If Old exists, use Old.
            // If Old doesn't exist (New Item), then Unchecked means "Don't Add" -> Exclude?

            // Let's simplify: 
            // We return a list of items to SAVE.

            if (d.existingAmount !== null && d.existingAmount !== undefined) {
                return { ...d, amount: d.existingAmount };
            }
            // It's a new item, but user didn't accept it. Should we skip?
            // Usually "Suggested" means "This is correct".
            // Let's assume unchecking a NEW item means "Ignore".
            return null;
        }).filter(Boolean) as BillingPlanItem[];
    };

    const handleConfirm = async () => {
        const finalItems = getFinalItems();
        try {
            const res = await fetch(`/api/billing-plans/${plan.id}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: finalItems })
            });
            if (res.ok) {
                toast.success('帳務計畫已更新');
                if (onConfirm) onConfirm();
                else window.location.reload();
            } else {
                toast.error('更新失敗');
            }
        } catch (e) {
            toast.error('Error saving plan');
        }
    };

    // Render Logic
    // If NEEDS_REVIEW -> Show Banner.

    return (
        <div className="flex flex-col h-full space-y-4">
            {plan.reviewStatus === 'NEEDS_REVIEW' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm">
                    <div className="flex items-center">
                        <AlertTriangle className="text-yellow-500 mr-3" />
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-yellow-800">檢測到資料異動，請審核帳務建議</h3>
                            <p className="text-sm text-yellow-700">{plan.reviewReason}</p>
                        </div>
                        <div className="flex gap-2">
                            {viewMode === 'NORMAL' && (
                                <button onClick={() => setViewMode('DIFF')} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium hover:bg-yellow-200">
                                    查看差異
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Context Sidebar */}
                <div className="w-full lg:w-80 bg-slate-50 p-6 rounded-lg border border-slate-200 h-fit space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">計算依據</h3>
                    <div className="space-y-4 text-sm">
                        {/* Same info as before... */}
                        <div>
                            <span className="text-slate-500 block">移工姓名</span>
                            <span className="font-medium text-slate-900">{deploymentInfo.workerName}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">目前宿舍</span>
                            <span className="font-medium text-slate-900">{deploymentInfo.dormitoryName || '自住/無'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">護照效期</span>
                            <span className={`font-medium ${deploymentInfo.passportExpiry ? 'text-amber-600' : 'text-slate-400'}`}>
                                {deploymentInfo.passportExpiry ? format(new Date(deploymentInfo.passportExpiry), 'yyyy-MM-dd') : '未登錄'}
                            </span>
                        </div>
                    </div>

                    <div className="pt-6 border-t">
                        <p className="text-sm text-slate-600 mb-2">確認目前的項目與金額：</p>
                        <button
                            onClick={handleConfirm}
                            className={`w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors
                                ${plan.reviewStatus === 'NEEDS_REVIEW'
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            <CheckCircle2 size={18} />
                            {plan.reviewStatus === 'NEEDS_REVIEW' ? '確認審核結果' : '確認並生成帳單'}
                        </button>
                    </div>
                </div>

                {/* Main Table Area */}
                <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">
                            {viewMode === 'DIFF' ? '帳務差異核對 (Diff Mode)' : `預覽收款計畫 (${items.length} 期)`}
                        </h2>
                        <div className="flex gap-2">
                            {viewMode === 'DIFF' ? (
                                <div className="flex gap-2">
                                    <button onClick={handleAcceptAll} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                                        全部採納建議
                                    </button>
                                    <button onClick={() => setViewMode('NORMAL')} className="px-3 py-1 text-slate-500 hover:bg-slate-100 rounded text-sm">
                                        退出比對
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setViewMode('DIFF')} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
                                    <RefreshCw size={14} /> 重新試算
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">預計收款日</th>
                                    <th className="px-6 py-3">項目</th>
                                    {viewMode === 'DIFF' ? (
                                        <>
                                            <th className="px-6 py-3 text-right">原始金額</th>
                                            <th className="px-6 py-3 text-right text-green-700 font-bold bg-green-50">建議金額</th>
                                            <th className="px-6 py-3 text-center">差異</th>
                                            <th className="px-6 py-3 text-center">採納</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-3">金額</th>
                                            <th className="px-6 py-3">說明</th>
                                            <th className="px-6 py-3 text-right">操作</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(viewMode === 'DIFF' ? diffItems : items).map((item, idx) => {
                                    const diffItem = item as DiffItem; // Safe cast
                                    const isDiff = viewMode === 'DIFF' && diffItem.isDifferent;
                                    const isAccepted = acceptedIndices.has(idx);

                                    return (
                                        <tr key={idx} className={`hover:bg-slate-50 transition-colors ${isDiff ? 'bg-yellow-50/30' : ''}`}>
                                            <td className="px-6 py-3 font-medium text-slate-900">
                                                {format(new Date(item.billingDate), 'yyyy-MM-dd')}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${item.itemCategory === 'SERVICE_FEE' ? 'bg-blue-100 text-blue-800' :
                                                        item.itemCategory === 'DORMITORY_FEE' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                    {item.itemCategory}
                                                </span>
                                            </td>

                                            {viewMode === 'DIFF' ? (
                                                <>
                                                    <td className="px-6 py-3 text-right text-slate-500"> {/* Original */}
                                                        {diffItem.existingAmount !== null ? diffItem.existingAmount : <span className="text-xs text-gray-300">-</span>}
                                                    </td>
                                                    <td className={`px-6 py-3 text-right font-medium ${isDiff ? 'text-green-700 bg-green-50/50' : 'text-slate-400'}`}> {/* Suggested */}
                                                        {diffItem.amount}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {diffItem.isDifferent ? (
                                                            <span className={`text-xs px-2 py-1 rounded ${diffItem.diffAmount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                                {diffItem.diffAmount > 0 ? `+${diffItem.diffAmount}` : diffItem.diffAmount}
                                                            </span>
                                                        ) : <span className="text-gray-300">-</span>}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {diffItem.isDifferent && (
                                                            <input
                                                                type="checkbox"
                                                                checked={isAccepted}
                                                                onChange={() => handleAcceptSuggestion(idx, diffItem)}
                                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                        )}
                                                    </td>
                                                </>
                                            ) : (
                                                // Normal Mode
                                                <>
                                                    <td className="px-6 py-3">
                                                        <input
                                                            type="number"
                                                            value={item.amount}
                                                            className="w-24 px-2 py-1 border rounded text-right outline-none"
                                                            readOnly
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-500 text-xs">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
