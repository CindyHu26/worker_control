
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Calendar } from 'lucide-react';
import type { EmployerFormData } from '../EmployerFormSchema';

export default function InternalManagementSection() {
    const { register } = useFormContext<EmployerFormData>();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                內部管理與備註 (Internal Management)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>介紹人 (Referrer)</Label>
                    <Input {...register('referrer')} placeholder="介紹人姓名" />
                </div>
                <div className="space-y-2">
                    <Label>仲介公司 (Source Agency)</Label>
                    <Input {...register('agencyId')} placeholder="來源仲介" />
                </div>

                <div className="space-y-2">
                    <Label>終止服務日期</Label>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <Input type="date" {...register('terminateDate')} />
                    </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <Label>備註 (Remarks)</Label>
                    <Textarea {...register('remarks')} className="min-h-[100px]" placeholder="輸入其他備註事項..." />
                </div>
            </div>

            {/* Legacy / Advanced Attributes */}
            <details className="group">
                <summary className="cursor-pointer text-gray-500 text-sm hover:text-gray-700 font-medium py-2">
                    進階欄位 (Legacy / Industry Attributes)
                </summary>
                <div className="pt-4 px-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                        <div className="space-y-2">
                            <Label className="text-xs">行政人員</Label>
                            <Input {...register('industryAttributes.adminStaff')} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">業務人員</Label>
                            <Input {...register('industryAttributes.salesAgent')} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">客服人員</Label>
                            <Input {...register('industryAttributes.customerService')} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">會計人員</Label>
                            <Input {...register('industryAttributes.accountant')} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">專業人員</Label>
                            <Input {...register('industryAttributes.professionalStaff')} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">管理來源</Label>
                            <Input {...register('industryAttributes.managementSource')} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">舊系統 Ref 95</Label>
                            <Input {...register('industryAttributes.legacyRef95')} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">舊系統 Ref 96</Label>
                            <Input {...register('industryAttributes.legacyRef96')} className="h-8 text-sm" />
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
}
