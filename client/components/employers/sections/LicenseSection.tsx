
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Building } from 'lucide-react';
import type { EmployerFormData } from '../EmployerFormSchema';

export default function LicenseSection() {
    const { register, watch, setValue } = useFormContext<EmployerFormData>();
    const selectedCategoryType = watch('categoryType');
    const selectedCategory = watch('category');

    // Show only for Business/Institution
    if (selectedCategoryType === 'INDIVIDUAL') return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                公司證照與保險 (Corporate Licenses)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Manufacturing / Business */}
                <div className="space-y-2">
                    <Label>工廠登記證號</Label>
                    <Input {...register('factoryRegistrationNo')} />
                </div>
                <div className="space-y-2">
                    <Label>行業別代碼 (Industry Code)</Label>
                    <Input {...register('industryCode')} />
                </div>
                <div className="space-y-2">
                    <Label>行業別名稱</Label>
                    <Input {...register('industryType')} />
                </div>

                <div className="space-y-2">
                    <Label>勞保證號 (Labor Ins. No)</Label>
                    <Input {...register('laborInsuranceNo')} />
                </div>
                <div className="space-y-2">
                    <Label>勞保單位名稱</Label>
                    <Input {...register('laborInsuranceId')} />
                </div>

                <div className="space-y-2">
                    <Label>健保投保單位代號</Label>
                    <Input {...register('healthInsuranceUnitNo')} />
                </div>
                <div className="space-y-2">
                    <Label>健保單位名稱</Label>
                    <Input {...register('healthInsuranceId')} />
                </div>

                {/* Institution Specific */}
                {(selectedCategory === 'INSTITUTION' || selectedCategory === 'NURSING_HOME') && (
                    <>
                        <div className="space-y-2">
                            <Label className="required">機構代碼</Label>
                            <Input {...register('institutionCode')} />
                        </div>
                        <div className="space-y-2">
                            <Label className="required">許可床位數</Label>
                            <Input type="number" {...register('bedCount')} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
