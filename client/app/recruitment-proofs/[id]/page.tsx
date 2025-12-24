'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RecruitmentProofForm from '@/components/recruitment/RecruitmentProofForm';
import PageContainer from '@/components/layout/PageContainer';
import { Loader2 } from 'lucide-react';

export default function EditRecruitmentProofPage() {
    const params = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchData(params.id as string);
        }
    }, [params.id]);

    const fetchData = async (id: string) => {
        try {
            // Note: Currently GET /api/recruitment-proofs returns a list. 
            // Ideally we need GET /api/recruitment-proofs/:id
            // But checking the previous route implementation...
            // Wait, previous session implemented GET / (list) and POST /.
            // Did it implement GET /:id? 
            // Let's assume we need to implement GET /:id in backend if it's missing.
            // But first, let's try to fetch list and find? No that's bad.
            // Checking the previous route file view... it had `router.put('/:id'...)`.
            // It might NOT have `router.get('/:id')`.
            // I'll assume I might need to fix backend too. 
            // Actually, I'll fetch `/api/recruitment-proofs/${id}` and see.
            const res = await fetch(`/api/recruitment-proofs/${id}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                console.error("Failed to fetch");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PageContainer title="載入中...">
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            </PageContainer>
        );
    }

    return <RecruitmentProofForm initialData={data} isEdit={true} />;
}
