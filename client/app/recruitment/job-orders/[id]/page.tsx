'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import JobOrderCandidates from '@/components/recruitment/JobOrderCandidates';
import { Separator } from '@/components/ui/separator';

export default function JobOrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [jobOrder, setJobOrder] = useState<any>(null);
    const [interview, setInterview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchJobOrder();
        }
    }, [id]);

    const fetchJobOrder = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/recruitment/job-orders/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setJobOrder(data);

            // Also fetch interviews
            // Currently backend doesn't link Interview -> JobOrder directly in the same fetch unless we ask
            // Or we check /api/interviews?jobOrderId=...
            // But I implemented GET /api/interviews/:id. 
            // I probably need an endpoint to Find Interview by Job Order. 
            // Let's assume for now we fetch job order and it *should* have interviews includes or we fetch separate.
            // My route `recruitment.ts` GET `job-orders/:id` includes `jobRequisition` but NOT `interviews`.
            // I should update that route or just add a separate fetch.
            // Let's double check `router.get('/job-orders/:id', ...)` in `recruitment.ts`.
            // It includes `employer` and `jobRequisition`.

            // Wait, I didn't add the `Interview` relation to `JobOrder` include in `recruitment.ts`.
            // I should probably fix that backend route or create a new "create/find interview" logic here.
            // Let's try to just Find the First Interview for this Job Order from the frontend by listing them?
            // "interviews" table has `jobOrderId`. I don't have a "List Interviews by JobOrder" API yet.
            // But I can add one or patch the existing one.
            // Or... I can just create one if missing.

            // Workaround: I'll add `interviews` to the include in `recruitment.ts` quickly or better yet 
            // I will create a dedicated endpoint in `interviews.ts` to `GET /api/interviews?jobOrderId=...`?
            // No, `interviews.ts` only has `GET /candidates` and `POST /`. 

            // Use this strategy: 
            // 1. Fetch Job Order.
            // 2. Fetch Interviews (I need to adding query support to `interviews.ts` or just include in JobOrder). 

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // I need to fetch the Interview to pass ID to JobOrderCandidates
    // Let's modify `interviews.ts` to allow finding by jobOrderId or add it to `recruitment.ts`.
    // Adding to `recruitment.ts` (JobOrder get) is cleaner.

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
            </Button>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
            ) : jobOrder ? (
                <div className="space-y-6">
                    <header className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">招募單 (Job Order)</h1>
                            <p className="text-muted-foreground mt-1">
                                {jobOrder.employer.companyName} • {jobOrder.jobType}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{jobOrder.vacancyCount} 人</div>
                            <div className="text-sm text-muted-foreground">需求人數</div>
                        </div>
                    </header>

                    <Separator />

                    <div className="grid grid-cols-3 gap-6">
                        {/* Left: Info */}
                        <div className="col-span-1 space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">基本資訊</CardTitle></CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">求才登記日</span>
                                        <span className="font-medium">{new Date(jobOrder.registryDate).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">有效期限</span>
                                        <span className="font-medium">{new Date(jobOrder.expiryDate).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">就服中心</span>
                                        <span className="font-medium">{jobOrder.centerName || '-'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right: Candidates */}
                        <div className="col-span-2">
                            <InterviewSection jobOrderId={jobOrder.id} />
                        </div>
                    </div>
                </div>
            ) : (
                <div>Job Order not found</div>
            )}
        </div>
    );
}

function InterviewSection({ jobOrderId }: { jobOrderId: string }) {
    const [interview, setInterview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchInterview = async () => {
        // Create a temporary fetch to finding interview or creating it
        // Since I didn't implement "Get Interview By Job Order", I'll implement a simple "Ensure Interview" client-side logic? 
        // No, that's bad. 
        // Let's actually patch `jobs.ts` or `recruitment.ts` or `interviews.ts` to support this properly.
        // BUT for now, to make the page works, I will inject a "Create Interview" button if none exists.
        // But how do I know if none exists?

        // I'll update `recruitment.ts` to include `interviews` relation in the GET /job-orders/:id response.
        // Let's assume I did that (I will do it next step).
        try {
            // For now, let's try to hit the API, assuming I'll fix it.
            const res = await fetch(`http://localhost:3001/api/recruitment/job-orders/${jobOrderId}`);
            const data = await res.json();
            if (data.interviews && data.interviews.length > 0) {
                // Fetch full interview details with candidates
                const intRes = await fetch(`http://localhost:3001/api/interviews/${data.interviews[0].id}`);
                setInterview(await intRes.json());
            } else {
                setInterview(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterview();
    }, [jobOrderId]);

    const handleCreateInterview = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/interviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobOrderId,
                    interviewDate: new Date(),
                    location: 'TBD',
                })
            });
            const newInt = await res.json();
            // Fetch full details
            const intRes = await fetch(`http://localhost:3001/api/interviews/${newInt.id}`);
            setInterview(await intRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader2 className="animate-spin" />;

    if (!interview) {
        return (
            <Card className="flex flex-col items-center justify-center p-8 space-y-4 border-dashed">
                <div className="text-muted-foreground">尚未建立面試場次 (No Interview Session)</div>
                <Button onClick={handleCreateInterview}>
                    <Calendar className="mr-2 h-4 w-4" />
                    建立面試 (Create Interview)
                </Button>
            </Card>
        );
    }

    return (
        <JobOrderCandidates
            interviewId={interview.id}
            candidates={interview.candidates || []}
            onUpdate={fetchInterview}
        />
    );
}
