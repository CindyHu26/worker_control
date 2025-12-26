'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { DomesticAgencyForm } from "@/components/domestic-agencies/DomesticAgencyForm";
import { useParams } from 'next/navigation';

export default function EditDomesticAgencyPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const json = await apiRequest(`/api/domestic-agencies/${id}`);
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
    if (!data) return <div className="p-8 text-center text-red-500">找不到公司資料</div>;

    return (
        <div className="container mx-auto py-8">
            <DomesticAgencyForm initialData={data} isEdit={true} />
        </div>
    );
}
