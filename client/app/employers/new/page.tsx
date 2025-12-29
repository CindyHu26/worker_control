'use client';

import PageContainer from '@/components/layout/PageContainer';
import EmployerForm from '@/components/employers/EmployerForm';
import { useRouter } from 'next/navigation';
import { getEmployerBreadcrumbs } from '@/lib/breadcrumbs';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

/**
 * NewEmployerPage - 新增雇主頁面
 * 
 * 簡化版：移除類別選擇步驟
 * 雇主類型由統編/身分證字號格式自動判斷
 * 申請類別在招募函管理時設定
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

    return (
        <PageContainer
            title="新增雇主"
            subtitle="請填寫完整的雇主資訊"
            showBack
            breadcrumbs={getEmployerBreadcrumbs()}
        >
            <EmployerForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </PageContainer>
    );
}
