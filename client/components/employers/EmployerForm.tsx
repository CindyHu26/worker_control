'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
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
import { Building, User, FileText, Settings, Building2, Globe, Copy, Save, AlertTriangle, AlertCircle, Phone, MapPin, Plus, Trash2, Briefcase, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { EmployerSidebar } from './EmployerSidebar';
import { INDUSTRIES, ALLOCATION_RATES, BASE_RATES, EXTRA_RATES } from '@/lib/leadConstants';
import { TAIWAN_CITIES } from '@/data/taiwan-cities';
import { toPinyin, translateCityDistrict } from '@/utils/translationUtils';

import { Checkbox } from "@/components/ui/checkbox";

// Validation Schema
const baseSchema = z.object({
    // Basic
    code: z.string().optional(),
    shortName: z.string().optional(),
    companyName: z.string().min(1, '雇主/公司名稱為必填'),
    companyNameEn: z.string().optional().or(z.literal('')),
    taxId: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().optional().or(z.literal('')),
    faxNumber: z.string().optional().or(z.literal('')),
    email: z.string().email('Email 格式錯誤').optional().or(z.literal('')),
    industryType: z.string().optional(),
    industryCode: z.string().optional(),
    capital: z.string().optional().or(z.literal('')),

    // Responsible Person
    responsiblePerson: z.string().optional(),
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(),
    englishName: z.string().optional(), // New
    birthPlace: z.string().optional(), // New
    birthPlaceEn: z.string().optional(), // New
    residenceAddress: z.string().optional(), // New
    residenceZip: z.string().optional(), // New
    residenceCityCode: z.string().optional(), // New
    responsiblePersonFather: z.string().optional(),
    responsiblePersonMother: z.string().optional(),
    responsiblePersonSpouse: z.string().optional(),
    idIssueDate: z.string().optional(),
    idIssuePlace: z.string().optional(),
    militaryStatus: z.string().optional(),
    militaryStatusEn: z.string().optional(),

    // Addresses & Contact
    address: z.string().optional(),
    addressEn: z.string().optional(),
    invoiceAddress: z.string().optional(),
    taxAddress: z.string().optional(), // New
    healthBillAddress: z.string().optional(), // New
    healthBillZip: z.string().optional(), // New
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),

    category: z.string(),

    // Factories (Array)
    factories: z.array(z.object({
        id: z.string().optional(), // ✅ Preserve ID for updates
        name: z.string().min(1, '廠區名稱必填'),
        factoryRegNo: z.string().optional(),
        address: z.string().optional(),
        addressEn: z.string().optional(),
        zipCode: z.string().optional(),
        cityCode: z.string().optional(),
        laborCount: z.string().optional(), // Input as string, convert later
        foreignCount: z.string().optional()
    })).optional(),


    // Manufacturing
    factoryRegistrationNo: z.string().optional(),
    laborInsuranceNo: z.string().optional(),
    laborInsuranceId: z.string().optional(), // New
    healthInsuranceUnitNo: z.string().optional(),
    healthInsuranceId: z.string().optional(), // New
    factoryAddress: z.string().optional(), // Legacy support or main factory
    avgDomesticWorkers: z.string().optional().or(z.literal('')),

    // Home Care
    patientName: z.string().optional(),
    patientIdNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),

    // Institution
    institutionCode: z.string().optional(),
    bedCount: z.union([z.string(), z.number()]).optional(),

    // Internal
    referrer: z.string().optional(), // New
    agencyCompanyId: z.string().optional(),

    // Compliance
    allocationRate: z.string().optional(),
    isExtra: z.boolean().optional(),
    baseRate: z.string().optional(),
    extraRate: z.string().optional(),
    complianceStandard: z.string().optional(),
    zeroFeeEffectiveDate: z.string().optional(),
});

