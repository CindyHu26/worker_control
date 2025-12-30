
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Plus, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { EmployerFormData } from '../EmployerFormSchema';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FACTORY_RANKING_OPTIONS } from '@/lib/applicationConstants';
import AddressInput from './AddressInput';

export default function FactoriesSection() {
    const { register, control, setValue, watch, formState: { errors } } = useFormContext<EmployerFormData>();

    // Watch main address to copy
    const mainAddress = watch('address');

    const { fields: factoryFields, append: appendFactory, remove: removeFactory } = useFieldArray({
        control,
        name: "factories"
    });

    // Address Copy Helpers - Copy from Main Company Address
    const copyAddressToBilling = (checked: boolean) => {
        if (checked && mainAddress) {
            setValue('invoiceAddress', mainAddress, { shouldValidate: true });
            toast.success('已複製發票地址');
        }
    };

    const copyAddressToTax = (checked: boolean) => {
        if (checked && mainAddress) {
            setValue('taxAddress', mainAddress, { shouldValidate: true });
            toast.success('已複製稅籍地址');
        }
    };

    const copyAddressToHealth = (checked: boolean) => {
        if (checked && mainAddress) {
            setValue('healthBillAddress', mainAddress, { shouldValidate: true });
            toast.success('已複製健保帳單地址');
        }
    };

    return (
        <div className="space-y-6">
            {/* Company Address for Billing - Using simple inputs as these are often just text for billing */}
            {/* The user didn't strictly ask for granular billing addresses, but consistency is good. 
                However, for billing, usually a full string is fine. I'll keep them as simple inputs to avoid clutter
                unless requested. The Company Registration Address is the main one handled in BasicInfoSection.
            */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    帳務地址設定
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>發票地址 (Invoice Address)</Label>
                        <div className="flex items-center gap-2 mb-1">
                            <Checkbox id="copyInvoice" onCheckedChange={copyAddressToBilling} />
                            <label htmlFor="copyInvoice" className="text-xs text-gray-500">同公司登記地址</label>
                        </div>
                        <Input {...register('invoiceAddress')} placeholder="完整地址" />
                    </div>
                    <div className="space-y-2">
                        <Label>稅籍地址 (Tax Address)</Label>
                        <div className="flex items-center gap-2 mb-1">
                            <Checkbox id="copyTax" onCheckedChange={copyAddressToTax} />
                            <label htmlFor="copyTax" className="text-xs text-gray-500">同公司登記地址</label>
                        </div>
                        <Input {...register('taxAddress')} placeholder="完整地址" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="md:col-span-2 space-y-2">
                        <Label>健保帳單地址</Label>
                        <div className="flex items-center gap-2 mb-1">
                            <Checkbox id="copyHealth" onCheckedChange={copyAddressToHealth} />
                            <label htmlFor="copyHealth" className="text-xs text-gray-500">同公司登記地址</label>
                        </div>
                        <Input {...register('healthBillAddress')} placeholder="完整地址" />
                    </div>
                    <div className="space-y-2">
                        <Label>郵遞區號</Label>
                        <Input {...register('healthBillZip')} placeholder="Zip" />
                    </div>
                </div>
            </div>

            {/* Factories List */}
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                                <Label className="required">廠別名稱</Label>
                                <Input {...register(`factories.${index}.name`)} placeholder="ex: 一廠" />
                            </div>
                            <div className="space-y-2">
                                <Label>工廠登記證號</Label>
                                <Input {...register(`factories.${index}.factoryRegNo`)} />
                            </div>
                            <div className="space-y-2">
                                <Label>統一編號 (Tax ID)</Label>
                                <Input {...register(`factories.${index}.taxId`)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2">
                                <Label>勞保證號</Label>
                                <Input {...register(`factories.${index}.laborInsuranceNo`)} />
                            </div>
                            <div className="space-y-2">
                                <Label>健保證號</Label>
                                <Input {...register(`factories.${index}.healthInsuranceNo`)} />
                            </div>
                            <div className="space-y-2">
                                <Label>五級制 (Ranking)</Label>
                                <Controller
                                    control={control}
                                    name={`factories.${index}.ranking`}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="選擇級別" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FACTORY_RANKING_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <Label className="mb-2 block">廠區地址</Label>
                            <AddressInput
                                zipField={`factories.${index}.zipCode`}
                                cityField={`factories.${index}.city`}
                                districtField={`factories.${index}.district`}
                                detailField={`factories.${index}.detailAddress`}
                                fullAddressField={`factories.${index}.address`}
                                englishAddressField={`factories.${index}.addressEn`}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
    );
}
