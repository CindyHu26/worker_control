'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import CountryForm from '@/components/countries/CountryForm';

export default function NewCountryPage() {
    return (
        <StandardPageLayout
            title="?°å??‹åˆ¥ (New Country)"
            breadcrumbs={[
                { label: 'é¦–é?', href: '/' },
                { label: '?‹åˆ¥ç®¡ç?', href: '/countries' },
                { label: '?°å?' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <CountryForm />
        </StandardPageLayout>
    );
}
