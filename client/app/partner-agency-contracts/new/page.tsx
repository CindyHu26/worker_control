'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import PartnerAgencyContractForm from '@/components/partner-agency-contracts/PartnerAgencyContractForm';

export default function NewPartnerAgencyContractPage() {
    return (
        <StandardPageLayout
            title="新增互貿合約 (New Contract)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '互貿合約管理', href: '/partner-agency-contracts' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <PartnerAgencyContractForm />
        </StandardPageLayout>
    );
}
