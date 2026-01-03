'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import JobOrderForm from '@/components/recruitment/JobOrderForm';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FORM_ID = 'job-order-form';

export default function NewJobOrderPage() {
    const router = useRouter();

    const handleSuccess = (id: string) => {
        router.push(`/job-orders/${id}`);
    };

    const handleCancel = () => {
        router.push('/job-orders');
    };

    return (
        <StandardPageLayout
            title="新增求才訂單"
            subtitle="建立新的人力需求訂單(Create Job Order)"
            breadcrumbs={[
                { label: '求才訂單', href: '/job-orders' },
                { label: '新增訂單' },
            ]}
            actions={
                <Button type="submit" form={FORM_ID} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <Save className="h-4 w-4" />
                    儲存訂單
                </Button>
            }
        >
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <JobOrderForm
                    formId={FORM_ID}
                    hideSubmit={true}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </StandardPageLayout>
    );
}
