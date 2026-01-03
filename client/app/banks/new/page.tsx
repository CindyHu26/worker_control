"use client";

import React from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import BankForm from '@/components/bank/BankForm';

export default function CreateBankPage() {
    return (
        <StandardPageLayout
            title="?°å??€è¡?(Create Bank)"
            subtitle="å»ºç??°ç??€è¡Œè???
            breadcrumbs={[
                { label: 'é¦–é?', href: '/' },
                { label: '?€è¡Œç®¡??, href: '/banks' },
                { label: '?°å?', href: '#' },
            ]}
            showBack={true}
            maxWidth="xl" // Limit width for form readability
            card={false} // BankForm has its own card
        >
            <BankForm />
        </StandardPageLayout>
    );
}
