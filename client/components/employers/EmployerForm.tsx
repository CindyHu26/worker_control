'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import FormSection from '@/components/layout/FormSection';
import ComplianceSelector from '@/components/employers/ComplianceSelector';
import { isValidGUINumber, isValidNationalID } from '@/utils/validation';
import { Building, User, FileText, Settings, Building2, Globe, Copy, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Validation Schema
const baseSchema = z.object({
    companyName: z.string().min(1, '雇主/公司名稱為必填'),
    taxId: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().optional(),
    faxNumber: z.string().optional(),
    industryType: z.string().optional(),

    responsiblePerson: z.string().optional(),
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(),
    responsiblePersonAddress: z.string().optional(),

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
    billAddress: z.string().optional(),

    agencyCompanyId: z.string().optional(),
    allocationRate: z.string().optional(),
    complianceStandard: z.string().optional(),
    zeroFeeEffectiveDate: z.string().optional(),

    // Bilingual
    companyNameEn: z.string().optional(),
    addressEn: z.string().optional(),
    responsiblePersonEn: z.string().optional(),

    // Initial Recruitment Letters (optional)
    initialRecruitmentLetters: z.array(z.object({
        letterNumber: z.string().min(1, '函文號必填'),
        issueDate: z.string().min(1, '發文日期必填'),
        expiryDate: z.string().min(1, '到期日期必填'),
        approvedQuota: z.number().min(1, '核准名額必須大於0'),
    })).optional(),
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

/**
 * Refactored EmployerForm using FormSection and landscape optimization
 * No header/layout - those are handled by PageContainer
 */
export default function EmployerForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false
}: EmployerFormProps) {
    const [activeTab, setActiveTab] = useState('basic');
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

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tab Navigation */}
                <TabsList className="grid w-full grid-cols-5 mb-6">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        基本資料
                    </TabsTrigger>
                    <TabsTrigger value="category" className="flex items-center gap-2">
                        {selectedCategory === 'HOME_CARE' && <User className="h-4 w-4" />}
                        {selectedCategory === 'MANUFACTURING' && <Settings className="h-4 w-4" />}
                        {selectedCategory === 'INSTITUTION' && <Building2 className="h-4 w-4" />}
                        {selectedCategory === 'HOME_CARE' ? '被看護人' : selectedCategory === 'MANUFACTURING' ? '工廠資料' : '機構資料'}
                    </TabsTrigger>
                    <TabsTrigger value="address" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        地址資訊
                    </TabsTrigger>
                    <TabsTrigger value="bilingual" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        雙語資料
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        設定
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Basic Info */}
                <TabsContent value="basic" className="space-y-6">
                    <FormSection
                        title="基本資料"
                        description="雇主的公司基本資訊"
                        columns={3}
                    >
                        <div>
                            <Label htmlFor="category" className="required">雇主類型</Label>
                            <Select
                                onValueChange={(value) => setValue('category', value)}
                                defaultValue={watch('category')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MANUFACTURING">製造業</SelectItem>
                                    <SelectItem value="HOME_CARE">家庭看護</SelectItem>
                                    <SelectItem value="INSTITUTION">養護機構</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-2">
                            <Label htmlFor="companyName" className="required">公司名稱</Label>
                            <Input
                                id="companyName"
                                {...register('companyName')}
                                placeholder="請輸入公司完整名稱"
                            />
                            {errors.companyName && (
                                <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="taxId" className="required">
                                {selectedCategory === 'HOME_CARE' ? '雇主身分證字號' : '統一編號'}
                            </Label>
                            <Input
                                id="taxId"
                                {...register('taxId')}
                                maxLength={selectedCategory === 'HOME_CARE' ? 10 : 8}
                                placeholder={selectedCategory === 'HOME_CARE' ? 'A123456789' : '12345678'}
                                className="font-mono"
                            />
                            {errors.taxId && (
                                <p className="text-sm text-red-600 mt-1">{errors.taxId.message}</p>
                            )}
                            {taxIdStatus.error && (
                                <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {taxIdStatus.error}
                                </p>
                            )}
                            {taxIdStatus.loading && (
                                <p className="text-xs text-gray-400 mt-1">檢查中...</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="phoneNumber">電話</Label>
                            <Input
                                id="phoneNumber"
                                {...register('phoneNumber')}
                                placeholder="02-1234-5678"
                            />
                        </div>

                        <div>
                            <Label htmlFor="faxNumber">傳真</Label>
                            <Input
                                id="faxNumber"
                                {...register('faxNumber')}
                                placeholder="02-1234-5679"
                            />
                        </div>

                        <div className="col-span-3">
                            <Label htmlFor="industryType">行業類別</Label>
                            <Input
                                id="industryType"
                                {...register('industryType')}
                                placeholder="例如：金屬製造業"
                            />
                        </div>
                    </FormSection>
                </TabsContent>

                {/* Tab 2: Category-Specific */}
                <TabsContent value="category" className="space-y-6">
                    {selectedCategory === 'MANUFACTURING' && (
                        <>
                            <FormSection
                                title="負責人與工廠資料"
                                columns={3}
                            >
                                <div>
                                    <Label htmlFor="responsiblePerson">負責人姓名</Label>
                                    <Input {...register('responsiblePerson')} />
                                </div>

                                <div>
                                    <Label htmlFor="factoryRegistrationNo">工廠登記證號</Label>
                                    <Input {...register('factoryRegistrationNo')} className="font-mono" />
                                </div>

                                <div>
                                    <Label htmlFor="laborInsuranceNo">勞保證號</Label>
                                    <Input {...register('laborInsuranceNo')} className="font-mono" />
                                </div>

                                <div>
                                    <Label htmlFor="allocationRate">核配比率</Label>
                                    <Select
                                        onValueChange={(value) => setValue('allocationRate', value)}
                                        defaultValue={watch('allocationRate')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="請選擇" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0.10">10%</SelectItem>
                                            <SelectItem value="0.15">15%</SelectItem>
                                            <SelectItem value="0.20">20%</SelectItem>
                                            <SelectItem value="0.25">25% (3K5)</SelectItem>
                                            <SelectItem value="0.35">35%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </FormSection>

                            <FormSection
                                title="合規設定"
                                divider={false}
                            >
                                <ComplianceSelector
                                    value={watch('complianceStandard') || 'NONE'}
                                    onChange={(val) => setValue('complianceStandard', val)}
                                    effectiveDate={watch('zeroFeeEffectiveDate') || ''}
                                    onEffectiveDateChange={(date) => setValue('zeroFeeEffectiveDate', date)}
                                />
                            </FormSection>
                        </>
                    )}

                    {selectedCategory === 'HOME_CARE' && (
                        <FormSection
                            title="被看護人資料"
                            columns={2}
                            divider={false}
                        >
                            <div>
                                <Label htmlFor="responsiblePerson">雇主姓名</Label>
                                <Input {...register('responsiblePerson')} placeholder="雇主本人姓名" />
                            </div>

                            <div>
                                <Label htmlFor="patientName">被看護人姓名</Label>
                                <Input {...register('patientName')} />
                            </div>

                            <div>
                                <Label htmlFor="patientIdNo">被看護人身分證號</Label>
                                <Input {...register('patientIdNo')} className="font-mono" />
                            </div>

                            <div>
                                <Label htmlFor="relationship">與雇主關係</Label>
                                <Input {...register('relationship')} placeholder="例如：父子" />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="careAddress">照護地點</Label>
                                <Input {...register('careAddress')} />
                            </div>
                        </FormSection>
                    )}

                    {selectedCategory === 'INSTITUTION' && (
                        <FormSection
                            title="機構資料"
                            columns={3}
                            divider={false}
                        >
                            <div>
                                <Label htmlFor="responsiblePerson">機構負責人</Label>
                                <Input {...register('responsiblePerson')} />
                            </div>

                            <div>
                                <Label htmlFor="institutionCode">機構代碼</Label>
                                <Input {...register('institutionCode')} className="font-mono" />
                            </div>

                            <div>
                                <Label htmlFor="bedCount">床位數</Label>
                                <Input type="number" {...register('bedCount')} />
                            </div>
                        </FormSection>
                    )}
                </TabsContent>

                {/* Tab 3: Address Info */}
                <TabsContent value="address" className="space-y-6">
                    <FormSection
                        title="地址資訊"
                        columns={1}
                        divider={false}
                    >
                        <div>
                            <Label htmlFor="address">公司登記地址</Label>
                            <Textarea
                                id="address"
                                {...register('address')}
                                placeholder="請輸入公司營業登記地址"
                                rows={3}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label htmlFor="billAddress">帳單寄送地址</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyAddressToBilling}
                                    className="h-7"
                                >
                                    <Copy className="h-3 w-3 mr-1" />
                                    同公司地址
                                </Button>
                            </div>
                            <Textarea
                                id="billAddress"
                                {...register('billAddress')}
                                placeholder="請輸入帳單/發票寄送地址"
                                rows={3}
                            />
                        </div>
                    </FormSection>
                </TabsContent>

                {/* Tab 4: Bilingual */}
                <TabsContent value="bilingual" className="space-y-6">
                    <FormSection
                        title="雙語資料"
                        description="英文公司名稱、地址與負責人 (用於國際文件)"
                        columns={1}
                        divider={false}
                    >
                        <div>
                            <Label htmlFor="companyNameEn">English Company Name</Label>
                            <Input
                                id="companyNameEn"
                                {...register('companyNameEn')}
                                placeholder="e.g. ABC Manufacturing Co., Ltd."
                            />
                        </div>

                        <div>
                            <Label htmlFor="addressEn">English Address</Label>
                            <Input
                                id="addressEn"
                                {...register('addressEn')}
                                placeholder="e.g. No. 123, Sec. 1, Zhongshan Rd., Taipei City"
                            />
                        </div>

                        <div>
                            <Label htmlFor="responsiblePersonEn">Responsible Person (EN)</Label>
                            <Input
                                id="responsiblePersonEn"
                                {...register('responsiblePersonEn')}
                                placeholder="e.g. Wang, Da-Ming"
                            />
                        </div>
                    </FormSection>
                </TabsContent>

                {/* Tab 5: Settings */}
                <TabsContent value="settings" className="space-y-6">
                    <div className="text-center py-12 text-gray-500">
                        <Settings className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">進階設定開發中</p>
                        <p className="text-sm mt-1">委任仲介公司與服務費規則設定將在下一階段實作</p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Action Buttons - Sticky to bottom */}
            <div className="sticky bottom-0 flex justify-end gap-3 py-4 mt-6 border-t bg-white/80 backdrop-blur-sm z-10">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        取消
                    </Button>
                )}
                <Button type="submit" disabled={isLoading} className="shadow-lg">
                    {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? '儲存修改' : '確認新增'}
                </Button>
            </div>
        </form>
    );
}