const employerSchema = baseSchema.superRefine((data, ctx) => {
    if (data.category === 'HOME_CARE') {
        // Household: Must have ID No, Must NOT have Tax ID
        if (data.taxId && data.taxId.trim() !== '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "家庭類雇主不需要統編 (請留空)",
                path: ["taxId"]
            });
        }
        if (!data.responsiblePersonIdNo) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "家庭類雇主必須填寫負責人身分證字號",
                path: ["responsiblePersonIdNo"]
            });
        } else if (!isValidNationalID(data.responsiblePersonIdNo)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "負責人身分證字號格式錯誤",
                path: ["responsiblePersonIdNo"]
            });
        }
    } else {
        // Business: Must have Tax ID
        if (!data.taxId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "事業類雇主必須填寫統一編號",
                path: ["taxId"]
            });
        } else if (!isValidGUINumber(data.taxId)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "統一編號格式錯誤 (需為8碼數字，並符合邏輯運算)",
                path: ["taxId"]
            });
        }

        if (!data.responsiblePerson) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "事業類雇主必須填寫負責人姓名",
                path: ["responsiblePerson"]
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
    isEdit?: boolean;
}

export default function EmployerForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    isEdit: isEditMode = false
}: EmployerFormProps) {
    const {
        register,
        control,
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
            complianceStandard: 'NONE',
            baseRate: '',
            extraRate: '',
            allocationRate: '',
            isExtra: false,
            address: '',
            invoiceAddress: '',
            factories: []
        }) as EmployerFormData
    });

    // Populate City/District from initial data
    useEffect(() => {
        if (initialData?.address) {
            let foundCity = '';
            let foundDist = '';
            // Try to find city
            for (const city of Object.keys(TAIWAN_CITIES)) {
                if (initialData.address.startsWith(city)) {
                    foundCity = city;
                    setSelectedCity(city);
                    const remaining = initialData.address.slice(city.length);
                    // Try to find district
                    const districts = TAIWAN_CITIES[city];
                    for (const dist of districts) {
                        if (remaining.startsWith(dist)) {
                            foundDist = dist;
                            setSelectedDistrict(dist);
                            break;
                        }
                    }
                    if (foundCity) break;
                }
            }

            // Strip the city and district from the displayed address field
            if (foundCity) {
                let remaining = initialData.address.slice(foundCity.length);
                if (foundDist) {
                    remaining = remaining.slice(foundDist.length);
                }
                setValue('address', remaining);
            }
        }
    }, [initialData, setValue]);

    const { fields: factoryFields, append: appendFactory, remove: removeFactory } = useFieldArray({
        control,
        name: "factories"
    });

    const [taxIdStatus, setTaxIdStatus] = useState<{ loading: boolean; error: string | null }>({
        loading: false,
        error: null
    });

    const formData = watch();
    const selectedCategory = watch('category');
    const taxIdValue = watch('taxId');
    const isExtraApplied = watch('isExtra') || false;
    const baseRate = watch('baseRate');
    const extraRate = watch('extraRate');

    // Handle Extra Checkbox side effects
    useEffect(() => {
        if (!isExtraApplied) {
            setValue('extraRate', '0.00');
        }
    }, [isExtraApplied]);

    // City District State
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    const handleCityChange = (city: string) => {
        setSelectedCity(city);
        setSelectedDistrict('');
    };

    const handleAddressTranslate = () => {
        const addressDetail = watch('address');
        if (selectedCity && selectedDistrict && addressDetail) {
            const { cityEn, districtEn } = translateCityDistrict(selectedCity, selectedDistrict);
            // Simple concatenation for now, user can edit
            // Ideally we should structure AddressEn similarly or just append
            const fullAddressEn = `${toPinyin(addressDetail)}, ${districtEn}, ${cityEn}, Taiwan (R.O.C.)`;
            setValue('addressEn', fullAddressEn);
        }
    };


    // Calculate Total Allocation Rate
    useEffect(() => {
        if (baseRate) {
            const base = parseFloat(baseRate);
            const extra = isExtraApplied && extraRate ? parseFloat(extraRate) : 0;
            const total = Math.min(0.40, base + extra).toFixed(2);
            setValue('allocationRate', total, { shouldValidate: true });
        }
    }, [baseRate, extraRate, isExtraApplied]);

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
            fields.push('factoryRegistrationNo', 'laborInsuranceNo', 'industryCode', 'avgDomesticWorkers');
        } else if (selectedCategory === 'HOME_CARE') {
            fields.push('patientName', 'patientIdNo', 'careAddress');
        }

        const filled = fields.filter(f => !!formData[f as keyof EmployerFormData]);
        return Math.round((filled.length / fields.length) * 100);
    };

    const getMissingItems = () => {
        return []; // Simply return empty for now to focus on critical errors. Logic can be restored if needed.
    };

    const completeness = calculateCompleteness();
    const missingItems = getMissingItems();

    const scrollToSection = (sectionId: string) => {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const getImpacts = () => {
        const impacts = [];
        if (!formData.companyName || !formData.taxId) {
            impacts.push({
                title: "無法建立檔案",
                description: "缺少雇主名稱或統編，系統無法建立有效索引。",
                level: 'error' as const
            });
        }
        return impacts;
    };

    const onSubmitForm: SubmitHandler<EmployerFormData> = async (data) => {
        try {
            // Map category to industryType for backend compatibility
            const payload = {
                ...data,
                industryType: data.category,
                // Combine address parts
                address: selectedCity || selectedDistrict ? `${selectedCity}${selectedDistrict}${data.address || ''}` : data.address,
                // Sanitize Empty Strings to undefined for Dates/Decimals
                allocationRate: data.allocationRate ? String(data.allocationRate) : undefined,
                capital: data.capital ? String(data.capital) : undefined,
                bedCount: data.bedCount ? Number(data.bedCount) : undefined,
                avgDomesticWorkers: data.avgDomesticWorkers ? Number(data.avgDomesticWorkers) : undefined,
                zeroFeeEffectiveDate: data.zeroFeeEffectiveDate || undefined,
                responsiblePersonDob: data.responsiblePersonDob || undefined,
                idIssueDate: data.idIssueDate || undefined,
                terminateDate: (data as any).terminateDate || undefined,
                // Ensure factories have numeric conversion if needed
                factories: data.factories?.map(f => ({
                    ...f,
                    laborCount: f.laborCount ? Number(f.laborCount) : 0,
                    foreignCount: f.foreignCount ? Number(f.foreignCount) : 0
                }))
            };

            await onSubmit(payload as any);
            toast.success(isEditMode ? '更新成功' : '建立成功');
        } catch (error: any) {
            toast.error(error.message || '操作失敗');
        }
    };

    const copyAddressToBilling = (checked: boolean) => {
        if (checked) {
            setValue('invoiceAddress', watch('address'), { shouldValidate: true });
            toast.success('已複製發票地址');
        }
    };

    const copyAddressToTax = (checked: boolean) => {
        if (checked) {
            setValue('taxAddress', watch('address'), { shouldValidate: true });
            toast.success('已複製稅籍地址');
        }
    };

    const copyAddressToHealth = (checked: boolean) => {
        if (checked) {
            setValue('healthBillAddress', watch('address'), { shouldValidate: true });
            toast.success('已複製健保帳單地址');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} className="max-w-[1600px] mx-auto p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content */}
                <div className="flex-1">
                    <Tabs defaultValue="basic" className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <TabsList className="bg-white border p-1 rounded-lg shadow-sm h-auto flex-wrap">
                                <TabsTrigger value="basic" className="px-4 py-2">基本資料</TabsTrigger>
                                <TabsTrigger value="responsible" className="px-4 py-2">負責人資料</TabsTrigger>
                                <TabsTrigger value="factories" className="px-4 py-2">廠區與地址</TabsTrigger>
                                <TabsTrigger value="licenses" className="px-4 py-2">證號與保險</TabsTrigger>
                                <TabsTrigger value="internal" className="px-4 py-2">內部管理</TabsTrigger>
                            </TabsList>
                            <div className="flex gap-2">
                                {onCancel && (
                                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                                        取消
                                    </Button>
                                )}
                                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                    {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    {isEditMode ? '儲存修改' : '確認新增'}
                                </Button>
                            </div>
                        </div>

                        {/* --- Tab: Basic Info --- */}
                        <TabsContent value="basic" className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Category & Code */}
                                    <div className="space-y-3">
                                        <Label className="required text-base font-semibold">雇主類型 (Employer Category)</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {Object.entries(INDUSTRIES).map(([key, label]) => (
                                                <div
                                                    key={key}
                                                    onClick={() => setValue('category', key)}
                                                    className={cn(
                                                        "cursor-pointer border rounded-lg p-3 text-center transition-all hover:bg-gray-50",
                                                        formData.category === key
                                                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200 text-blue-700 font-medium"
                                                            : "border-gray-200 text-gray-600"
                                                    )}
                                                >
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code">雇主編號 (Employer Code)</Label>
                                        <Input {...register('code')} placeholder="自訂編號 (ex: C001)" />
                                    </div>

                                    {/* Company Name & Tax ID */}
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName" className="required">雇主/公司名稱</Label>
                                        <Input {...register('companyName')} placeholder="公司全名" />
                                        {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="shortName">雇主簡稱</Label>
                                        <Input {...register('shortName')} placeholder="用於列表顯示" />
                                    </div>


                                    <div className="space-y-2">
                                        <Label htmlFor="taxId" className="required">統一編號 (TAX ID)</Label>
                                        <Input {...register('taxId')} placeholder="8碼統編" />
                                        {errors.taxId && <p className="text-red-500 text-xs">{errors.taxId.message}</p>}
                                        {taxIdStatus.error && <p className="text-amber-500 text-xs">{taxIdStatus.error}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="capital">資本額 (Capital)</Label>
                                        <Input {...register('capital')} placeholder="0" />
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">公司電話</Label>
                                        <Input {...register('phoneNumber')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="faxNumber">公司傳真</Label>
                                        <Input {...register('faxNumber')} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="companyNameEn">英文名稱 (English Name) - 勞動契約用</Label>
                                        <div className="flex gap-2">
                                            <Input {...register('companyNameEn')} placeholder="Official English Name" />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    const chinese = watch('companyName');
                                                    if (chinese) {
                                                        setValue('companyNameEn', toPinyin(chinese));
                                                    }
                                                }}
                                            >
                                                <Languages className="h-4 w-4 mr-1" /> 翻譯
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- Tab: Responsible Person --- */}
                        <TabsContent value="responsible" className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    負責人詳細資料
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="required">姓名 (Chinese Name)</Label>
                                        <Input {...register('responsiblePerson')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>英文姓名 (English Name)</Label>
                                        <Input {...register('englishName')} placeholder="同護照" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="required">身分證字號 (ID No.)</Label>
                                        <Input {...register('responsiblePersonIdNo')} className="font-mono" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>出生日期 (DOB)</Label>
                                        <Input type="date" {...register('responsiblePersonDob')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>出生地 (Birth Place)</Label>
                                        <Input {...register('birthPlace')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>出生地英文</Label>
                                        <Input {...register('birthPlaceEn')} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>發照日期</Label>
                                        <Input type="date" {...register('idIssueDate')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>發照地點</Label>
                                        <Input {...register('idIssuePlace')} placeholder="ex: 北市" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>役別</Label>
                                        <Input {...register('militaryStatus')} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>父親姓名</Label>
                                        <Input {...register('responsiblePersonFather')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>母親姓名</Label>
                                        <Input {...register('responsiblePersonMother')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>配偶姓名</Label>
                                        <Input {...register('responsiblePersonSpouse')} />
                                    </div>

                                    <div className="md:col-span-3 space-y-2">
                                        <Label>戶籍地址 (Residence Address)</Label>
                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-2">
                                                <Input {...register('residenceZip')} placeholder="郵遞區號" />
                                            </div>
                                            <div className="col-span-10">
                                                <Input {...register('residenceAddress')} placeholder="完整戶籍地址" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- Tab: Factories & Addresses --- */}
                        <TabsContent value="factories" className="space-y-6">
                            {/* Company Address */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    公司登記與發票地址
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="required">公司登記地址 (Registered Address)</Label>
                                        <div className="grid grid-cols-12 gap-2 mb-2">
                                            <div className="col-span-12 md:col-span-3">
                                                <Select value={selectedCity} onValueChange={handleCityChange}>
                                                    <SelectTrigger><SelectValue placeholder="縣市" /></SelectTrigger>
                                                    <SelectContent>
                                                        {Object.keys(TAIWAN_CITIES).map(city => (
                                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-12 md:col-span-3">
                                                <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedCity}>
                                                    <SelectTrigger><SelectValue placeholder="鄉鎮市區" /></SelectTrigger>
                                                    <SelectContent>
                                                        {selectedCity && TAIWAN_CITIES[selectedCity]?.map(dist => (
                                                            <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-12 md:col-span-6">
                                                <Input {...register('address')} placeholder="路街巷弄號樓 (不含縣市/區)" />
                                            </div>
                                        </div>
                                    </div>


                                    <div className="space-y-2">
                                        <Label>英文地址 (English Address)</Label>
                                        <div className="flex gap-2">
                                            <Input {...register('addressEn')} />
                                            <Button type="button" variant="outline" onClick={handleAddressTranslate}>
                                                <Languages className="h-4 w-4 mr-1" /> 翻譯
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>發票地址 (Invoice Address)</Label>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Checkbox id="copyInvoice" onCheckedChange={copyAddressToBilling} />
                                                <label htmlFor="copyInvoice" className="text-xs text-gray-500">同登記地址</label>
                                            </div>
                                            <Input {...register('invoiceAddress')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>稅籍地址 (Tax Address)</Label>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Checkbox id="copyTax" onCheckedChange={copyAddressToTax} />
                                                <label htmlFor="copyTax" className="text-xs text-gray-500">同登記地址</label>
                                            </div>
                                            <Input {...register('taxAddress')} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <Label>健保帳單地址</Label>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Checkbox id="copyHealth" onCheckedChange={copyAddressToHealth} />
                                                <label htmlFor="copyHealth" className="text-xs text-gray-500">同登記地址</label>
                                            </div>
                                            <Input {...register('healthBillAddress')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>郵遞區號</Label>
                                            <Input {...register('healthBillZip')} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Factories List */}
                            {selectedCategory === 'MANUFACTURING' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                            工廠列表 (Factories)
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => appendFactory({ name: `第 ${factoryFields.length + 1} 廠` })}
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> 新增廠區
                                        </Button>
                                    </div>

                                    {factoryFields.map((field, index) => (
                                        <div key={field.id} className="relative border rounded-lg p-4 mb-4 bg-gray-50">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 text-red-500 hover:bg-red-50"
                                                onClick={() => removeFactory(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="required">廠別名稱</Label>
                                                    <Input {...register(`factories.${index}.name`)} placeholder="ex: 一廠" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>工廠登記證號</Label>
                                                    <Input {...register(`factories.${index}.factoryRegNo`)} />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <Label>廠區地址</Label>
                                                    <Input {...register(`factories.${index}.address`)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>本勞人數</Label>
                                                    <Input type="number" {...register(`factories.${index}.laborCount`)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>外勞人數</Label>
                                                    <Input type="number" {...register(`factories.${index}.foreignCount`)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {factoryFields.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                            尚無工廠資料，請點擊新增
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Home Care Location */}
                            {selectedCategory === 'HOME_CARE' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-semibold text-lg mb-4">被看護人與地點</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>被看護人姓名</Label>
                                            <Input {...register('patientName')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>身分證號</Label>
                                            <Input {...register('patientIdNo')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>與雇主關係</Label>
                                            <Input {...register('relationship')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>照護地點</Label>
                                            <Input {...register('careAddress')} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* --- Tab: Licenses & Insurance --- */}
                        <TabsContent value="licenses" className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    證號與保險資料
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>行業代號</Label>
                                        <Input {...register('industryCode')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>國內勞工人數 (3K5 計算用)</Label>
                                        <Input type="number" {...register('avgDomesticWorkers')} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>勞保證號 (Labor Ins. No)</Label>
                                        <Input {...register('laborInsuranceNo')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>勞保單位代號 (Unit ID)</Label>
                                        <Input {...register('laborInsuranceId')} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>健保證號 (Health Ins. No)</Label>
                                        <Input {...register('healthInsuranceUnitNo')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>健保單位代號 (Unit ID)</Label>
                                        <Input {...register('healthInsuranceId')} />
                                    </div>

                                    {selectedCategory === 'INSTITUTION' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>機構代碼</Label>
                                                <Input {...register('institutionCode')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>許可床位數</Label>
                                                <Input type="number" {...register('bedCount')} />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="border-t pt-6 mt-6">
                                    <h4 className="font-medium mb-4">法規與配額 (Compliance)</h4>
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div className="flex-1 space-y-4">
                                            <Label className="required">核配比率 (Allocation Rate)</Label>
                                            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                                <Checkbox id="isExtra" onCheckedChange={(c: boolean) => setValue('isExtra', c)} checked={formData.isExtra} />
                                                <Label htmlFor="isExtra" className="cursor-pointer text-blue-800">申請 Extra 案 (附加就業安定費)</Label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-gray-500">工業局核定級別</Label>
                                                    <Select value={baseRate} onValueChange={(v) => setValue('baseRate', v)}>
                                                        <SelectTrigger><SelectValue placeholder="選擇級別" /></SelectTrigger>
                                                        <SelectContent>{BASE_RATES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-gray-500">Extra 比率</Label>
                                                    <Select value={extraRate} onValueChange={(v) => setValue('extraRate', v)} disabled={!isExtraApplied}>
                                                        <SelectTrigger><SelectValue placeholder="選擇" /></SelectTrigger>
                                                        <SelectContent>{EXTRA_RATES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <Label>適用法規標準</Label>
                                            <div className="mt-2">
                                                <ComplianceSelector
                                                    value={formData.complianceStandard || 'NONE'}
                                                    onChange={(v) => setValue('complianceStandard', v)}
                                                    effectiveDate={formData.zeroFeeEffectiveDate}
                                                    onEffectiveDateChange={(d) => setValue('zeroFeeEffectiveDate', d)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- Tab: Internal --- */}
                        <TabsContent value="internal" className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-blue-600" />
                                    內部管理資訊
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>介紹人 (Referrer)</Label>
                                        <Input {...register('referrer')} placeholder="介紹人姓名" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>所屬仲介公司 ID</Label>
                                        <Input {...register('agencyCompanyId')} placeholder="若為同業委託請填寫" />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <Label>聯絡人 (Contact Person)</Label>
                                        <Input {...register('contactPerson')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>聯絡電話 (Contact Phone)</Label>
                                        <Input {...register('contactPhone')} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="hidden xl:block w-80 shrink-0">
                    <EmployerSidebar
                        completeness={completeness}
                        missingItems={missingItems}
                        onScrollTo={() => { }}
                        impacts={getImpacts()}
                    />
                </div>
            </div>
        </form>
    );
}
