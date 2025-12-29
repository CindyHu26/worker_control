
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Calendar, Users } from 'lucide-react';
import type { EmployerFormData } from '../EmployerFormSchema';
import { useEmployees } from '@/hooks/useEmployees';

/**
 * InternalManagementSection - 內部管理區塊
 */

// 來源別選項
const SOURCE_OPTIONS = [
    { value: 'BUSINESS_DEV', label: '業務開發' },
    { value: 'TELEMARKETING', label: '電訪件' },
    { value: 'PUBLIC_RELATIONS', label: '公關件' },
    { value: 'COMPANY', label: '公司件' },
];

export default function InternalManagementSection() {
    const { register, setValue, watch } = useFormContext<EmployerFormData>();
    const { salesAgents, serviceStaff, adminStaff, accountants, isLoading } = useEmployees();

    return (
        <div className="space-y-6">
            {/* 內部人員指派 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 border-b pb-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    內部人員指派
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="salesAgentId">業務員</Label>
                        <Select
                            value={watch('salesAgentId') || ''}
                            onValueChange={(v) => setValue('salesAgentId', v)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="選擇業務員" />
                            </SelectTrigger>
                            <SelectContent>
                                {salesAgents.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* 專業人員 (暫保留或移除若無數據源? User 只提了四種: 業務, 服務, 行政, 會計) */}
                    {/* User request: "Service Staff" instead of CustomerService, and specifically listed 4 types. */}
                    {/* I will keep Professional Staff if in schema, but User request implies mainly these 4 are important */}

                    <div className="space-y-2">
                        <Label htmlFor="customerServiceId">服務人員</Label>
                        <Select
                            value={watch('customerServiceId') || ''}
                            onValueChange={(v) => setValue('customerServiceId', v)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="選擇服務人員" />
                            </SelectTrigger>
                            <SelectContent>
                                {serviceStaff.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="adminStaffId">行政人員</Label>
                        <Select
                            value={watch('adminStaffId') || ''}
                            onValueChange={(v) => setValue('adminStaffId', v)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="選擇行政人員" />
                            </SelectTrigger>
                            <SelectContent>
                                {adminStaff.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountantId">會計人員</Label>
                        <Select
                            value={watch('accountantId') || ''}
                            onValueChange={(v) => setValue('accountantId', v)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="選擇會計人員" />
                            </SelectTrigger>
                            <SelectContent>
                                {accountants.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 專業人員 - Keep it but maybe separate or below if not in the main 4 list requested */}
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="professionalStaffId">移工專業人員 (選填)</Label>
                        <Input {...register('professionalStaffId')} placeholder="手動輸入或後續關聯" />
                    </div>
                </div>
            </div>

            {/* 來源與管理資訊 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4 border-b pb-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    來源與管理資訊
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="referrer">介紹人</Label>
                        <Input {...register('referrer')} placeholder="介紹人姓名" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="managementSource">來源別</Label>
                        <Select
                            value={watch('managementSource') || ''}
                            onValueChange={(v) => setValue('managementSource', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="選擇來源別" />
                            </SelectTrigger>
                            <SelectContent>
                                {SOURCE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="developmentDate">開發日期</Label>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <Input type="date" {...register('developmentDate')} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="agencyId">國內仲介公司</Label>
                        {/* TODO: Integrate with DomesticAgency API if available, currently using Input as placeholder or maybe I missed it */}
                        <Input {...register('agencyId')} placeholder="輸入仲介公司名稱" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="terminateDate">終止委任日期</Label>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <Input type="date" {...register('terminateDate')} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-2">
                    <Label htmlFor="remarks">附註</Label>
                    <Textarea
                        {...register('remarks')}
                        className="min-h-[120px]"
                        placeholder="輸入其他備註事項..."
                    />
                </div>
            </div>
        </div>
    );
}
