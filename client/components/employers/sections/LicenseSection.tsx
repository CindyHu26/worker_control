import { useFormContext, Controller } from 'react-hook-form';
import RocDateInput from '@/components/common/RocDateInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import type { EmployerFormData } from '../EmployerFormSchema';

/**
 * LicenseSection - 保險/證照資訊區塊
 * 
 * 包含：勞保證號、健保單位代號、營利事業證號、工廠登記證號、執照效期
 * 
 * 注意：行業別代碼和名稱已移至工業局認定函管理
 */
export default function LicenseSection() {
    const { register, control } = useFormContext<EmployerFormData>();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 border-b pb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                保險與證照資訊
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="laborInsuranceNo">公司勞保證號</Label>
                    <Input {...register('laborInsuranceNo')} placeholder="例: 01234567" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="healthInsuranceUnitNo">健保單位代號</Label>
                    <Input {...register('healthInsuranceUnitNo')} placeholder="例: 123456789" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="businessRegistrationNo">營利事業證號</Label>
                    <Input {...register('businessRegistrationNo')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="factoryRegistrationNo">工廠登記證號</Label>
                    <Input {...register('factoryRegistrationNo')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="licenseExpiryDate">執照效期</Label>
                    <Controller
                        control={control}
                        name="licenseExpiryDate"
                        render={({ field }) => (
                            <RocDateInput
                                value={field.value as string}
                                onChange={field.onChange}
                                ref={field.ref}
                            />
                        )}
                    />
                </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
                ※ 行業別認定請至「工業局認定函」管理頁面設定
            </p>
        </div>
    );
}
