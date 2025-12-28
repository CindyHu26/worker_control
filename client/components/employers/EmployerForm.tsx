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
import { Building, User, FileText, Settings, Building2, Globe, Copy, Save, AlertTriangle, AlertCircle, Phone, MapPin, Plus, Trash2, Briefcase, Languages, Info as InfoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EmployerSidebar } from './EmployerSidebar';
import { INDUSTRIES, ALLOCATION_RATES, BASE_RATES, EXTRA_RATES } from '@/lib/leadConstants';
import { TAIWAN_CITIES } from '@/data/taiwan-cities';
import { toPinyin, translateCityDistrict } from '@/utils/translationUtils';

import { Checkbox } from "@/components/ui/checkbox";
import { useEmployerCategories, useApplicationTypes, useIndustryCodes, useDomesticAgencies } from '@/hooks/useReferenceData';

// Validation Schema
const baseSchema = z.object({
    // Basic
    code: z.string().optional(),
    shortName: z.string().optional(),
    companyName: z.string().min(1, '雇主/公司名稱為必填'),
    companyNameEn: z.string().optional().or(z.literal('')),
    taxId: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().optional().or(z.literal('')),
    mobilePhone: z.string().optional().or(z.literal('')),
    email: z.string().email('Email 格式錯誤').optional().or(z.literal('')),

    // Responsible Person
    responsiblePerson: z.string().optional(),
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(),
    englishName: z.string().optional(),
    birthPlace: z.string().optional(),
    birthPlaceEn: z.string().optional(),
    residenceAddress: z.string().optional(),
    residenceZip: z.string().optional(),
    residenceCityCode: z.string().optional(),
    responsiblePersonFather: z.string().optional(),
    responsiblePersonMother: z.string().optional(),
    responsiblePersonSpouse: z.string().optional(),
    mobilePhoneIndividual: z.string().optional(), // [Added]
    idIssueDate: z.string().optional(),

    idIssuePlace: z.string().optional(),
    militaryStatus: z.string().optional(),
    militaryStatusEn: z.string().optional(),

    // Addresses & Contact
    address: z.string().optional(),
    addressEn: z.string().optional(),
    invoiceAddress: z.string().optional(),
    taxAddress: z.string().optional(),
    healthBillAddress: z.string().optional(),
    healthBillZip: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),

    category: z.string(),
    categoryType: z.string().optional(), // 'BUSINESS' | 'INDIVIDUAL' | 'INSTITUTION'

    // Factories (Array)
    factories: z.array(z.object({
        id: z.string().optional(),
        name: z.string().min(1, '廠區名稱必填'),
        factoryRegNo: z.string().optional(),
        address: z.string().optional(),
        addressEn: z.string().optional(),
        zipCode: z.string().optional(),
        cityCode: z.string().optional(),
        laborCount: z.string().optional(),
        foreignCount: z.string().optional()
    })).optional(),

    // Manufacturing (CorporateInfo)
    factoryRegistrationNo: z.string().optional(),
    industryType: z.string().optional(),
    industryCode: z.string().optional(),
    capital: z.string().optional().or(z.literal('')),
    laborInsuranceNo: z.string().optional(),
    laborInsuranceId: z.string().optional(),
    healthInsuranceUnitNo: z.string().optional(),
    healthInsuranceId: z.string().optional(),
    faxNumber: z.string().optional().or(z.literal('')),

    // Home Care (IndividualInfo specifics)
    patientName: z.string().optional(),
    patientIdNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),

    // Institution
    institutionCode: z.string().optional(),
    bedCount: z.union([z.string(), z.number()]).optional(),

    // Internal Management
    referrer: z.string().optional(),
    agencyId: z.string().optional(),
    terminateDate: z.string().optional(),

    remarks: z.string().optional(),

    // Legacy / Industry Attributes
    industryAttributes: z.object({
        applicationType: z.string().optional(),
        isForeigner: z.string().optional(),
        businessRegistrationNo: z.string().optional(),
        licenseExpiryDate: z.string().optional(),
        managementSource: z.string().optional(),
        developmentDate: z.string().optional(),
        domesticAgency: z.string().optional(),
        adminStaff: z.string().optional(),
        salesAgent: z.string().optional(),
        customerService: z.string().optional(),
        professionalStaff: z.string().optional(),
        accountant: z.string().optional(),
        specialInstructions: z.string().optional(),
        timingReference: z.string().optional(),
        legacyRef95: z.string().optional(),
        legacyRef96: z.string().optional(),
        // [New] Agriculture Specifics
        qualificationLetter: z.string().optional(), // 農業部核發之資格認定函 (Individual/Farmer)
        outreachApproval: z.string().optional(),    // 外展計畫核定函 (Outreach)
    }).optional(),
});

