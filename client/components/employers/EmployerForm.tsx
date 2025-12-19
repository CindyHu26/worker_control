'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import FormSection from '@/components/layout/FormSection';
import ComplianceSelector from '@/components/employers/ComplianceSelector';
import { isValidGUINumber, isValidNationalID } from '@/utils/validation';
import { Building, User, FileText, Settings, Building2, Globe, Copy, Save, AlertTriangle, AlertCircle, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { EmployerSidebar } from './EmployerSidebar';

// Validation Schema
const baseSchema = z.object({
    companyName: z.string().min(1, '雇主/公司名稱為必填'),
    companyNameEn: z.string().optional().or(z.literal('')),
    taxId: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().optional().or(z.literal('')),
    faxNumber: z.string().optional().or(z.literal('')),
    industryType: z.string().optional(),
    industryCode: z.string().optional(),
    capital: z.string().optional().or(z.literal('')),

    responsiblePerson: z.string().optional(),
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(),
    responsiblePersonAddress: z.string().optional(),

    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),

    category: z.string(),

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

    address: z.string().optional(),
    addressEn: z.string().optional(),
    billAddress: z.string().optional(),

    agencyCompanyId: z.string().optional(),
    allocationRate: z.string().optional(),
    complianceStandard: z.string().optional(),
    zeroFeeEffectiveDate: z.string().optional(),
});

const employerSchema = baseSchema.superRefine((data, ctx) => {
    if (data.category === 'HOME_CARE') {
        if (data.taxId && !isValidNationalID(data.taxId)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "身分證字號格式錯誤 (需為1碼英文+9碼數字，並符合邏輯)",
                path: ["taxId"]
            });
        }
    } else {
        if (!data.taxId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "統一編號為必填",
                path: ["taxId"]
            });
        } else if (!isValidGUINumber(data.taxId)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "統一編號格式錯誤 (需為8碼數字，並符合邏輯運算)",
                path: ["taxId"]
            });
        }
    }
});

type EmployerFormData = z.infer<typeof baseSchema>;

interface EmployerFormProps {
    initialData?: Partial<EmployerFormData>;
    onSubmit: (data: EmployerFormData) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
}

