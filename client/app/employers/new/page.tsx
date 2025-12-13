"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import EmployerForm from '@/components/employers/EmployerForm';

export default function NewEmployerPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const res = await fetch('http://localhost:3001/api/employers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '系統錯誤');
        }

        alert('新增成功');
        router.push('/employers');
        router.refresh();
    };

    return <EmployerForm onSubmit={handleSubmit} />;
}
