
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Copy, Building, User, FileText, Settings, X, Building2, Globe } from 'lucide-react';
import ComplianceSelector from '@/components/employers/ComplianceSelector';
import { isValidGUINumber, isValidNationalID } from '@/utils/validation';

// --- Validation Schema ---
const employerSchema = z.object({
    companyName: z.string().min(1, '雇主/公司名稱為必填'),
    // 先定義為字串，稍後在 superRefine 進行邏輯檢查
    taxId: z.string().min(1, '此欄位為必填'),
    phoneNumber: z.string().optional(),
    faxNumber: z.string().optional(),
    industryType: z.string().optional(),

    responsiblePerson: z.string().optional(),
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(), // Date string YYYY-MM-DD
    responsiblePersonAddress: z.string().optional(),

    category: z.string(), // MANUFACTURING, HOME_CARE, INSTITUTION

    // Manufacturing
    factoryRegistrationNo: z.string().optional(),
    laborInsuranceNo: z.string().optional(),

    // Home Care
    patientName: z.string().optional(),
    patientIdNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),

    // Institution
    institutionCode: z.string().optional(),
    bedCount: z.union([z.string(), z.number()]).optional(),

    address: z.string().optional(), // Company Address
    billAddress: z.string().optional(),

    // Future expansion
    agencyCompanyId: z.string().optional(),

    // New validation fields
    allocationRate: z.string().optional(), // 0.10, 0.15 etc.
    complianceStandard: z.string().optional(), // RBA, IWAY, NONE
    zeroFeeEffectiveDate: z.string().optional(), // YYYY-MM-DD

    // Bilingual Info
    companyNameEn: z.string().optional(),
    addressEn: z.string().optional(),
    responsiblePersonEn: z.string().optional(),
}).superRefine((data, ctx) => {
    // 邏輯分流：家庭看護 (Home Care) 驗證身分證，其他 (製造業/機構) 驗證統編
    if (data.category === 'HOME_CARE') {
        if (!isValidNationalID(data.taxId)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "身分證字號格式錯誤 (需為1碼英文+9碼數字，並符合邏輯)",
                path: ["taxId"]
            });
        }
    } else {
        // 製造業、機構 -> 驗證統編
        if (!isValidGUINumber(data.taxId)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "統一編號格式錯誤 (需為8碼數字，並符合邏輯運算)",
                path: ["taxId"]
            });
        }
    }
});

type EmployerFormData = z.infer<typeof employerSchema>;

interface EmployerFormProps {
    initialData?: Partial<EmployerFormData>;
    onSubmit: (data: EmployerFormData) => Promise<void>;
    isEdit?: boolean;
}