export default function EmployerForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false
}: EmployerFormProps) {
    const isEditMode = !!initialData;

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<EmployerFormData>({
        resolver: zodResolver(employerSchema),
        defaultValues: (initialData || {
            category: 'MANUFACTURING',
            companyName: '',
            taxId: '',
            complianceStandard: 'NONE'
        }) as EmployerFormData
    });

    const [taxIdStatus, setTaxIdStatus] = useState<{ loading: boolean; error: string | null }>({
        loading: false,
        error: null
    });

    const formData = watch();
    const selectedCategory = watch('category');
    const taxIdValue = watch('taxId');

    // Debounced Duplicate Check
    useEffect(() => {
        if (!taxIdValue || taxIdValue.length < 8 || isEditMode) {
            setTaxIdStatus({ loading: false, error: null });
            return;
        }

        const timer = setTimeout(async () => {
            setTaxIdStatus({ loading: true, error: null });
            try {
                const res = await fetch(`/api/employers/check-duplicate/${taxIdValue}`);
                const data = await res.json();
                if (data.exists) {
                    setTaxIdStatus({
                        loading: false,
                        error: `此號碼已被使用: ${data.employer.companyName}`
                    });
                } else {
                    setTaxIdStatus({ loading: false, error: null });
                }
            } catch (err) {
                setTaxIdStatus({ loading: false, error: null });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [taxIdValue, isEditMode]);

    // Calculate Completeness
    const calculateCompleteness = () => {
        const fields = [
            'companyName', 'taxId', 'responsiblePerson', 'phoneNumber',
            'address', 'contactPerson', 'contactPhone'
        ];
        if (selectedCategory === 'MANUFACTURING') {
            fields.push('factoryRegistrationNo', 'laborInsuranceNo', 'industryCode');
        } else if (selectedCategory === 'HOME_CARE') {
            fields.push('patientName', 'patientIdNo', 'careAddress');
        }

        const filled = fields.filter(f => !!formData[f as keyof EmployerFormData]);
        return Math.round((filled.length / fields.length) * 100);
    };

    const completeness = calculateCompleteness();

    const getImpacts = () => {
        const impacts = [];
        if (!formData.companyName || !formData.taxId) {
            impacts.push({
                title: "無法建立檔案",
                description: "缺少雇主名稱或統編，系統無法建立有效索引。",
                level: 'error' as const
            });
        }
        if (!formData.companyNameEn || !formData.addressEn) {
            impacts.push({
                title: "無法產出勞動契約",
                description: "缺少英文名稱或地址，無法生成勞動部公版契約。",
                level: 'warning' as const
            });
        }
        if (!formData.responsiblePersonIdNo) {
            impacts.push({
                title: "無法申請招募許可",
                description: "未填寫負責人身分證號，勞動部系統將退件。",
                level: 'warning' as const
            });
        }
        return impacts;
    };

    const onSubmitForm: SubmitHandler<EmployerFormData> = async (data) => {
        try {
            await onSubmit(data);
            toast.success(isEditMode ? '更新成功' : '建立成功');
        } catch (error: any) {
            toast.error(error.message || '操作失敗');
        }
    };

    const copyAddressToBilling = () => {
        const addr = watch('address');
        setValue('billAddress', addr);
        toast.success('已複製地址');
    };

    const SectionHeader = ({ title, icon: Icon, isComplete }: { title: string, icon: any, isComplete?: boolean }) => (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                    <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <div className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                isComplete ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
            )}>
                {isComplete ? "已完成" : "未完成"}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} className="max-w-[1600px] mx-auto p-6">
            <div className="flex gap-8">
                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    {/* Section 1: Basic Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <SectionHeader
                            title="基本資料 (Basic Info)"
                            icon={Building}
                            isComplete={!!(formData.taxId && formData.companyName)}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="taxId" className="required">統一編號 (TAX ID)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="taxId"
                                        {...register('taxId')}
                                        placeholder="例如: 84149961"
                                        className="font-mono bg-gray-50/50"
                                    />
                                    <Button type="button" variant="outline" size="sm" className="h-10 text-blue-600 border-blue-100 hover:bg-blue-50">
                                        <Globe className="h-4 w-4 mr-1" /> 帶入
                                    </Button>
                                </div>
                                {errors.taxId && <p className="text-xs text-red-500">{errors.taxId.message}</p>}
                                {taxIdStatus.error && <p className="text-xs text-amber-500">{taxIdStatus.error}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyName" className="required">雇主名稱 (Company Name)</Label>
                                <Input
                                    id="companyName"
                                    {...register('companyName')}
                                    placeholder="公司全名"
                                    className="bg-gray-50/50"
                                />
                                {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="companyNameEn">英文名稱 (English Name) - 勞動契約必填</Label>
                                <Input
                                    id="companyNameEn"
                                    {...register('companyNameEn')}
                                    placeholder="Required for English Contracts"
                                    className="bg-gray-50/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industryCode">行業代號 (Industry Code)</Label>
                                <Input
                                    id="industryCode"
                                    {...register('industryCode')}
                                    placeholder="例如: 2611"
                                    className="bg-gray-50/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capital">資本額 (Capital)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                                    <Input
                                        id="capital"
                                        {...register('capital')}
                                        placeholder="0"
                                        className="pl-7 bg-gray-50/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Person In Charge */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <SectionHeader
                            title="負責人資料 (Person In Charge)"
                            icon={User}
                            isComplete={!!(formData.responsiblePerson && formData.responsiblePersonIdNo)}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="responsiblePerson" className="required">負責人姓名</Label>
                                <Input
                                    id="responsiblePerson"
                                    {...register('responsiblePerson')}
                                    className="bg-gray-50/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="responsiblePersonIdNo" className="required">身分證字號 (ID No.)</Label>
                                <Input
                                    id="responsiblePersonIdNo"
                                    {...register('responsiblePersonIdNo')}
                                    placeholder="A123456789"
                                    className="font-mono bg-gray-50/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="responsiblePersonDob">出生日期 (DOB)</Label>
                                <Input
                                    id="responsiblePersonDob"
                                    type="date"
                                    {...register('responsiblePersonDob')}
                                    className="bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Location */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <SectionHeader
                            title="地址與聯絡 (Location)"
                            icon={MapPin}
                            isComplete={!!formData.address}
                        />
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="address" className="required">公司登記地址 (Registered Address)</Label>
                                <Textarea
                                    id="address"
                                    {...register('address')}
                                    placeholder="請輸入公司營業登記地址"
                                    rows={2}
                                    className="bg-gray-50/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="addressEn">EN: English Address (Will appear on Contract)</Label>
                                <Textarea
                                    id="addressEn"
                                    {...register('addressEn')}
                                    placeholder="English Address"
                                    rows={2}
                                    className="bg-gray-50/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="contactPerson">聯絡人 (Contact Person)</Label>
                                    <Input
                                        id="contactPerson"
                                        {...register('contactPerson')}
                                        className="bg-gray-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">聯絡電話/分機 (Phone)</Label>
                                    <div className="flex gap-2">
                                        <div className="p-2.5 bg-gray-100 rounded text-gray-500">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <Input
                                            id="contactPhone"
                                            {...register('contactPhone')}
                                            className="bg-gray-50/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Type Specific */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                                <Settings className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedCategory === 'MANUFACTURING' ? '工廠資料' : selectedCategory === 'HOME_CARE' ? '被看護人資料' : '機構資料'}
                            </h3>
                        </div>

                        {selectedCategory === 'MANUFACTURING' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="factoryRegistrationNo">工廠登記證號</Label>
                                    <Input {...register('factoryRegistrationNo')} className="font-mono bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="laborInsuranceNo">勞保證號</Label>
                                    <Input {...register('laborInsuranceNo')} className="font-mono bg-gray-50/50" />
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'HOME_CARE' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="patientName">被看護人姓名</Label>
                                    <Input {...register('patientName')} className="bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="patientIdNo">被看護人身分證號</Label>
                                    <Input {...register('patientIdNo')} className="font-mono bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="relationship">與雇主關係</Label>
                                    <Input {...register('relationship')} className="bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="careAddress">照護地點</Label>
                                    <Input {...register('careAddress')} className="bg-gray-50/50" />
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'INSTITUTION' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="institutionCode">機構代碼</Label>
                                    <Input {...register('institutionCode')} className="font-mono bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bedCount">床位數</Label>
                                    <Input type="number" {...register('bedCount')} className="bg-gray-50/50" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        {onCancel && (
                            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="text-gray-500">
                                取消
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading} className="px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                            {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                            <Save className="mr-2 h-4 w-4" />
                            {isEditMode ? '儲存修改' : '確認新增'}
                        </Button>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 shrink-0">
                    <EmployerSidebar
                        completeness={completeness}
                        missingItems={[]} // Can be derived from calculateCompleteness if needed
                        impacts={getImpacts()}
                    />
                </div>
            </div>
        </form>
    );
}
