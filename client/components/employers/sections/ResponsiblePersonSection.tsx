
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Languages } from 'lucide-react';
import type { EmployerFormData } from '../EmployerFormSchema';
import { toPinyin } from '@/utils/translationUtils';

export default function ResponsiblePersonSection() {
    const { register, setValue, watch, formState: { errors } } = useFormContext<EmployerFormData>();
    const formData = watch();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                負責人詳細資料
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label className="required">姓名 (Chinese Name)</Label>
                    <Input {...register('responsiblePerson')} />
                </div>
                <div className="space-y-2">
                    <Label>英文姓名 (English Name)</Label>
                    <div className="flex gap-2">
                        <Input {...register('englishName')} placeholder="同護照" />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                const chinese = watch('responsiblePerson');
                                if (chinese) {
                                    setValue('englishName', toPinyin(chinese));
                                }
                            }}
                        >
                            <Languages className="h-4 w-4 mr-1" /> 翻譯
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>外籍人士 (Foreigner)</Label>
                    <Select value={formData.industryAttributes?.isForeigner || 'N'} onValueChange={(v) => setValue('industryAttributes.isForeigner', v)}>
                        <SelectTrigger><SelectValue placeholder="否/是" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="N">否 (No)</SelectItem>
                            <SelectItem value="Y">是 (Yes)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="required">身分證字號 (ID No.)</Label>
                    <Input {...register('responsiblePersonIdNo')} className="font-mono" />
                </div>

                <div className="space-y-2">
                    <Label>出生日期 (DOB)</Label>
                    <Input type="date" {...register('responsiblePersonDob')} />
                </div>
                <div className="space-y-2">
                    <Label>出生地 (Birth Place)</Label>
                    <Input {...register('birthPlace')} />
                </div>
                <div className="space-y-2">
                    <Label>出生地英文</Label>
                    <div className="flex gap-2">
                        <Input {...register('birthPlaceEn')} />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                const chinese = watch('birthPlace');
                                if (chinese) {
                                    setValue('birthPlaceEn', toPinyin(chinese));
                                }
                            }}
                        >
                            <Languages className="h-4 w-4 mr-1" /> 翻譯
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>發照日期</Label>
                    <Input type="date" {...register('idIssueDate')} />
                </div>
                <div className="space-y-2">
                    <Label>發照地點</Label>
                    <Input {...register('idIssuePlace')} placeholder="ex: 北市" />
                </div>
                <div className="space-y-2">
                    <Label>發照類別</Label>
                    <Select onValueChange={(v) => setValue('idIssueType', v)} defaultValue={watch('idIssueType')}>
                        <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="初發">初發</SelectItem>
                            <SelectItem value="補發">補發</SelectItem>
                            <SelectItem value="換發">換發</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>役別</Label>
                    <Input {...register('militaryStatus')} />
                </div>

                <div className="space-y-2">
                    <Label>父親姓名</Label>
                    <Input {...register('responsiblePersonFather')} />
                </div>
                <div className="space-y-2">
                    <Label>母親姓名</Label>
                    <Input {...register('responsiblePersonMother')} />
                </div>
                <div className="space-y-2">
                    <Label>配偶姓名</Label>
                    <Input {...register('responsiblePersonSpouse')} />
                </div>
                <div className="space-y-2">
                    <Label>負責人行動電話</Label>
                    <Input {...register('mobilePhone')} placeholder="09xx-xxx-xxx" />
                </div>


                <div className="md:col-span-3 space-y-2">
                    <Label>戶籍地址 (Residence Address)</Label>
                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-2">
                            <Input {...register('residenceZip')} placeholder="郵遞區號" />
                        </div>
                        <div className="col-span-10">
                            <Input {...register('residenceAddress')} placeholder="完整戶籍地址" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
