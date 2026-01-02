import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Languages } from 'lucide-react';
import type { EmployerFormData } from '../EmployerFormSchema';
import { toCompanyEnglish, toPinyin } from '@/utils/translationUtils';
import AddressInput from '@/components/common/AddressInput';

/**
 * BasicInfoSection - 雇主基本資料區塊
 * 
 * 包含：雇主識別、公司資訊、負責人資訊、公司地址
 */
export default function BasicInfoSection() {
    const { register, setValue, watch, formState: { errors } } = useFormContext<EmployerFormData>();

    // 根據統編長度自動判斷是事業(8碼)還是個人(10碼)
    const taxIdValue = watch('taxId') || '';
    const isIndividual = taxIdValue.length === 10 && /^[A-Z][12]\d{8}$/i.test(taxIdValue);

    return (
        <div className="space-y-8">
            {/* ==================== 區塊一：雇主識別 ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">雇主識別</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="code">雇主編號</Label>
                        <Input {...register('code')} placeholder="系統自動產生或手動輸入" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="taxId" className="required">統一編號 / 身分證字號</Label>
                        <Input
                            {...register('taxId')}
                            placeholder="8碼統編 或 10碼身分證"
                            className="font-mono"
                        />
                        {errors.taxId && <p className="text-red-500 text-xs">{errors.taxId.message}</p>}
                        {taxIdValue && (
                            <p className="text-xs text-gray-500">
                                {isIndividual ? '📋 判定為：個人/自然人' : taxIdValue.length === 8 ? '🏢 判定為：事業單位' : ''}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unitTaxId">單位稅籍編號</Label>
                        <Input {...register('unitTaxId')} placeholder="單位稅籍編號" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="houseTaxId">房屋稅籍編號</Label>
                        <Input {...register('houseTaxId')} placeholder="房屋稅籍編號" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="shortName">雇主簡稱</Label>
                        <Input {...register('shortName')} placeholder="列表顯示用" />
                    </div>
                </div>
            </div>

            {/* ==================== 區塊二：公司/雇主資訊 ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                    {isIndividual ? '雇主資訊' : '公司資訊'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="companyName" className="required">
                            {isIndividual ? '雇主姓名 / 農場名稱' : '公司名稱'} (中文)
                        </Label>
                        <Input {...register('companyName')} placeholder={isIndividual ? "例: 陳小明" : "公司全名"} />
                        {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="companyNameEn">
                            {isIndividual ? '雇主姓名 / 農場名稱' : '公司名稱'} (英文)
                        </Label>
                        <div className="flex gap-2">
                            <Input {...register('companyNameEn')} placeholder="English Name" className="flex-1" />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const chinese = watch('companyName');
                                    if (chinese) {
                                        const translated = isIndividual ? toPinyin(chinese) : toCompanyEnglish(chinese);
                                        setValue('companyNameEn', translated);
                                    }
                                }}
                            >
                                <Languages className="h-4 w-4 mr-1" /> 翻譯
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Switch
                            id="isForeignOwner"
                            checked={watch('isForeignOwner') || false}
                            onCheckedChange={(checked) => setValue('isForeignOwner', checked)}
                        />
                        <Label htmlFor="isForeignOwner">負責人為外國人</Label>
                    </div>
                </div>
            </div>

            {/* ==================== 區塊三：負責人資訊 ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">負責人資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                        <Label htmlFor="responsiblePerson" className={!isIndividual ? "required" : ""}>
                            負責人姓名 (中文)
                        </Label>
                        <Input {...register('responsiblePerson')} placeholder="負責人姓名" />
                        {errors.responsiblePerson && <p className="text-red-500 text-xs">{errors.responsiblePerson.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="englishName">負責人姓名 (英文)</Label>
                        <div className="flex gap-2">
                            <Input {...register('englishName')} placeholder="English Name" className="flex-1" />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const chinese = watch('responsiblePerson');
                                    if (chinese) {
                                        setValue('englishName', toPinyin(chinese));
                                    }
                                }}
                            >
                                翻譯
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="responsiblePersonIdNo">負責人身分證字號</Label>
                        <Input
                            {...register('responsiblePersonIdNo')}
                            placeholder="A123456789"
                            className="font-mono"
                        />
                        {errors.responsiblePersonIdNo && <p className="text-red-500 text-xs">{errors.responsiblePersonIdNo.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="responsiblePersonDob">負責人出生日期</Label>
                        <Input {...register('responsiblePersonDob')} type="date" />
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">負責人戶籍地址</h4>
                    <AddressInput
                        zipField="residenceZip"
                        cityField="residenceCity"
                        districtField="residenceDistrict"
                        detailField="residenceDetailAddress"
                        fullAddressField="residenceAddress"
                        englishAddressField="residenceAddressEn"
                        labelPrefix=""
                    />
                </div>
            </div>

            {/* ==================== 區塊四：公司地址 ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">公司地址</h3>
                <AddressInput
                    zipField="companyZip"
                    cityField="companyCity"
                    districtField="companyDistrict"
                    detailField="companyDetailAddress"
                    fullAddressField="address"
                    englishAddressField="addressEn"
                    labelPrefix="" // "公司" is implied by section title
                />
            </div>
        </div>
    );
}
