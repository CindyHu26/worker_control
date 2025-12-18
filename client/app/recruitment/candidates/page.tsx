'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Search } from "lucide-react";

interface Candidate {
    id: string;
    englishName: string;
    chineseName: string | null;
    nationality: string;
    dob: string;
    gender: string | null;
    status: string;
}

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        englishName: '',
        chineseName: '',
        nationality: 'VN',
        dob: '',
        gender: 'MALE'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/interviews/candidates');
            if (!res.ok) throw new Error('Failed to fetch candidates');
            const data = await res.json();
            setCandidates(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Reusing the full-entry/worker creation endpoint but forcing status CANDIDATE??
            // Actually, the existing /api/workers/full-entry creates with default or provided fields.
            // But wait, my schema change set default to CANDIDATE. 
            // So if I create a worker via existing API, what status will it get? 
            // Existing API jobs/workers.ts:
            // "status" is NOT typically passed in Create payload in legacy code.
            // If I look at the schema again: `status String @default("CANDIDATE")`
            // So ANY new worker created without explicit status will be CANDIDATE.
            // However, legacy code might be setting "active" implicitly via Deployment?
            // Let's use the standard worker creation but ensure no active deployment is attached yet.

            // Actually, I should probably use a simpler endpoint or just the standard /api/workers 
            // checking if I need to pass "status" explicitly or rely on default.
            // The schema has default "CANDIDATE".
            // The `api/workers/full-entry` doesn't seem to set `status` explicitly in the `tx.worker.create` block in the file I read earlier.
            // So it should default to CANDIDATE unless a default in DB is overridden.
            // Great!

            const res = await fetch('http://localhost:3001/api/workers/full-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    // No employerId = No deployment = No "Active" status logic triggered (hopefully)
                })
            });

            if (!res.ok) throw new Error('Failed to create candidate');

            await fetchCandidates();
            setIsAddOpen(false);
            setFormData({
                englishName: '',
                chineseName: '',
                nationality: 'VN',
                dob: '',
                gender: 'MALE'
            });
        } catch (error) {
            console.error(error);
            alert('Failed to create candidate');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">候選人管理 (Candidates)</h1>
                <Button onClick={() => setIsAddOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    新增候選人
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="搜尋候選人..." className="w-[300px]" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>姓名 (Name)</TableHead>
                                <TableHead>國籍 (Nationality)</TableHead>
                                <TableHead>性別 (Gender)</TableHead>
                                <TableHead>出生日期 (DOB)</TableHead>
                                <TableHead>狀態 (Status)</TableHead>
                                <TableHead>操作 (Actions)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : candidates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        無候選人資料 (No Candidates Found)
                                    </TableCell>
                                </TableRow>
                            ) : (
                                candidates.map(candidate => (
                                    <TableRow key={candidate.id}>
                                        <TableCell>
                                            <div className="font-medium">{candidate.englishName}</div>
                                            <div className="text-sm text-muted-foreground">{candidate.chineseName}</div>
                                        </TableCell>
                                        <TableCell>{candidate.nationality}</TableCell>
                                        <TableCell>{candidate.gender}</TableCell>
                                        <TableCell>{new Date(candidate.dob).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {candidate.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">編輯</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新增候選人 (Add Candidate)</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCandidate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>英文姓名 (English Name)</Label>
                                <Input
                                    value={formData.englishName}
                                    onChange={e => setFormData({ ...formData, englishName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>中文姓名 (Chinese Name)</Label>
                                <Input
                                    value={formData.chineseName}
                                    onChange={e => setFormData({ ...formData, chineseName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>國籍 (Nationality)</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.nationality}
                                    onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                >
                                    <option value="VN">越南 (Vietnam)</option>
                                    <option value="ID">印尼 (Indonesia)</option>
                                    <option value="PH">菲律賓 (Philippines)</option>
                                    <option value="TH">泰國 (Thailand)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>性別 (Gender)</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="MALE">男 (Male)</option>
                                    <option value="FEMALE">女 (Female)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>出生日期 (Date of Birth)</Label>
                            <Input
                                type="date"
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>取消</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                建立
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
