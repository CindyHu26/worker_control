
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info as InfoIcon, User, Languages } from 'lucide-react';
import type { EmployerFormData } from '../EmployerFormSchema';
import { toPinyin } from '@/utils/translationUtils';

interface BasicInfoSectionProps {
    categories: any[];
    categoriesLoading: boolean;
    applicationTypes: any[];
    appTypesLoading: boolean;
}

export default function BasicInfoSection({
    categories,
    categoriesLoading,
    applicationTypes,
    appTypesLoading
}: BasicInfoSectionProps) {
    const { register, setValue, watch, formState: { errors } } = useFormContext<EmployerFormData>();

    // Watch fields for conditional rendering
    const selectedCategory = watch('category');
    const selectedCategoryType = watch('categoryType');
    const taxIdValue = watch('taxId'); // Used for validation feedback in UI if needed (though error msg handles it)

    // We need to re-implement the derived state for 'isIndividual' etc inside render or hooks
    const isIndividual = selectedCategoryType === 'INDIVIDUAL';

    // Logic for taxId duplicated check status is currently in parent. 
    // We can pass `taxIdStatus` as prop if we want to show it here.
    // For now, let's omit the custom async duplicate check UI feedback or add it later/pass as prop.
    // The original code had: {taxIdStatus.error && <p ...>}
    // Let's assume for now we just show standard form errors, or I need to add that prop.
    // I will add taxIdError as optional prop.

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category & Code */}
                <div className="space-y-2">
                    <Label className="required text-base font-semibold">雇主類型 (Employer Category)</Label>
                    <Select value={selectedCategory} onValueChange={(v) => setValue('category', v)}>
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
                    <Select value={watch('industryAttributes.applicationType') || '1'} onValueChange={(v) => setValue('industryAttributes.applicationType', v)}>
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
                                <Select value={watch('relationship') || ''} onValueChange={(v) => setValue('relationship', v)}>
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
    );
}
