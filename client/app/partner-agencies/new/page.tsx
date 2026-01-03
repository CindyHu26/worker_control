'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import PartnerAgencyForm from '@/components/partner-agencies/PartnerAgencyForm';

export default function NewPartnerAgencyPage() {
    return (
        <StandardPageLayout
            title="?°å??‹å?ä»²ä? (New Agency)"
            breadcrumbs={[
                { label: 'é¦–é?', href: '/' },
                { label: '?‹å?ä»²ä?ç®¡ç?', href: '/partner-agencies' },
                { label: '?°å?' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <PartnerAgencyForm />
        </StandardPageLayout>
    );
}
