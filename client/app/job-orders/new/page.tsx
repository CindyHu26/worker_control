'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import JobOrderForm from '@/components/job-orders/JobOrderForm';

export default function NewJobOrderPage() {
    return (
        <StandardPageLayout
            title="?°å??›å?è¨‚å–®"
            subtitle="å»ºç??°ç??·ç¼º?€æ±?(Create Job Order)"
            breadcrumbs={[
                { label: '?›å?è¨‚å–®', href: '/job-orders' },
                { label: '?°å?è¨‚å–®' },
            ]}
        >
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <JobOrderForm />
            </div>
        </StandardPageLayout>
    );
}
