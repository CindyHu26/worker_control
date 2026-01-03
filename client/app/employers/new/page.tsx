'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import EmployerForm from '@/components/employers/EmployerForm';
import { useRouter } from 'next/navigation';
import { getEmployerBreadcrumbs } from '@/lib/breadcrumbs';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

/**
 * NewEmployerPage - 新增雇主主面
 */
export default function NewEmployerPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        try {
            const newEmp = await apiPost('/api/employers', data);

            // Analyze Data Health
            try {
                const health = await apiPost(`/api/compliance/employers/${newEmp.id}/analyze`, {});

                if (!health.isReady) {
                    toast.warning(`系統成功儲存！但請注意以下缺漏：\n${health.alerts.join('\n')}`);
                } else {
                    toast.success('新增成功');
                }
            } catch (e) {
                console.error('Analysis failed', e);
                toast.success('新增成功');
            }

            router.push(`/employers/${newEmp.id}`);
        } catch (error: any) {
            toast.error(error.message || '系統錯誤');
            throw error;
        }
    };

    const handleCancel = () => {
        router.push('/employers');
    };

    const FORM_ID = "employer-form";

    return (
        <StandardPageLayout
            title="新增雇主"
            subtitle="請填寫雇主資料"
            showBack
            breadcrumbs={getEmployerBreadcrumbs()}
            actions={
                <Button type="submit" form={FORM_ID} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <Save className="h-4 w-4" />
                    儲存變更
                </Button>
            }
        >
            <EmployerForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                formId={FORM_ID}
                hideSubmit={true}
            />
        </StandardPageLayout>
    );
}
