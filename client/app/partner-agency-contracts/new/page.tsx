'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import PartnerAgencyContractForm from '@/components/partner-agency-contracts/PartnerAgencyContractForm';

export default function NewPartnerAgencyContractPage() {
    return (
        <StandardPageLayout
            title="?°å?äº’è²¿?ˆç? (New Contract)"
            breadcrumbs={[
                { label: 'é¦–é?', href: '/' },
                { label: 'äº’è²¿?ˆç?ç®¡ç?', href: '/partner-agency-contracts' },
                { label: '?°å?' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <PartnerAgencyContractForm />
        </StandardPageLayout>
    );
}
