'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { useParams } from 'next/navigation';

export default function EditEmployeePage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const json = await apiRequest(`/api/employees/${id}`);
                setData(json);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center">載入中...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">找不到員工資料</div>;

    return (
        <div className="container mx-auto py-8">
            <EmployeeForm initialData={data} isEdit={true} />
        </div>
    );
}
