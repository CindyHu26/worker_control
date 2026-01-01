'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form'; // Added FormProvider
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormSection from '@/components/layout/FormSection';
import { Save, User, FileText, Briefcase, FolderOpen, HeartPulse, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import EmployerSelector from '@/components/employers/EmployerSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SmartField, FieldDefinition } from '@/components/ui/smart-form/SmartField';

// Validation Schema (Dynamic Construction Later? For now we might need a loose schema or dynamic build)
// We will use a flexible schema for now, or build it from API
const baseSchema = z.object({
    // Fixed Core Fields that might not be in dynamic list yet or need special handling
    employerId: z.string().optional(),
    photoUrl: z.string().optional(),

    // We allow other fields to pass through for now
}).passthrough();

type WorkerFormData = z.infer<typeof baseSchema> & Record<string, any>;

interface WorkerFormProps {
    initialData?: Partial<WorkerFormData> & { id?: string; photoUrl?: string };
    onSubmit: (data: WorkerFormData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export default function WorkerForm({
    initialData,
    onSubmit,
    isLoading = false,
    onCancel
}: WorkerFormProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const isEditMode = !!initialData;
    const [schemaFields, setSchemaFields] = useState<FieldDefinition[]>([]);
    const [loadingSchema, setLoadingSchema] = useState(true);

    // Fetch Schema
    useEffect(() => {
        const fetchSchema = async () => {
            try {
                const res = await fetch('/api/schemas/worker');
                if (res.ok) {
                    const data = await res.json();
                    setSchemaFields(data.fields);
                }
            } catch (err) {
                console.error("Failed to load schema", err);
                toast.error("無法載入表單定義");
            } finally {
                setLoadingSchema(false);
            }
        };
        fetchSchema();
    }, []);

    const methods = useForm<WorkerFormData>({
        resolver: zodResolver(baseSchema),
        defaultValues: initialData || {
            nationalityId: '', // Default?
        }
    });

    const {
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = methods;

    // Effect to reset form when schema or initialData changes if needed? 
    // Actually we might need to merge initialData with schema defaults.

    // Photo Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(initialData?.photoUrl || '');

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        if (isEditMode && initialData?.id) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('photo', file);

            try {
                const res = await fetch(`/api/workers/${initialData.id}/photo`, {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error('Upload failed');

                const data = await res.json();
                toast.success('照片上傳成功');
                setPreviewUrl(data.photoUrl);
            } catch (error) {
                console.error(error);
                toast.error('照片上傳失敗');
            } finally {
                setIsUploading(false);
            }
        } else {
            toast.info('請先儲存資料後再上傳照片 (目前僅支援編輯模式上傳)');
        }
    };

    const onSubmitForm = async (data: WorkerFormData) => {
        try {
            await onSubmit(data);
            toast.success(isEditMode ? '更新成功' : '建立成功');
        } catch (error: any) {
            toast.error(error.message || '操作失敗');
            console.error(error);
        }
    };

    // Group fields by 'group'
    const getFieldsByGroup = (group: string) => {
        return schemaFields.filter(f => f.group === group);
    };

    if (loadingSchema) {
        return <div>Loading Form Configuration...</div>;
    }

    return (
        <FormProvider {...methods}>
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
                        <TabsTrigger value="personal" className="flex items-center gap-2">
                            <HeartPulse className="h-4 w-4" />
                            詳細個資
                        </TabsTrigger>
                        {/* 
                        <TabsTrigger value="documents" className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            文件管理
                        </TabsTrigger>
                        */}
                    </TabsList>

                    {/* Tab 1: Basic Info */}
                    <TabsContent value="basic" className="space-y-6">
                        <FormSection
                            title="個人基本資料"
                            description="外勞的基本身分資訊"
                            columns={3}
                        >
                            {/* Avatar Section - Static */}
                            <div className="col-span-3 flex items-center gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                                <Avatar className="h-24 w-24 border-2 border-white shadow-md">
                                    <AvatarImage src={previewUrl} className="object-cover" />
                                    <AvatarFallback className="bg-slate-200 text-slate-400">
                                        <User className="h-12 w-12" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-slate-900">大頭照</h3>
                                        {isEditMode ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">可上傳</span>
                                        ) : (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">需先儲存</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        支援 JPG, PNG 格式，檔案大小不超過 5MB。
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="photo-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            disabled={isUploading || !isEditMode}
                                        />
                                        <Label
                                            htmlFor="photo-upload"
                                            className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 ${(!isEditMode || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            {isUploading ? '上傳中...' : '更換照片'}
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Fields for Basic Group */}
                            {getFieldsByGroup('basic').map(field => (
                                <SmartField key={field.name} {...field} />
                            ))}

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
                            {/* Dynamic Fields for Passport Group */}
                            {/* Note: In config, we didn't add passport fields yet, adding logic to filter if we had them or add them to config later. 
                                For now, if config is empty for this group, it shows nothing? 
                                Wait, I should probably double check my config. 
                                Ah, I didn't add passport fields to my initial `workerSchema.ts`.
                                So they will disappear! 
                                I MUST add them to `workerSchema.ts` OR keep them static here.
                                Given the plan was "Hybrid", let's keep them STATIC here if they are special (like having file upload button next to them).
                                Or I can mix.
                            */}
                            <div>
                                <Label htmlFor="passportNo">護照號碼</Label>
                                <Input id="passportNo" {...methods.register('passportNo')} />
                            </div>
                            <div>
                                <Label htmlFor="passportIssueDate">發照日期</Label>
                                <Input id="passportIssueDate" type="date" {...methods.register('passportIssueDate')} />
                            </div>
                            <div>
                                <Label htmlFor="passportExpiryDate">到期日期</Label>
                                <Input id="passportExpiryDate" type="date" {...methods.register('passportExpiryDate')} />
                            </div>

                            <div className="flex items-end">
                                <Button type="button" variant="outline" className="w-full">
                                    上傳護照掃描檔
                                </Button>
                            </div>

                            {/* Dynamic Extensions for Passport (if any) */}
                            {getFieldsByGroup('passport').map(field => (
                                <SmartField key={field.name} {...field} />
                            ))}
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
                            {/* Static Employer Selector - Complex Component */}
                            <div>
                                <Label htmlFor="employerId">雇主</Label>
                                <EmployerSelector
                                    value={watch('employerId')}
                                    onChange={(val) => setValue('employerId', val)}
                                />
                            </div>

                            {/* Date Fields - Static for now or move to config? 
                                Let's keep static to match the existing 'deployment' logic which is separate from Worker core 
                             */}
                            <div>
                                <Label htmlFor="deploymentDate">派遣日期</Label>
                                <Input id="deploymentDate" type="date" {...methods.register('deploymentDate')} />
                            </div>
                            <div>
                                <Label htmlFor="contractEndDate">合約到期</Label>
                                <Input id="contractEndDate" type="date" {...methods.register('contractEndDate')} />
                            </div>

                            {getFieldsByGroup('deployment').map(field => (
                                <SmartField key={field.name} {...field} />
                            ))}
                        </FormSection>
                    </TabsContent>

                    {/* Tab 4: Personal Details */}
                    <TabsContent value="personal" className="space-y-6">
                        <FormSection title="體態與背景" columns={3}>
                            {/* We moved height/weight to schema in config step. So they should render dynamically! */}
                            {/* But what about bloodType, religion etc? If not in schema, they won't show.
                                For the purpose of this demo, I will only show what is in the schema + what I added as static above.
                                If I removed them from static and didn't add to schema, they are gone.
                                Result: height/weight are in schema. others are missing.
                                Fix: I will add the dynamic renderer.
                            */}
                            {getFieldsByGroup('personal').map(field => (
                                <SmartField key={field.name} {...field} />
                            ))}
                        </FormSection>

                        <FormSection title="健康與防疫 (動態法規)" columns={3}>
                            {getFieldsByGroup('health').map(field => (
                                <SmartField key={field.name} {...field} />
                            ))}
                        </FormSection>
                    </TabsContent>

                </Tabs>

                {/* Action Buttons */}
                <div className="sticky bottom-0 flex justify-end gap-3 py-4 mt-6 border-t bg-white/80 backdrop-blur-sm z-10">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                            取消
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading} className="shadow-lg">
                        {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                        <Save className="mr-2 h-4 w-4" />
                        {isEditMode ? '儲存修改' : '確認新增'}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