const employerSchema = baseSchema.superRefine((data, ctx) => {
    // Determine type: Use hidden field categoryType or infer from known codes if fallback needed
    const isIndividual = data.categoryType === 'INDIVIDUAL';
    const isBusiness = data.categoryType === 'BUSINESS' || data.categoryType === 'INSTITUTION' || !data.categoryType; // Default to business if unknown

    if (isIndividual) {
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

    // [New] Agriculture Validation
    if (data.category === 'AGRICULTURE_FARMING' && isIndividual) {
        if (!data.industryAttributes?.qualificationLetter) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "個人農民申請必須填寫「農業部資格認定函文號」",
                path: ["industryAttributes", "qualificationLetter"]
            });
        }
    }
    if (data.category === 'AGRICULTURE_OUTREACH') {
        if (!data.industryAttributes?.outreachApproval) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "外展農務工作必須填寫「外展計畫核定函文號」",
                path: ["industryAttributes", "outreachApproval"]
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
            address: '',
            invoiceAddress: '',
            factories: []
        }) as EmployerFormData
    });

    // Load reference data
    const { categories, loading: categoriesLoading } = useEmployerCategories();
    const { types: applicationTypes, loading: appTypesLoading } = useApplicationTypes();
    const { codes: industryCodes, loading: industryCodesLoading } = useIndustryCodes();
    const { agencies: domesticAgencies, loading: domesticAgenciesLoading } = useDomesticAgencies();


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
    const selectedCategoryType = watch('categoryType');
    const taxIdValue = watch('taxId');

    const isIndividual = selectedCategoryType === 'INDIVIDUAL';
    const isBusiness = selectedCategoryType === 'BUSINESS' || selectedCategoryType === 'INSTITUTION';

    // Update categoryType when category changes
    useEffect(() => {
        if (selectedCategory && categories.length > 0) {
            const cat = categories.find(c => c.code === selectedCategory);
            if (cat) {
                // Special Rule for Agriculture Farming: Allow toggling
                if (selectedCategory === 'AGRICULTURE_FARMING') {
                    // Do not auto-reset if already set to a valid type for this category
                    const currentType = watch('categoryType');
                    if (currentType !== 'BUSINESS' && currentType !== 'INDIVIDUAL') {
                        setValue('categoryType', 'INDIVIDUAL'); // Default to Individual (Farmer) or Business? Let's default to Individual as per user story "Farmer"
                    }
                } else {
                    setValue('categoryType', cat.type || 'BUSINESS');
                }
            }
        }
    }, [selectedCategory, categories, setValue, watch]);

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

        const isIndividual = selectedCategoryType === 'INDIVIDUAL';
        const isBusiness = selectedCategoryType === 'BUSINESS' || selectedCategoryType === 'INSTITUTION';

        if (isBusiness) {
            fields.push('factoryRegistrationNo', 'laborInsuranceNo', 'industryCode', 'avgDomesticWorkers');
        } else if (isIndividual) {
            // Remove taxId from required checks for Individual
            const taxIdIndex = fields.indexOf('taxId');
            if (taxIdIndex > -1) fields.splice(taxIdIndex, 1);

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
            // Map flat form data to nested Prisma structure
            const payload: any = {
                code: data.code,
                shortName: data.shortName,
                companyName: data.companyName,
                companyNameEn: data.companyNameEn,
                taxId: data.taxId,
                phoneNumber: data.phoneNumber,
                mobilePhone: data.mobilePhone,
                email: data.email,
                address: selectedCity || selectedDistrict ? `${selectedCity}${selectedDistrict}${data.address || ''}` : data.address,
                addressEn: data.addressEn,
                invoiceAddress: data.invoiceAddress,
                taxAddress: data.taxAddress,
                healthBillAddress: data.healthBillAddress,
                healthBillZip: data.healthBillZip,
                contactPerson: data.contactPerson,
                contactPhone: data.contactPhone,
                referrer: data.referrer,
                agencyId: data.agencyId,
                terminateDate: data.terminateDate,
                industryAttributes: data.industryAttributes,
                category: data.category,
                remarks: data.remarks,
            };

            // Corporate Info
            if (isBusiness) {
                payload.corporateInfo = {
                    factoryRegistrationNo: data.factoryRegistrationNo,
                    industryType: data.industryType,
                    industryCode: data.industryCode,
                    capital: data.capital,
                    laborInsuranceNo: data.laborInsuranceNo,
                    laborInsuranceId: data.laborInsuranceId,
                    healthInsuranceUnitNo: data.healthInsuranceUnitNo,
                    healthInsuranceId: data.healthInsuranceId,
                    faxNumber: data.faxNumber,
                    institutionCode: data.institutionCode,
                    bedCount: data.bedCount,
                };
            }

            // Individual Info
            if (isIndividual || data.responsiblePersonIdNo) {
                payload.individualInfo = {
                    responsiblePersonDob: data.responsiblePersonDob,
                    responsiblePersonIdNo: data.responsiblePersonIdNo,
                    responsiblePersonFather: data.responsiblePersonFather,
                    responsiblePersonMother: data.responsiblePersonMother,
                    responsiblePersonSpouse: data.responsiblePersonSpouse,
                    mobilePhone: data.mobilePhoneIndividual,
                    englishName: data.englishName,

                    birthPlace: data.birthPlace,
                    birthPlaceEn: data.birthPlaceEn,
                    residenceAddress: data.residenceAddress,
                    residenceZip: data.residenceZip,
                    residenceCityCode: data.residenceCityCode,
                    idIssueDate: data.idIssueDate,
                    idIssuePlace: data.idIssuePlace,
                    militaryStatus: data.militaryStatus,
                    militaryStatusEn: data.militaryStatusEn,
                    patientName: data.patientName,
                    patientIdNo: data.patientIdNo,
                    careAddress: data.careAddress,
                    relationship: data.relationship,
                };
            }

            // Factories
            if (data.factories && data.factories.length > 0) {
                payload.factories = data.factories.map(f => ({
                    ...f,
                    laborCount: f.laborCount ? Number(f.laborCount) : 0,
                    foreignCount: f.foreignCount ? Number(f.foreignCount) : 0
                }));
            }

            await onSubmit(payload);
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
                                    <div className="space-y-2">
                                        <Label className="required text-base font-semibold">雇主類型 (Employer Category)</Label>
                                        <Select value={formData.category} onValueChange={(v) => setValue('category', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={categoriesLoading ? "載入中..." : "選擇雇主類型"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.code} value={cat.code}>
                                                        {cat.nameZh}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code">雇主編號 (Employer Code)</Label>
                                        <Input {...register('code')} placeholder="自訂編號 (ex: C001)" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>申請類別 (Application Type)</Label>
                                        <Select value={formData.industryAttributes?.applicationType || '1'} onValueChange={(v) => setValue('industryAttributes.applicationType', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={appTypesLoading ? "載入中..." : "選擇類別"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {applicationTypes.map(type => (
                                                    <SelectItem key={type.code} value={type.code}>
                                                        {type.nameZh}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Category Type Toggle for Agriculture Farming */}
                                    {selectedCategory === 'AGRICULTURE_FARMING' && (
                                        <div className="md:col-span-2 bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
                                            <Label className="block mb-2 font-semibold text-yellow-800">申請身分 (Identity)</Label>
                                            <div className="flex gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        id="type-individual"
                                                        value="INDIVIDUAL"
                                                        checked={selectedCategoryType === 'INDIVIDUAL'}
                                                        onChange={() => setValue('categoryType', 'INDIVIDUAL')}
                                                        className="h-4 w-4 text-blue-600"
                                                    />
                                                    <Label htmlFor="type-individual" className="cursor-pointer">個人 (自然人/農民)</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        id="type-business"
                                                        value="BUSINESS"
                                                        checked={selectedCategoryType === 'BUSINESS'}
                                                        onChange={() => setValue('categoryType', 'BUSINESS')}
                                                        className="h-4 w-4 text-blue-600"
                                                    />
                                                    <Label htmlFor="type-business" className="cursor-pointer">法人 (農企業/農場)</Label>
                                                </div>
                                            </div>
                                            {selectedCategoryType === 'INDIVIDUAL' && (
                                                <div className="mt-2 text-sm text-yellow-700">
                                                    <InfoIcon className="inline h-4 w-4 mr-1" />
                                                    由擁有農保/農民身分的自然人提出申請。
                                                    <span className="block font-semibold mt-1">核配比率 (Quota): 1:1 (滿1人有農保可聘1移工，上限10人)</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Company Name & Tax ID */}
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName" className="required">
                                            {isIndividual ? '申請人姓名/農場名稱' : '雇主/公司名稱'}
                                        </Label>
                                        <Input {...register('companyName')} placeholder={isIndividual ? "例: 陳小明 (自耕農)" : "公司全名"} />
                                        {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="shortName">
                                            {isIndividual ? '簡稱 (或農場名)' : '雇主簡稱'}
                                        </Label>
                                        <Input {...register('shortName')} placeholder="用於列表顯示" />
                                    </div>

                                    {/* Agriculture Qualification Fields */}
                                    {(selectedCategory === 'AGRICULTURE_FARMING' && isIndividual) && (
                                        <div className="md:col-span-2 space-y-2 bg-green-50 p-4 rounded border border-green-200">
                                            <Label className="required font-semibold text-green-800">
                                                農業部核發之資格認定函文號 (MOA Qualification Letter)
                                            </Label>
                                            <Input
                                                {...register('industryAttributes.qualificationLetter')}
                                                placeholder="請輸入函文號 (前置資格認定)"
                                            />
                                            <p className="text-xs text-green-700 mt-1">
                                                * 需檢附農民健康保險證明或實際從農證明(年銷25萬以上)向農業部取得此函。
                                            </p>
                                        </div>
                                    )}

                                    {(selectedCategory === 'AGRICULTURE_OUTREACH') && (
                                        <div className="md:col-span-2 space-y-2 bg-blue-50 p-4 rounded border border-blue-200">
                                            <Label className="required font-semibold text-blue-800">
                                                外展計畫核定函文號 (Outreach Plan Approval)
                                            </Label>
                                            <Input
                                                {...register('industryAttributes.outreachApproval')}
                                                placeholder="請輸入核定函號"
                                            />
                                            <p className="text-xs text-blue-700 mt-1">
                                                * 外展農務工作需先取得外展計畫核定。
                                            </p>
                                        </div>
                                    )}


                                    {/* Tax ID for Business / ID Number for Individual */}
                                    {!isIndividual ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="taxId" className="required">統一編號 (TAX ID)</Label>
                                            <Input {...register('taxId')} placeholder="8碼統編" />
                                            {errors.taxId && <p className="text-red-500 text-xs">{errors.taxId.message}</p>}
                                            {taxIdStatus.error && <p className="text-amber-500 text-xs">{taxIdStatus.error}</p>}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="responsiblePersonIdNo" className="required">身分證字號 (ID Number)</Label>
                                            <Input {...register('responsiblePersonIdNo')} className="font-mono" placeholder="A123456789" />
                                            {errors.responsiblePersonIdNo && <p className="text-red-500 text-xs">{errors.responsiblePersonIdNo.message}</p>}
                                        </div>
                                    )}

                                    {/* Patient Info Section for Home Care */}
                                    {isIndividual && (selectedCategory === 'HOME_CARE' || selectedCategory === 'HOME_HELPER') && (
                                        <div className="md:col-span-2 bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-4">
                                            <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                被看護人資料 (Patient Info)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="required">被看護人姓名 (Patient Name)</Label>
                                                    <Input {...register('patientName')} placeholder="被照顧者姓名" />
                                                    {errors.patientName && <p className="text-red-500 text-xs">{errors.patientName.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="required">被看護人身分證字號 (Patient ID)</Label>
                                                    <Input {...register('patientIdNo')} className="font-mono" placeholder="A123456789" />
                                                    {errors.patientIdNo && <p className="text-red-500 text-xs">{errors.patientIdNo.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>與雇主關係 (Relationship)</Label>
                                                    <Select value={formData.relationship || ''} onValueChange={(v) => setValue('relationship', v)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="選擇關係" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="SELF">本人</SelectItem>
                                                            <SelectItem value="PARENT">父母</SelectItem>
                                                            <SelectItem value="SPOUSE">配偶</SelectItem>
                                                            <SelectItem value="GRANDPARENT">祖父母</SelectItem>
                                                            <SelectItem value="IN_LAW">岳父母/公婆</SelectItem>
                                                            <SelectItem value="OTHER">其他</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>照護地址 (Care Address)</Label>
                                                    <Input {...register('careAddress')} placeholder="被照顧者實際居住地址" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
                                        <Label htmlFor="mobilePhone">行動電話</Label>
                                        <Input {...register('mobilePhone')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">電子郵件 (Company Email)</Label>
                                        <Input {...register('email')} placeholder="example@company.com" />
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
                                        <div className="flex gap-2">
                                            <Input {...register('englishName')} placeholder="同護照" />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    const chinese = watch('responsiblePerson');
                                                    if (chinese) {
                                                        setValue('englishName', toPinyin(chinese));
                                                    }
                                                }}
                                            >
                                                <Languages className="h-4 w-4 mr-1" /> 翻譯
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>外籍人士 (Foreigner)</Label>
                                        <Select value={formData.industryAttributes?.isForeigner || 'N'} onValueChange={(v) => setValue('industryAttributes.isForeigner', v)}>
                                            <SelectTrigger><SelectValue placeholder="否/是" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="N">否 (No)</SelectItem>
                                                <SelectItem value="Y">是 (Yes)</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                        <div className="flex gap-2">
                                            <Input {...register('birthPlaceEn')} />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    const chinese = watch('birthPlace');
                                                    if (chinese) {
                                                        setValue('birthPlaceEn', toPinyin(chinese));
                                                    }
                                                }}
                                            >
                                                <Languages className="h-4 w-4 mr-1" /> 翻譯
                                            </Button>
                                        </div>
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
                                    <div className="space-y-2">
                                        <Label>負責人行動電話</Label>
                                        <Input {...register('mobilePhoneIndividual')} placeholder="09xx-xxx-xxx" />
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
                            {(selectedCategoryType === 'BUSINESS' || selectedCategoryType === 'INSTITUTION') && (
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
                                                <div className="md:col-span-2 space-y-2">
                                                    <Label>廠區英文地址</Label>
                                                    <div className="flex gap-2">
                                                        <Input {...register(`factories.${index}.addressEn`)} />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const address = watch(`factories.${index}.address`);
                                                                if (address) {
                                                                    const fullAddressEn = `${toPinyin(address)}, Taiwan (R.O.C.)`; // Simplified translation for factory
                                                                    setValue(`factories.${index}.addressEn`, fullAddressEn);
                                                                }
                                                            }}
                                                        >
                                                            <Languages className="h-4 w-4 mr-1" /> 翻譯
                                                        </Button>
                                                    </div>
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
                                        <Label>行業代號 (Industry Code)</Label>
                                        <Select value={formData.industryCode} onValueChange={(v) => setValue('industryCode', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={industryCodesLoading ? "載入中..." : "選擇行業代號"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {industryCodes.map(code => (
                                                    <SelectItem key={code.code} value={code.code}>
                                                        {code.code} - {code.nameZh}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                    <div className="space-y-2">
                                        <Label>營利事業證號</Label>
                                        <Input {...register('industryAttributes.businessRegistrationNo')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>執照效期</Label>
                                        <Input type="date" {...register('industryAttributes.licenseExpiryDate')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>國內仲介</Label>
                                        <Select value={formData.industryAttributes?.domesticAgency} onValueChange={(v) => setValue('industryAttributes.domesticAgency', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={domesticAgenciesLoading ? "載入中..." : "選擇主體"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {domesticAgencies.map(agency => (
                                                    <SelectItem key={agency.code} value={agency.code}>
                                                        {agency.code} - {agency.agencyNameShort || agency.agencyNameZh}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        <Input {...register('agencyId')} placeholder="若為同業委託請填寫" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>來源別 (Source)</Label>
                                        <Select value={formData.industryAttributes?.managementSource} onValueChange={(v) => setValue('industryAttributes.managementSource', v)}>
                                            <SelectTrigger><SelectValue placeholder="來源" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="業務開發">業務開發</SelectItem>
                                                <SelectItem value="電訪件">電訪件</SelectItem>
                                                <SelectItem value="公關件">公關件</SelectItem>
                                                <SelectItem value="公司件">公司件</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>開發日期</Label>
                                        <Input type="date" {...register('industryAttributes.developmentDate')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>行政人員 (Admin)</Label>
                                        <Input {...register('industryAttributes.adminStaff')} />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <Label>聯絡人 (Contact Person)</Label>
                                        <Input {...register('contactPerson')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>聯絡電話 (Contact Phone)</Label>
                                        <Input {...register('contactPhone')} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>附註 (Remarks)</Label>
                                        <Textarea {...register('remarks')} rows={4} placeholder="輸入雇主相關附註資訊..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>業務員 (Sales Agent)</Label>
                                        <Input {...register('industryAttributes.salesAgent')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>客服員 (Customer Service)</Label>
                                        <Input {...register('industryAttributes.customerService')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>專業人員 (Professional Staff)</Label>
                                        <Input {...register('industryAttributes.professionalStaff')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>會計人員 (Accountant)</Label>
                                        <Input {...register('industryAttributes.accountant')} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>特殊說明 / 接送時間 (Instructions)</Label>
                                        <Input {...register('industryAttributes.specialInstructions')} />
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
