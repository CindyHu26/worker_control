
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { employerSchema, type EmployerFormData } from './EmployerFormSchema';
import BasicInfoSection from './sections/BasicInfoSection';
import ContactSection from './sections/ContactSection';
import FactoriesSection from './sections/FactoriesSection';
import LicenseSection from './sections/LicenseSection';
import InternalManagementSection from './sections/InternalManagementSection';
import { TAIWAN_CITIES } from '@/data/taiwan-cities';

interface EmployerFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    isEdit?: boolean;
}

// Helper to parse address string into components
function parseAddressStr(fullAddr: string | undefined | null) {
    if (!fullAddr) return {};
    for (const city of Object.keys(TAIWAN_CITIES)) {
        if (fullAddr.startsWith(city)) {
            const rest = fullAddr.slice(city.length);
            const districts = TAIWAN_CITIES[city];
            for (const dist of districts) {
                if (rest.startsWith(dist)) {
                    return { city, district: dist, detail: rest.slice(dist.length) };
                }
            }
            return { city, detail: rest };
        }
    }
    return { detail: fullAddr };
}

/**
 * EmployerForm - 雇主資料表單
 * 
 * 根據參考 HTML (雇主基本資料檔.html) 重新設計
 */
export default function EmployerForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    isEdit = false
}: EmployerFormProps) {
    const router = useRouter();

    // Form Setup
    const methods = useForm<EmployerFormData>({
        resolver: zodResolver(employerSchema),
        defaultValues: {
            factories: []
        }
    });

    const { reset, handleSubmit, formState: { errors, isSubmitting } } = methods;

    // Reset with Initial Data
    useEffect(() => {
        if (initialData) {
            console.log('Resetting form with initialData', initialData);

            // Parse Addresses
            const residenceAddr = initialData.residenceAddress || initialData.individualInfo?.residenceAddress;
            const residenceParsed = parseAddressStr(residenceAddr);

            const companyAddr = initialData.address;
            const companyParsed = parseAddressStr(companyAddr);

            // Map API data to Form Schema
            const formData: Partial<EmployerFormData> = {
                // 區塊一：雇主識別
                code: initialData.code,
                taxId: initialData.taxId,
                shortName: initialData.shortName,

                // 區塊二：公司資訊
                companyName: initialData.companyName,
                companyNameEn: initialData.companyNameEn,
                isForeignOwner: initialData.isForeignOwner || false,

                // 區塊三：負責人資訊
                responsiblePerson: initialData.responsiblePerson,
                englishName: initialData.englishName || initialData.individualInfo?.englishName,
                responsiblePersonIdNo: initialData.responsiblePersonIdNo || initialData.individualInfo?.responsiblePersonIdNo,
                responsiblePersonDob: initialData.responsiblePersonDob
                    ? new Date(initialData.responsiblePersonDob).toISOString().split('T')[0]
                    : (initialData.individualInfo?.responsiblePersonDob
                        ? new Date(initialData.individualInfo.responsiblePersonDob).toISOString().split('T')[0]
                        : undefined),

                // Residence Address
                residenceZip: initialData.residenceZip || initialData.individualInfo?.residenceZip,
                residenceCityCode: initialData.residenceCityCode || initialData.individualInfo?.residenceCityCode,
                residenceCity: residenceParsed.city,
                residenceDistrict: residenceParsed.district,
                residenceDetailAddress: residenceParsed.detail,
                residenceAddress: residenceAddr, // Full string
                residenceAddressEn: initialData.residenceAddressEn || initialData.individualInfo?.residenceAddressEn,

                birthPlace: initialData.birthPlace || initialData.individualInfo?.birthPlace,
                birthPlaceEn: initialData.birthPlaceEn || initialData.individualInfo?.birthPlaceEn,
                responsiblePersonFather: initialData.individualInfo?.responsiblePersonFather,
                responsiblePersonMother: initialData.individualInfo?.responsiblePersonMother,
                responsiblePersonSpouse: initialData.individualInfo?.responsiblePersonSpouse,
                idIssueDate: initialData.individualInfo?.idIssueDate
                    ? new Date(initialData.individualInfo.idIssueDate).toISOString().split('T')[0]
                    : undefined,
                idIssuePlace: initialData.individualInfo?.idIssuePlace,
                militaryStatus: initialData.individualInfo?.militaryStatus,
                militaryStatusEn: initialData.individualInfo?.militaryStatusEn,

                // 區塊四：公司地址
                companyZip: initialData.companyZip,
                companyCityCode: initialData.companyCityCode,
                companyCity: companyParsed.city,
                companyDistrict: companyParsed.district,
                companyDetailAddress: companyParsed.detail,
                address: companyAddr, // Full string
                addressEn: initialData.addressEn,

                // 區塊五：聯絡資訊
                contactPerson: initialData.contactPerson,
                phoneNumber: initialData.phoneNumber,
                faxNumber: initialData.faxNumber || initialData.corporateInfo?.faxNumber,
                mobilePhone: initialData.mobilePhone,
                email: initialData.email,
                contactPerson2: initialData.contactPerson2,
                contactPhone2: initialData.contactPhone2,
                contactFax2: initialData.contactFax2,
                contactMobile2: initialData.contactMobile2,
                contactEmail2: initialData.contactEmail2,
                contactBirthday: initialData.contactBirthday
                    ? new Date(initialData.contactBirthday).toISOString().split('T')[0]
                    : undefined,

                // 區塊六：保險/證照
                laborInsuranceNo: initialData.laborInsuranceNo || initialData.corporateInfo?.laborInsuranceNo,
                healthInsuranceUnitNo: initialData.healthInsuranceUnitNo || initialData.corporateInfo?.healthInsuranceUnitNo,
                businessRegistrationNo: initialData.businessRegistrationNo,
                factoryRegistrationNo: initialData.factoryRegistrationNo || initialData.corporateInfo?.factoryRegistrationNo,
                licenseExpiryDate: initialData.licenseExpiryDate
                    ? new Date(initialData.licenseExpiryDate).toISOString().split('T')[0]
                    : undefined,

                // 區塊七：內部管理
                salesAgentId: initialData.salesAgentId,
                professionalStaffId: initialData.professionalStaffId,
                customerServiceId: initialData.customerServiceId,
                adminStaffId: initialData.adminStaffId,
                accountantId: initialData.accountantId,
                remarks: initialData.remarks,
                referrer: initialData.referrer,
                managementSource: initialData.managementSource,
                developmentDate: initialData.developmentDate
                    ? new Date(initialData.developmentDate).toISOString().split('T')[0]
                    : undefined,
                agencyId: initialData.agencyId,
                terminateDate: initialData.terminateDate
                    ? new Date(initialData.terminateDate).toISOString().split('T')[0]
                    : undefined,

                // 區塊八：工廠
                factories: initialData.factories?.map((f: any) => {
                    const fParsed = parseAddressStr(f.address);
                    return {
                        id: f.id,
                        name: f.name,
                        factoryRegNo: f.factoryRegNo,
                        address: f.address,
                        detailAddress: fParsed.detail,
                        city: fParsed.city,
                        district: fParsed.district,
                        addressEn: f.addressEn,
                        zipCode: f.zipCode,
                        cityCode: f.cityCode,
                        laborCount: String(f.laborCount || ''),
                        foreignCount: String(f.foreignCount || '')
                    };
                }) || [],

                // 其他地址
                invoiceAddress: initialData.invoiceAddress,
                taxAddress: initialData.taxAddress,
                healthBillAddress: initialData.healthBillAddress,
                healthBillZip: initialData.healthBillZip,
            };

            reset(formData);
        }
    }, [initialData, reset]);

    const onSubmitForm = async (data: EmployerFormData) => {
        try {
            await onSubmit(data);
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
                                    <span className="font-medium capitalize">{key}:</span> {String(error?.message || '格式錯誤')}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="w-full max-w-full overflow-x-auto justify-start md:justify-center mb-6 inline-flex h-auto p-1 text-muted-foreground">
                        {/* Modified layout to be flex and scrollable on small screens, ensuring it doesn't break out */}
                        <TabsTrigger value="basic" className="flex-1 min-w-[100px]">基本資料</TabsTrigger>
                        <TabsTrigger value="contact" className="flex-1 min-w-[100px]">聯絡資訊</TabsTrigger>
                        <TabsTrigger value="factories" className="flex-1 min-w-[100px]">工廠資訊</TabsTrigger>
                        <TabsTrigger value="management" className="flex-1 min-w-[100px]">內部管理</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6">
                        <BasicInfoSection />
                        <LicenseSection />
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6">
                        <ContactSection />
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
