'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BillingCycle {
    periodStart: number;
    periodEnd: number;
    monthsPerBill: number;
}

interface HealthCheckFee {
    checkType: string;
    collectionPeriod: number;
    feeMale: number;
    feeFemale: number;
}

interface CollectionPlanFormData {
    code: string;
    nationalityCode: string;
    category: 'household' | 'corporate';
    salaryCalcMethod: 'entry_date' | 'handover_date' | 'handover_next' | 'monthly' | 'entry_plus_one';
    payDay: number;
    cutoffDay: number;
    calculateByDays: boolean;
    preciseCalculation: boolean;
    monthlySalaryMethod: 'entry_date' | 'handover_date' | 'handover_next' | 'monthly' | 'entry_plus_one';
    isActive: boolean;
    billingCycles: BillingCycle[];
    healthCheckFees: HealthCheckFee[];
}

interface CollectionPlanFormProps {
    initialData?: Partial<CollectionPlanFormData> & { id?: string };
    isEdit?: boolean;
}

const salaryCalcMethodOptions = [
    { value: 'entry_date', label: '入境日' },
    { value: 'handover_date', label: '交工日' },
    { value: 'handover_next', label: '交工日之次日' },
    { value: 'monthly', label: '月份式' },
    { value: 'entry_plus_one', label: '入境日+1天' },
];

const categoryOptions = [
    { value: 'household', label: '家庭類' },
    { value: 'corporate', label: '公司類' },
];

const healthCheckTypes = [
    { type: 'entry', label: '初次體檢' },
    { type: '6mo', label: '6個月體檢' },
    { type: '12mo', label: '12個月體檢' },
    { type: '18mo', label: '18個月體檢' },
    { type: '24mo', label: '24個月體檢' },
    { type: '30mo', label: '30個月體檢' },
];

export default function CollectionPlanForm({ initialData, isEdit = false }: CollectionPlanFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'billing' | 'health' | 'fees'>('basic');

    const defaultBillingCycles: BillingCycle[] = [
        { periodStart: 1, periodEnd: 12, monthsPerBill: 1 },
        { periodStart: 13, periodEnd: 24, monthsPerBill: 1 },
        { periodStart: 25, periodEnd: 36, monthsPerBill: 1 },
    ];

    const defaultHealthCheckFees: HealthCheckFee[] = healthCheckTypes.map(h => ({
        checkType: h.type,
        collectionPeriod: 0,
        feeMale: 0,
        feeFemale: 0,
    }));

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CollectionPlanFormData>({
        defaultValues: {
            code: initialData?.code || '',
            nationalityCode: initialData?.nationalityCode || '',
            category: initialData?.category || 'corporate',
            salaryCalcMethod: initialData?.salaryCalcMethod || 'monthly',
            payDay: initialData?.payDay || 10,
            cutoffDay: initialData?.cutoffDay || 31,
            calculateByDays: initialData?.calculateByDays ?? true,
            preciseCalculation: initialData?.preciseCalculation ?? false,
            monthlySalaryMethod: initialData?.monthlySalaryMethod || 'entry_plus_one',
            isActive: initialData?.isActive ?? true,
            billingCycles: initialData?.billingCycles || defaultBillingCycles,
            healthCheckFees: initialData?.healthCheckFees || defaultHealthCheckFees,
        },
    });

    const onSubmit = async (data: CollectionPlanFormData) => {
        setIsSubmitting(true);
        try {
            const url = isEdit
                ? `/api/collection-plans/${initialData?.id}`
                : '/api/collection-plans';
            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('提交失敗');
            }

            router.push('/collection-plans');
            router.refresh();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('儲存失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = [
        { key: 'basic', label: '基本設定' },
        { key: 'billing', label: '收款期間' },
        { key: 'health', label: '體檢費用' },
        { key: 'fees', label: '其他費用' },
    ] as const;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Basic Settings Tab */}
            {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            代號 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('code', { required: '代號為必填' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="例如：7"
                        />
                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            國籍代碼 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('nationalityCode', { required: '國籍代碼為必填' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="例如：ID, PH, VN"
                        />
                        {errors.nationalityCode && <p className="mt-1 text-sm text-red-600">{errors.nationalityCode.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            類別
                        </label>
                        <select
                            {...register('category')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {categoryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            計算起薪方式
                        </label>
                        <select
                            {...register('salaryCalcMethod')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {salaryCalcMethodOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            發薪日（每月）
                        </label>
                        <input
                            type="number"
                            {...register('payDay', { valueAsNumber: true, min: 1, max: 31 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            入境截止日（日後算下下月帳）
                        </label>
                        <input
                            type="number"
                            {...register('cutoffDay', { valueAsNumber: true, min: 1, max: 31 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            月份式起薪方式
                        </label>
                        <select
                            {...register('monthlySalaryMethod')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {salaryCalcMethodOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-4 col-span-1 md:col-span-2 lg:col-span-3">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                {...register('calculateByDays')}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">以天數計服務費</span>
                        </label>

                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                {...register('preciseCalculation')}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">精算</span>
                        </label>

                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                {...register('isActive')}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">啟用</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Billing Cycles Tab */}
            {activeTab === 'billing' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">收款期間設定</h3>
                    <p className="text-sm text-gray-500">設定每個期間的收款頻率</p>

                    <div className="space-y-4">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        起始期數
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`billingCycles.${index}.periodStart` as const, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        截止期數
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`billingCycles.${index}.periodEnd` as const, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        每 N 月收款
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`billingCycles.${index}.monthsPerBill` as const, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Health Check Fees Tab */}
            {activeTab === 'health' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">體檢費設定</h3>
                    <p className="text-sm text-gray-500">設定收款期數為 0 表示不代收</p>

                    <div className="space-y-4">
                        {healthCheckTypes.map((checkType, index) => (
                            <div key={checkType.type} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900">{checkType.label}</span>
                                    <input type="hidden" {...register(`healthCheckFees.${index}.checkType` as const)} value={checkType.type} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        收款期數
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`healthCheckFees.${index}.collectionPeriod` as const, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0=不代收"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        男性體檢費
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`healthCheckFees.${index}.feeMale` as const, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        女性體檢費
                                    </label>
                                    <input
                                        type="number"
                                        {...register(`healthCheckFees.${index}.feeFemale` as const, { valueAsNumber: true })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Other Fees Tab */}
            {activeTab === 'fees' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">其他費用設定</h3>
                    <p className="text-sm text-gray-500">居留證費、意外險費、介紹費、雇主服務費等設定</p>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            此功能正在開發中。目前可先儲存基本設定、收款期間和體檢費用設定。
                        </p>
                    </div>
                </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    取消
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? '儲存中...' : (isEdit ? '更新' : '建立')}
                </button>
            </div>
        </form>
    );
}
