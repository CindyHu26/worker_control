'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import DepartmentForm from '@/components/departments/DepartmentForm';

export default function NewDepartmentPage() {
    return (
        <StandardPageLayout
            title="新增部門 (New Department)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '部門管理', href: '/departments' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <DepartmentForm />
        </StandardPageLayout>
    );
}
