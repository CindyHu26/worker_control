'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import PartnerAgencyForm from '@/components/partner-agencies/PartnerAgencyForm';

export default function NewPartnerAgencyPage() {
    return (
        <StandardPageLayout
            title="新增合作仲介 (New Agency)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '合作仲介管理', href: '/partner-agencies' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <PartnerAgencyForm />
        </StandardPageLayout>
    );
}
