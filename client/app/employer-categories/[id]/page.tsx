'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { EmployerCategoryForm } from "@/components/employer-categories/EmployerCategoryForm";
import { useParams } from 'next/navigation';

export default function EditEmployerCategoryPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const json = await apiRequest(`/api/employer-categories/${id}`);
                setData(json);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Category not found</div>;

    return (
        <div className="container mx-auto py-8">
            <EmployerCategoryForm initialData={data} isEdit={true} />
        </div>
    );
}