export default function EmployerForm({ initialData, onSubmit, isEdit = false }: EmployerFormProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EmployerFormData>({
        resolver: zodResolver(employerSchema),
        defaultValues: initialData || {
            category: 'MANUFACTURING', // Default
            companyName: '',
            taxId: '',
            address: '',
            billAddress: '',
            phoneNumber: '',
            faxNumber: '',
            industryType: '',
            responsiblePerson: '',
            responsiblePersonIdNo: '',
            responsiblePersonDob: '',
            responsiblePersonAddress: '',
            factoryRegistrationNo: '',
            laborInsuranceNo: '',
            patientName: '',
            patientIdNo: '',
            careAddress: '',
            relationship: '',
            institutionCode: '',
            bedCount: '',
            allocationRate: '',
            complianceStandard: 'NONE',
            zeroFeeEffectiveDate: ''
        }
    });

    const handleFormSubmit = async (data: EmployerFormData) => {
        setIsLoading(true);
        try {
            await onSubmit(data);
        } catch (error) {
            console.error(error);
            alert('儲存失敗');
        } finally {
            setIsLoading(false);
        }
    };

    const copyAddressToBilling = () => {
        const addr = watch('address');
        setValue('billAddress', addr);
    };

    const [showWizard, setShowWizard] = useState(!isEdit); // Show wizard if creating new
    const selectedCategory = watch('category');

    const handleCategorySelect = (cat: string) => {
        setValue('category', cat);
        setShowWizard(false);
    };

    if (showWizard) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
                <div className="max-w-4xl w-full">
                    <h1 className="text-3xl font-bold text-slate-900 text-center mb-12">請選擇雇主類型 (Select Employer Category)</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Manufacturing */}
                        <button
                            type="button"
                            onClick={() => handleCategorySelect('MANUFACTURING')}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition group text-left"
                        >
                            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition">
                                <Building size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">製造業 (Manufacturing)</h3>
                            <p className="text-slate-500">工廠、製造業雇主。需填寫工廠登記證號與行業別。</p>
                        </button>

                        {/* Home Care */}
                        <button
                            type="button"
                            onClick={() => handleCategorySelect('HOME_CARE')}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-green-500 hover:shadow-md transition group text-left"
                        >
                            <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition">
                                <User size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">家庭看護 (Home Care)</h3>
                            <p className="text-slate-500">家庭類雇主。需填寫被看護人 (Patient) 資料與照護地點。</p>
                        </button>

                        {/* Institution */}
                        <button
                            type="button"
                            onClick={() => handleCategorySelect('INSTITUTION')}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-500 hover:shadow-md transition group text-left"
                        >
                            <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition">
                                <Building2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">養護機構 (Institution)</h3>
                            <p className="text-slate-500">安養院、護理之家。需填寫機構代碼與床位數。</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { label: '基本資料 (Basic)', icon: Building },
        ...(selectedCategory === 'MANUFACTURING' ? [{ label: '工廠資料 (Factory)', icon: Settings }] : []),
        ...(selectedCategory === 'HOME_CARE' ? [{ label: '被看護人 (Patient)', icon: User }] : []),
        ...(selectedCategory === 'INSTITUTION' ? [{ label: '機構資料 (Institution)', icon: Building2 }] : []),
        { label: '雙語資料 (Bilingual)', icon: Globe },
        { label: '帳務與聯絡 (Billing)', icon: FileText },
        { label: '設定 (Settings)', icon: Settings },
    ];

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full bg-slate-50 min-h-screen">
            {/* Header / Actions */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{isEdit ? '編輯雇主資料' : '新增雇主 (New Employer)'}</h1>
                    <p className="text-sm text-slate-500 mt-1">請填寫完整的雇主與工廠資訊。</p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => window.history.back()} // Simple back navigation
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <X size={18} /> 取消
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50 transition"
                    >
                        <Save size={18} />
                        {isLoading ? '儲存中...' : '儲存資料'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Sidebar Tabs */}
                <div className="w-64 bg-white border-r border-slate-200 flex flex-col pt-6">
                    {tabs.map((tab, index) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === index;
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setActiveTab(index)}
                                className={`
                                    w-full text-left px-6 py-4 flex items-center gap-3 transition-colors border-l-4
                                    ${isActive
                                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                <span className="font-medium text-sm">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow border border-slate-200 p-8 min-h-[500px]">

                        {/* Tab 1: Basic Info */}
                        {activeTab === 0 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-6">基本資料 (Basic Info)</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">公司名稱 (Company Name) <span className="text-red-500">*</span></label>
                                        <input
                                            {...register('companyName')}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="請輸入公司完整名稱"
                                        />
                                        {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">
                                            {selectedCategory === 'HOME_CARE'
                                                ? '雇主身分證字號 (National ID) *'
                                                : '統一編號 (GUI Number) *'}
                                        </label>
                                        <input
                                            {...register('taxId')}
                                            maxLength={selectedCategory === 'HOME_CARE' ? 10 : 8}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                            placeholder={selectedCategory === 'HOME_CARE' ? 'A123456789' : '12345678'}
                                        />
                                        {errors.taxId && <p className="text-red-500 text-xs">{errors.taxId.message}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">電話 (Phone)</label>
                                        <input
                                            {...register('phoneNumber')}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="02-1234-5678"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">傳真 (Fax)</label>
                                        <input
                                            {...register('faxNumber')}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="02-1234-5679"
                                        />
                                    </div>

                                    <div className="space-y-1 col-span-2">
                                        <label className="block text-sm font-medium text-slate-700">行業類別 (Industry)</label>
                                        <input
                                            {...register('industryType')}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="ex. 金屬製造業 (Metal Manufacturing)"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Factory Info (Manufacturing) */}
                        {activeTab === 1 && selectedCategory === 'MANUFACTURING' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-6">負責人與工廠資料</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">負責人姓名 (Responsible Person)</label>
                                        <input {...register('responsiblePerson')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">工廠登記證號 (Factory Reg No)</label>
                                        <input {...register('factoryRegistrationNo')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">勞保證號 (Labor Insurance No)</label>
                                        <input {...register('laborInsuranceNo')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">行業類別 (Industry Type)</label>
                                        <input {...register('industryType')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">核配比率 (Allocation Rate)</label>
                                        <select {...register('allocationRate')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                            <option value="">請選擇 (Select)</option>
                                            <option value="0.10">10%</option>
                                            <option value="0.15">15%</option>
                                            <option value="0.20">20%</option>
                                            <option value="0.25">25% (3K5)</option>
                                            <option value="0.35">35%</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 mt-6 border-t border-slate-200 pt-6">
                                        <ComplianceSelector
                                            value={watch('complianceStandard') || 'NONE'}
                                            onChange={(val) => setValue('complianceStandard', val)}
                                            effectiveDate={watch('zeroFeeEffectiveDate') || ''}
                                            onEffectiveDateChange={(date) => setValue('zeroFeeEffectiveDate', date)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Patient Info (Home Care) */}
                        {activeTab === 1 && selectedCategory === 'HOME_CARE' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-6">被看護人資料 (Patient Info)</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">雇主姓名 (Employer Name)</label>
                                        <input {...register('responsiblePerson')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="雇主本人姓名" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">被看護人姓名 (Patient Name)</label>
                                        <input {...register('patientName')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">被看護人身分證號 (Patient ID)</label>
                                        <input {...register('patientIdNo')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">與雇主關係 (Relationship)</label>
                                        <input {...register('relationship')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex. 父子" />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">照護地點 (Care Address)</label>
                                        <input {...register('careAddress')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Institution Info (Institution) */}
                        {activeTab === 1 && selectedCategory === 'INSTITUTION' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-6">機構資料 (Institution Info)</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">機構負責人 (Responsible Person)</label>
                                        <input {...register('responsiblePerson')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">機構代碼 (Institution Code)</label>
                                        <input {...register('institutionCode')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">床位數 (Bed Count)</label>
                                        <input type="number" {...register('bedCount')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Bilingual Info */}
                        {tabs.find(t => t.label.includes('Bilingual')) && activeTab === tabs.findIndex(t => t.label.includes('Bilingual')) && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-6">雙語資料 (Bilingual Info)</h2>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">English Company Name</label>
                                        <input {...register('companyNameEn')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. ABC Manufacturing Co., Ltd." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">English Address</label>
                                        <input {...register('addressEn')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. No. 123, Sec. 1..." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">Responsible Person (EN)</label>
                                        <input {...register('responsiblePersonEn')} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Wang, Da-Ming" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Billing & Contact */}
                        {activeTab === 2 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-6">帳務與聯絡 (Billing & Contact)</h2>
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-slate-700">公司登記地址 (Company Address)</label>
                                        <textarea
                                            {...register('address')}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                            placeholder="請輸入公司營業登記地址"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-sm font-medium text-slate-700">帳單寄送地址 (Billing Address)</label>
                                            <button
                                                type="button"
                                                onClick={copyAddressToBilling}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Copy size={12} />
                                                同公司地址
                                            </button>
                                        </div>
                                        <textarea
                                            {...register('billAddress')}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                            placeholder="請輸入帳單/發票寄送地址"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Settings */}
                        {activeTab === 3 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-6">系統與其他設定 (Settings)</h2>
                                <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <Settings size={48} className="mx-auto text-slate-300 mb-4" />
                                    <h3 className="text-slate-900 font-medium">進階設定開發中</h3>
                                    <p className="text-slate-500 text-sm mt-2">委任仲介公司 (Agency) 與服務費規則設定將在下一階段實作。</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
