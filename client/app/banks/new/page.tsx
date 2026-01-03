"use client";

import React from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import BankForm from '@/components/bank/BankForm';

export default function CreateBankPage() {
    return (
        <StandardPageLayout
            title="新增銀行 (Create Bank)"
            subtitle="建立行庫資料"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '銀行管理', href: '/banks' },
                { label: '新增', href: '#' },
            ]}
            showBack={true}
            maxWidth="xl" // Limit width for form readability
            card={false} // BankForm has its own card
        >
            <BankForm />
        </StandardPageLayout>
    );
}
