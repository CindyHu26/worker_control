'use client';

import { useEffect, useState } from 'react';
import { DomesticAgencyForm } from "@/components/domestic-agencies/DomesticAgencyForm";
import { useParams } from 'next/navigation';

export default function EditDomesticAgencyPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/domestic-agencies/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const json = await res.json();
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
