'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormSection from '@/components/layout/FormSection';
import { Save, User, FileText, Briefcase, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

// Validation Schema
const workerSchema = z.object({
    // Basic Info
    englishName: z.string().min(1, '請輸入英文姓名'),
    chineseName: z.string().optional(),
    nationality: z.string().min(1, '請選擇國籍'),
    dob: z.string().min(1, '請選擇出生日期'),
    gender: z.string().optional(),
    mobilePhone: z.string().optional(),
    foreignAddress: z.string().optional(),
    taiwanAddress: z.string().optional(),

    // Passport Info
    passportNo: z.string().optional(),
    passportIssueDate: z.string().optional(),
    passportExpiryDate: z.string().optional(),

    // Deployment Info (optional for new workers)
    employerId: z.string().optional(),
    deploymentDate: z.string().optional(),
    contractEndDate: z.string().optional(),

    // Additional
    notes: z.string().optional(),
});

type WorkerFormData = z.infer<typeof workerSchema>;

interface WorkerFormProps {
    /**
     * Initial data for edit mode
     */
    initialData?: Partial<WorkerFormData>;

    /**
     * Submit handler
     */
    onSubmit: (data: WorkerFormData) => Promise<void>;

    /**
     * Loading state
     */
    isLoading?: boolean;

    /**
     * Cancel handler
     */
    onCancel?: () => void;
}

/**
 * Unified Worker Form with Tabs layout
 * Used for both Create and Edit modes
 * Optimized for landscape screens
 */
export default function WorkerForm({
    initialData,
    onSubmit,
    isLoading = false,
    onCancel
}: WorkerFormProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const isEditMode = !!initialData;

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<WorkerFormData>({
        resolver: zodResolver(workerSchema),
        defaultValues: initialData || {
            nationality: 'Indonesia',
            gender: 'Male'
        }
    });

    const onSubmitForm = async (data: WorkerFormData) => {
        try {
            await onSubmit(data);
            toast.success(isEditMode ? '更新成功' : '建立成功');
        } catch (error: any) {
            toast.error(error.message || '操作失敗');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tab Navigation */}
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        基本資料
                    </TabsTrigger>
                    <TabsTrigger value="passport" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        護照資訊
                    </TabsTrigger>
                    <TabsTrigger value="deployment" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        派遣資訊
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        文件管理
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Basic Info */}
                <TabsContent value="basic" className="space-y-6">
                    <FormSection
                        title="個人基本資料"
                        description="外勞的基本身分資訊"
                        columns={3}
                    >
                        <div>
                            <Label htmlFor="englishName" className="required">英文姓名</Label>
                            <Input
                                id="englishName"
                                {...register('englishName')}
                                placeholder="JOHN DOE"
                            />
                            {errors.englishName && (
                                <p className="text-sm text-red-600 mt-1">{errors.englishName.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="chineseName">中文姓名</Label>
                            <Input
                                id="chineseName"
                                {...register('chineseName')}
                                placeholder="約翰"
                            />
                        </div>

                        <div>
                            <Label htmlFor="gender">性別</Label>
                            <Select
                                onValueChange={(value) => setValue('gender', value)}
                                defaultValue={watch('gender')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">男性</SelectItem>
                                    <SelectItem value="Female">女性</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="nationality" className="required">國籍</Label>
                            <Select
                                onValueChange={(value) => setValue('nationality', value)}
                                defaultValue={watch('nationality')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Indonesia">印尼 (Indonesia)</SelectItem>
                                    <SelectItem value="Vietnam">越南 (Vietnam)</SelectItem>
                                    <SelectItem value="Philippines">菲律賓 (Philippines)</SelectItem>
                                    <SelectItem value="Thailand">泰國 (Thailand)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.nationality && (
                                <p className="text-sm text-red-600 mt-1">{errors.nationality.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="dob" className="required">出生日期</Label>
                            <Input
                                id="dob"
                                type="date"
                                {...register('dob')}
                            />
                            {errors.dob && (
                                <p className="text-sm text-red-600 mt-1">{errors.dob.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="mobilePhone">手機號碼</Label>
                            <Input
                                id="mobilePhone"
                                type="tel"
                                {...register('mobilePhone')}
                                placeholder="+62 812 3456 7890"
                            />
                        </div>
                    </FormSection>

                    <FormSection
                        title="聯絡地址"
                        columns={2}
                        divider={false}
                    >
                        <div>
                            <Label htmlFor="foreignAddress">國外地址</Label>
                            <Input
                                id="foreignAddress"
                                {...register('foreignAddress')}
                                placeholder="Jl. Merdeka No. 123, Jakarta"
                            />
                        </div>

                        <div>
                            <Label htmlFor="taiwanAddress">台灣地址</Label>
                            <Input
                                id="taiwanAddress"
                                {...register('taiwanAddress')}
                                placeholder="台北市信義區..."
                            />
                        </div>
                    </FormSection>
                </TabsContent>

                {/* Tab 2: Passport Info */}
                <TabsContent value="passport" className="space-y-6">
                    <FormSection
                        title="護照資訊"
                        description="外勞的護照與相關證件"
                        columns={4}
                        divider={false}
                    >
                        <div>
                            <Label htmlFor="passportNo">護照號碼</Label>
                            <Input
                                id="passportNo"
                                {...register('passportNo')}
                                placeholder="A12345678"
                            />
                        </div>

                        <div>
                            <Label htmlFor="passportIssueDate">發照日期</Label>
                            <Input
                                id="passportIssueDate"
                                type="date"
                                {...register('passportIssueDate')}
                            />
                        </div>

                        <div>
                            <Label htmlFor="passportExpiryDate">到期日期</Label>
                            <Input
                                id="passportExpiryDate"
                                type="date"
                                {...register('passportExpiryDate')}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button type="button" variant="outline" className="w-full">
                                上傳護照掃描檔
                            </Button>
                        </div>
                    </FormSection>
                </TabsContent>

                {/* Tab 3: Deployment Info */}
                <TabsContent value="deployment" className="space-y-6">
                    <FormSection
                        title="派遣資訊"
                        description="外勞的雇主與派遣狀態"
                        columns={3}
                        divider={false}
                    >
                        <div>
                            <Label htmlFor="employerId">雇主</Label>
                            <Select
                                onValueChange={(value) => setValue('employerId', value)}
                                defaultValue={watch('employerId')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="選擇雇主" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="placeholder">-- 暫無雇主 --</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="deploymentDate">派遣日期</Label>
                            <Input
                                id="deploymentDate"
                                type="date"
                                {...register('deploymentDate')}
                            />
                        </div>

                        <div>
                            <Label htmlFor="contractEndDate">合約到期</Label>
                            <Input
                                id="contractEndDate"
                                type="date"
                                {...register('contractEndDate')}
                            />
                        </div>
                    </FormSection>
                </TabsContent>

                {/* Tab 4: Documents */}
                <TabsContent value="documents" className="space-y-6">
                    <div className="text-center py-12 text-gray-500">
                        <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>文件管理功能開發中</p>
                        <p className="text-sm mt-1">未來可在此上傳健康檢查、訓練證明等文件</p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        取消
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? '儲存修改' : '確認新增'}
                </Button>
            </div>
        </form>
    );
}
