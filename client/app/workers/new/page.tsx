'use client';

import PageContainer from '@/components/layout/PageContainer';
import WorkerForm from '@/components/workers/WorkerForm';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewWorkerPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const res = await fetch('/api/workers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '建立失敗');
        }

        const worker = await res.json();
        toast.success('外勞建檔成功');
        router.push(`/workers/${worker.id}`);
    };

    const handleCancel = () => {
        router.push('/workers');
    };

    return (
        <PageContainer
            title="新增移工"
            subtitle="建立新的外籍勞工檔案或新增派遣記錄"
            showBack
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '外勞管理', href: '/workers' },
                { label: '新增移工' }
            ]}
        >
            <WorkerForm onSubmit={handleSubmit} onCancel={handleCancel} />
        </PageContainer>
    );
}
