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
import { Save, User, FileText, Briefcase, FolderOpen, HeartPulse, Upload, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import EmployerSelector from '@/components/employers/EmployerSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SmartField, FieldDefinition } from '@/components/ui/smart-form/SmartField';
import { apiGet } from '@/lib/api';

// Validation Schema
const baseSchema = z.object({
    employerId: z.string().min(1, "請先選擇雇主"),
    jobOrderId: z.string().min(1, "請選擇招募函 (Job Order)"),
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

    // Job Order Logic
    const [jobOrders, setJobOrders] = useState<any[]>([]);
    const [fetchingJobOrders, setFetchingJobOrders] = useState(false);

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

    const watchedEmployerId = watch('employerId');
    const watchedJobOrderId = watch('jobOrderId');

    // Fetch Job Orders when Employer Changes
    useEffect(() => {
        if (!watchedEmployerId) {
            setJobOrders([]);
            return;
        }

        const fetchJobOrders = async () => {
            setFetchingJobOrders(true);
            try {
                const data = await apiGet(`/api/recruitment/job-orders?employerId=${watchedEmployerId}`);
                setJobOrders(data);

                // If editing and we have an initial jobOrderId that is NOT in the list (because full), 
                // we might need to handle it? For "Create", the list is pure available.
                // For now, simpler is better.
            } catch (error) {
                console.error("Failed to fetch job orders", error);
                toast.error("載入招募函失敗");
            } finally {
                setFetchingJobOrders(false);
            }
        };

        fetchJobOrders();
    }, [watchedEmployerId]);

    // Derived State
    const selectedJobOrder = jobOrders.find(j => j.id === watchedJobOrderId);
    const noJobOrders = watchedEmployerId && !fetchingJobOrders && jobOrders.length === 0;

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
                {/* Global Error Banner */}
                {noJobOrders && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <h3 className="font-bold text-red-700">無法建立移工資料 (Validation Error)</h3>
                                <p className="text-sm text-red-600 mt-1">
                                    此雇主無可用招募函 (No valid recruitment letter found)。<br />
                                    請先至 <b>招募管理 (Recruitment)</b> 建立招募函。
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

                    <TabsContent value="passport" className="space-y-6">
                        <FormSection
                            title="護照資訊"
                            columns={4}
                            divider={false}
                        >
                            {/* Dynamic Extensions for Passport */}
                            {getFieldsByGroup('passport').map(field => (
                                <SmartField key={field.name} {...field} />
                            ))}
                        </FormSection>
                    </TabsContent>

                    <TabsContent value="deployment" className="space-y-6">
                        <FormSection
                            title="派遣與招募 (Job Linkage)"
                            description="連結招募函與派遣資訊"
                            columns={2} // Changed from 3 to 2 for better fit
                            divider={false}
                        >
                            {/* 1. Employer */}
                            <div className="col-span-1">
                                <Label htmlFor="employerId">雇主 (Employer)</Label>
                                <EmployerSelector
                                    value={watch('employerId')}
                                    onChange={(val) => {
                                        setValue('employerId', val);
                                        setValue('jobOrderId', ''); // Reset job order
                                    }}
                                />
                                {errors.employerId && <p className="text-xs text-red-500 mt-1">{errors.employerId.message as string}</p>}
                            </div>

                            {/* 2. Job Order Select */}
                            <div className="col-span-1 space-y-2">
                                <Label className={noJobOrders ? "text-red-500" : ""}>
                                    招募函 (Job Order)
                                </Label>
                                <Select
                                    value={watch('jobOrderId')}
                                    onValueChange={(val) => setValue('jobOrderId', val)}
                                    disabled={!watchedEmployerId || fetchingJobOrders || jobOrders.length === 0}
                                >
                                    <SelectTrigger className={errors.jobOrderId ? "border-red-500" : ""}>
                                        <SelectValue placeholder={
                                            fetchingJobOrders ? "載入中..." :
                                                (!watchedEmployerId ? "請先選擇雇主" :
                                                    (jobOrders.length === 0 ? "無可用招募函" : "請選擇招募函"))
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jobOrders.map((job) => (
                                            <SelectItem key={job.id} value={job.id}>
                                                {job.letterNumber} (餘額: {job.quota - job.usedQuota}) - {job.jobType || '一般'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.jobOrderId && <p className="text-xs text-red-500">{errors.jobOrderId.message as string}</p>}

                                {/* Visual Confirmation */}
                                {selectedJobOrder && (
                                    <div className="text-xs bg-green-50 text-green-700 p-2 rounded flex justify-between">
                                        <span>Quota Remaining:</span>
                                        <span className="font-bold">{selectedJobOrder.quota - selectedJobOrder.usedQuota} / {selectedJobOrder.quota}</span>
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Fields */}
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
                    <Button type="submit" disabled={isLoading || (noJobOrders as boolean)} className="shadow-lg">
                        {isLoading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                        <Save className="mr-2 h-4 w-4" />
                        {isEditMode ? '儲存修改' : '確認新增'}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
