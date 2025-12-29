
import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AlertCircle, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { employerSchema, type EmployerFormData } from './EmployerFormSchema';
import BasicInfoSection from './sections/BasicInfoSection';
import ResponsiblePersonSection from './sections/ResponsiblePersonSection';
import FactoriesSection from './sections/FactoriesSection';
import LicenseSection from './sections/LicenseSection';
import InternalManagementSection from './sections/InternalManagementSection';

import { useSystemConfig } from '@/hooks/useSystemConfig';

interface EmployerFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    isEdit?: boolean;
}

export default function EmployerForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    isEdit = false
}: EmployerFormProps) {
    const router = useRouter();
    const { getCategories, getApplicationTypes } = useSystemConfig();

    // Config Data Loading
    const [categories, setCategories] = useState<any[]>([]);
    const [catLoading, setCatLoading] = useState(true);
    const [appTypes, setAppTypes] = useState<any[]>([]);
    const [appTypesLoading, setAppTypesLoading] = useState(true);

    useEffect(() => {
        getCategories().then(data => { setCategories(data); setCatLoading(false); });
        getApplicationTypes().then(data => { setAppTypes(data); setAppTypesLoading(false); });
    }, []);

    // Form Setup
    const methods = useForm<EmployerFormData>({
        resolver: zodResolver(employerSchema),
        defaultValues: {
            category: 'MANUFACTURING',
            categoryType: 'BUSINESS',
            industryAttributes: {
                isForeigner: 'N',
            },
            factories: []
        }
    });

    const { reset, handleSubmit, setValue, formState: { errors, isSubmitting } } = methods;

    // Reset with Initial Data
    useEffect(() => {
        if (initialData) {
            console.log('Resetting form with initialData', initialData);

            // Map API data to Form Schema
            const formData: Partial<EmployerFormData> = {
                ...initialData,
                // Basic
                category: initialData.category?.code || initialData.categoryCode || 'MANUFACTURING', // Fallback? 
                // Determine Category Type if missing
                categoryType: initialData.individualInfo ? 'INDIVIDUAL' : 'BUSINESS', // Heuristic

                // Dates -> String (YYYY-MM-DD)
                zeroFeeEffectiveDate: initialData.zeroFeeEffectiveDate ? new Date(initialData.zeroFeeEffectiveDate).toISOString().split('T')[0] : undefined,
                terminateDate: initialData.terminateDate ? new Date(initialData.terminateDate).toISOString().split('T')[0] : undefined,

                // Corporate Info
                factoryRegistrationNo: initialData.corporateInfo?.factoryRegistrationNo,
                industryType: initialData.corporateInfo?.industryType,
                industryCode: initialData.corporateInfo?.industryCode,
                capital: String(initialData.corporateInfo?.capital || ''),
                laborInsuranceNo: initialData.corporateInfo?.laborInsuranceNo,
                laborInsuranceId: initialData.corporateInfo?.laborInsuranceId,
                healthInsuranceUnitNo: initialData.corporateInfo?.healthInsuranceUnitNo,
                healthInsuranceId: initialData.corporateInfo?.healthInsuranceId,
                institutionCode: initialData.corporateInfo?.institutionCode,
                bedCount: initialData.corporateInfo?.bedCount,
                faxNumber: initialData.corporateInfo?.faxNumber,

                // Individual Info
                responsiblePersonIdNo: initialData.individualInfo?.responsiblePersonIdNo ||
                    (initialData.taxId && initialData.taxId.length === 10 ? initialData.taxId : ''),
                responsiblePersonDob: initialData.individualInfo?.responsiblePersonDob ? new Date(initialData.individualInfo.responsiblePersonDob).toISOString().split('T')[0] : undefined,
                englishName: initialData.individualInfo?.englishName,
                birthPlace: initialData.individualInfo?.birthPlace,
                birthPlaceEn: initialData.individualInfo?.birthPlaceEn,
                residenceAddress: initialData.individualInfo?.residenceAddress,
                residenceZip: initialData.individualInfo?.residenceZip,
                residenceCityCode: initialData.individualInfo?.residenceCityCode,
                responsiblePersonFather: initialData.individualInfo?.responsiblePersonFather,
                responsiblePersonMother: initialData.individualInfo?.responsiblePersonMother,
                responsiblePersonSpouse: initialData.individualInfo?.responsiblePersonSpouse,
                idIssueDate: initialData.individualInfo?.idIssueDate ? new Date(initialData.individualInfo.idIssueDate).toISOString().split('T')[0] : undefined,
                idIssuePlace: initialData.individualInfo?.idIssuePlace,
                militaryStatus: initialData.individualInfo?.militaryStatus,

                patientName: initialData.individualInfo?.patientName,
                patientIdNo: initialData.individualInfo?.patientIdNo,
                careAddress: initialData.individualInfo?.careAddress,
                relationship: initialData.individualInfo?.relationship,

                // Factories
                factories: initialData.factories?.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    factoryRegNo: f.factoryRegNo,
                    address: f.address,
                    addressEn: f.addressEn,
                    zipCode: f.zipCode,
                    cityCode: f.cityCode,
                    laborCount: String(f.laborCount || 0),
                    foreignCount: String(f.foreignCount || 0)
                })) || [],

                // Industry Attributes (JSON)
                industryAttributes: typeof initialData.industryAttributes === 'string'
                    ? JSON.parse(initialData.industryAttributes)
                    : (initialData.industryAttributes || {}),

                // Labor Count (Most recent year/month logic? Original code used `avgDomesticWorkers` as plain field if stored or calculated)
                // Assuming API returns it as top level or we need to extract from `laborCounts` relation if present.
                // Original code had: avgDomesticWorkers: initialData.avgDomesticWorkers || (initialData.laborCounts?.[0]?.count ? String(initialData.laborCounts[0].count) : '')
                avgDomesticWorkers: initialData.avgDomesticWorkers ? String(initialData.avgDomesticWorkers) :
                    (initialData.laborCounts && initialData.laborCounts.length > 0 ? String(initialData.laborCounts[0].count) : '')
            };

            // If category is Farming, explicit categoryType might need to be set if not inferred correctly
            if (formData.category === 'AGRICULTURE_FARMING' && !formData.categoryType) {
                // Check if individual info exists
                formData.categoryType = initialData.individualInfo ? 'INDIVIDUAL' : 'BUSINESS';
            }

            reset(formData);
        }
    }, [initialData, reset]);

    const onSubmitForm = async (data: EmployerFormData) => {
        try {
            await onSubmit(data); // employerService will parse numbers/dates
        } catch (error) {
            console.error(error);
            toast.error('儲存失敗，請檢查表單內容');
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmitForm)} className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">

                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-4 z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '編輯雇主資料' : '新增雇主資料'}</h1>
                        <p className="text-gray-500 text-sm mt-1">請填寫完整的雇主資訊</p>
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
                            <X className="h-4 w-4" /> 取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isLoading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                            <Save className="h-4 w-4" />
                            {isSubmitting ? '儲存中...' : '儲存資料'}
                        </Button>
                    </div>
                </div>

                {/* Form Errors Summary */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>表單有誤，請檢查以下欄位：</span>
                        </div>
                        <ul className="list-disc list-inside text-sm pl-5">
                            {Object.entries(errors).map(([key, error]) => (
                                <li key={key}>
                                    {/* Try to map field key to a readable name if possible, else key */}
                                    <span className="font-medium capitalize">{key}:</span> {String(error?.message || '格式錯誤')}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-6">
                        <TabsTrigger value="basic">基本資料</TabsTrigger>
                        <TabsTrigger value="factories">工廠與地址</TabsTrigger>
                        <TabsTrigger value="management">內部管理</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6">
                        <BasicInfoSection
                            categories={categories}
                            categoriesLoading={catLoading}
                            applicationTypes={appTypes}
                            appTypesLoading={appTypesLoading}
                        />
                        <ResponsiblePersonSection />
                        <LicenseSection />
                    </TabsContent>

                    <TabsContent value="factories" className="space-y-6">
                        <FactoriesSection />
                    </TabsContent>

                    <TabsContent value="management" className="space-y-6">
                        <InternalManagementSection />
                    </TabsContent>
                </Tabs>
            </form>
        </FormProvider>
    );
}
