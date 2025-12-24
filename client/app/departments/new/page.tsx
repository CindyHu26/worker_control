'use client';

import PageContainer from '@/components/layout/PageContainer';
import DepartmentForm from '@/components/departments/DepartmentForm';

export default function NewDepartmentPage() {
    return (
        <PageContainer
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
        </PageContainer>
    );
}
