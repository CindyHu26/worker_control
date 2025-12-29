import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EmployerFormData } from '../EmployerFormSchema';

/**
 * ContactSection - 聯絡資訊區塊
 * 
 * 包含：單位承辦人、電話、傳真、行動電話、E-mail
 * 以及第二聯絡人資訊
 */
export default function ContactSection() {
    const { register, formState: { errors } } = useFormContext<EmployerFormData>();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">聯絡資訊</h3>

            {/* 主要聯絡資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="contactPerson">單位承辦人</Label>
                    <Input {...register('contactPerson')} placeholder="公司內部聯絡人" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">電話 (TEL)</Label>
                    <Input {...register('phoneNumber')} placeholder="02-12345678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="faxNumber">傳真 (FAX)</Label>
                    <Input {...register('faxNumber')} placeholder="02-12345678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mobilePhone">行動電話</Label>
                    <Input {...register('mobilePhone')} placeholder="0912-345678" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input {...register('email')} type="email" placeholder="example@company.com" />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
            </div>

            {/* 分隔線 */}
            <hr className="my-4" />

            {/* 第二聯絡人 */}
            <h4 className="text-md font-medium text-gray-700 mb-3">第二聯絡人</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="contactPerson2">聯絡人姓名</Label>
                    <Input {...register('contactPerson2')} placeholder="聯絡人姓名" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactPhone2">電話</Label>
                    <Input {...register('contactPhone2')} placeholder="02-12345678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactMobile2">行動電話</Label>
                    <Input {...register('contactMobile2')} placeholder="0912-345678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactFax2">傳真</Label>
                    <Input {...register('contactFax2')} placeholder="02-12345678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactEmail2">E-mail</Label>
                    <Input {...register('contactEmail2')} type="email" placeholder="contact@company.com" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactBirthday">生日</Label>
                    <Input {...register('contactBirthday')} type="date" />
                </div>
            </div>
        </div>
    );
}
