'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import LoanBankForm from '@/components/loan-banks/LoanBankForm';

export default function NewLoanBankPage() {
    return (
        <StandardPageLayout
            title="新增貸款銀行 (New Loan Bank)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '貸款銀行管理', href: '/loan-banks' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <LoanBankForm />
        </StandardPageLayout>
    );
}
