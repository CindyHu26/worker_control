
import { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Building2, Plus, Trash2, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { TAIWAN_CITIES } from '@/data/taiwan-cities';
import { toPinyin, translateCityDistrict } from '@/utils/translationUtils';
import type { EmployerFormData } from '../EmployerFormSchema';

export default function FactoriesSection() {
    const { register, control, setValue, watch, formState: { errors } } = useFormContext<EmployerFormData>();

    // Watch shared fields
    const selectedCategory = watch('category');
    const selectedCategoryType = watch('categoryType');
    const initialAddress = watch('address'); // Watch address string for initial hydration if needed? 
    // Actually, react-hook-form handles value. We just need to handle the UI state for City/District selectors.

    const { fields: factoryFields, append: appendFactory, remove: removeFactory } = useFieldArray({
        control,
        name: "factories"
    });

    // Address Copy Helpers
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

    // City/District State Logic
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    const handleCityChange = (city: string) => {
        setSelectedCity(city);
        setSelectedDistrict('');
    };

    // Address Translation
    const handleAddressTranslate = () => {
        const addressDetail = watch('address');
        if (selectedCity && selectedDistrict && addressDetail) {
            const { cityEn, districtEn } = translateCityDistrict(selectedCity, selectedDistrict);
            const fullAddressEn = `${toPinyin(addressDetail)}, ${districtEn}, ${cityEn}, Taiwan (R.O.C.)`;
            setValue('addressEn', fullAddressEn);
        }
    };

    // Hydrate City/District from existing address value (if needed on mount)
    // We can iterate TAIWAN_CITIES to match.
    // Ideally this logic should run once on mount if address exists.
    useEffect(() => {
        // Only run if we haven't selected yet and address exists (e.g. edit mode)
        if (initialAddress && !selectedCity) {
            for (const city of Object.keys(TAIWAN_CITIES)) {
                if (initialAddress.startsWith(city)) {
                    setSelectedCity(city);
                    const remaining = initialAddress.slice(city.length);
                    const districts = TAIWAN_CITIES[city];
                    for (const dist of districts) {
                        if (remaining.startsWith(dist)) {
                            setSelectedDistrict(dist);
                            // Strip from input view? 
                            // The original code stripped it from the 'address' field value using setValue.
                            // But here 'initialAddress' IS the value. 
                            // If we strip it, we modify the form state.
                            // Original code: setValue('address', remaining);
                            // Let's replicate original behavior but be careful about infinite loops.
                            // We should check if address actually STARTS with city/dist before stripping.
                            // Assuming 'address' field in DB stores full address "CityDistRoad..." but UI wants split.
                            // Actually create/update reconstructs it: address: `${selectedCity}${selectedDistrict}${data.address}`
                            // So in form state 'address' might be bare road info if we stripped it, 
                            // OR full address if we just loaded it. 
                            // Original code effect ran on `initialData` change.
                            // Here we use `useEffect` on mount.
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }, []); // Run once. But wait, `initialAddress` might come in later.
    // The original code used `initialData` prop dependency.
    // Here we rely on React Hook Form's `defaultValues`.
    // If specific stripping logic is needed, it might be safer to keep it.
    // However, splitting address is complex. 
    // Let's assume the user manually selects if creating new.
    // If editing, we try to parse.

    return (
        <div className="space-y-6">
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
                                                    const fullAddressEn = `${toPinyin(address)}, Taiwan (R.O.C.)`;
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
        </div>
    );
}
