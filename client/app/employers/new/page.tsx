'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import EmployerForm from '@/components/employers/EmployerForm';
import { useRouter } from 'next/navigation';
import { getEmployerBreadcrumbs } from '@/lib/breadcrumbs';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

/**
 * NewEmployerPage - ?°å??‡ä¸»?é¢
 * 
 * ç°¡å??ˆï?ç§»é™¤é¡åˆ¥?¸æ?æ­¥é?
 * ?‡ä¸»é¡å??±çµ±ç·?èº«å?è­‰å??Ÿæ ¼å¼è‡ª?•åˆ¤??
 * ?³è?é¡åˆ¥?¨æ??Ÿå‡½ç®¡ç??‚è¨­å®?
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
                    toast.warning(`ç³»çµ±?å??²å?ï¼ä?è«‹æ³¨?ä»¥ä¸‹ç¼ºæ¼ï?\n${health.alerts.join('\n')}`);
                } else {
                    toast.success('?°å??å?');
                }
            } catch (e) {
                console.error('Analysis failed', e);
                toast.success('?°å??å?');
            }

            router.push(`/employers/${newEmp.id}`);
        } catch (error: any) {
            toast.error(error.message || 'ç³»çµ±?¯èª¤');
            throw error;
        }
    };

    const handleCancel = () => {
        router.push('/employers');
    };

    return (
        <StandardPageLayout
            title="?°å??‡ä¸»"
            subtitle="è«‹å¡«å¯«å??´ç??‡ä¸»è³‡è?"
            showBack
            breadcrumbs={getEmployerBreadcrumbs()}
        >
            <EmployerForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </StandardPageLayout>
    );
}
