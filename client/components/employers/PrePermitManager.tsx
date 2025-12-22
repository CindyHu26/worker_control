"use client";

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface PrePermitManagerProps {
    employerId: string;
}

export default function PrePermitManager({ employerId }: PrePermitManagerProps) {
    // const { toast } = useToast(); -> Removed

    // --- Industry Recognition State ---
    const { data: recognitions, mutate: mutateRecognitions } = useSWR(
        employerId ? `/api/industry-recognitions?employerId=${employerId}` : null,
        fetcher
    );
    const [isIdbOpen, setIsIdbOpen] = useState(false);
    const [newIdb, setNewIdb] = useState({
        bureauRefNumber: '',
        issueDate: '',
        expiryDate: '',
        tier: '',
        allocationRate: '',
    });

    const handleAddIdb = async () => {
        try {
            const res = await fetch('/api/industry-recognitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employerId,
                    bureauRefNumber: newIdb.bureauRefNumber,
                    issueDate: newIdb.issueDate,
                    expiryDate: newIdb.expiryDate || undefined, // Optional
                    tier: newIdb.tier,
                    allocationRate: newIdb.allocationRate ? Number(newIdb.allocationRate) : undefined
                })
            });
            if (!res.ok) throw new Error('Failed to create');

            mutateRecognitions();
            setIsIdbOpen(false);
            setNewIdb({ bureauRefNumber: '', issueDate: '', expiryDate: '', tier: '', allocationRate: '' });
            toast.success("Industry Recognition added");
        } catch (e) {
            toast.error("Failed to add record");
        }
    };

    const handleDeleteIdb = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/industry-recognitions/${id}`, { method: 'DELETE' });
        mutateRecognitions();
    };


    // --- Recruitment Proof State ---
    const { data: proofs, mutate: mutateProofs } = useSWR(
        employerId ? `/api/recruitment-proofs?employerId=${employerId}` : null,
        fetcher
    );
    const [isProofOpen, setIsProofOpen] = useState(false);
    const [newProof, setNewProof] = useState({
        receiptNumber: '',
        issueDate: '',
        registerDate: '',
        jobCenter: '',
        reviewFeeReceiptNo: '',
        reviewFeePayDate: ''
    });

    const handleAddProof = async () => {
        try {
            const res = await fetch('/api/recruitment-proofs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employerId,
                    receiptNumber: newProof.receiptNumber,
                    issueDate: newProof.issueDate,
                    registerDate: newProof.registerDate,
                    jobCenter: newProof.jobCenter,
                    reviewFeeReceiptNo: newProof.reviewFeeReceiptNo || undefined,
                    reviewFeePayDate: newProof.reviewFeePayDate || undefined
                })
            });
            if (!res.ok) throw new Error('Failed to create');

            mutateProofs();
            setIsProofOpen(false);
            setNewProof({ receiptNumber: '', issueDate: '', registerDate: '', jobCenter: '', reviewFeeReceiptNo: '', reviewFeePayDate: '' });
            toast.success("Recruitment Proof added");
        } catch (e) {
            toast.error("Failed to add record");
        }
    };

    const handleDeleteProof = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/recruitment-proofs/${id}`, { method: 'DELETE' });
        mutateProofs();
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Industry Recognitions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>工業局核定函 (Industry Recognitions)</CardTitle>
                    <Dialog open={isIdbOpen} onOpenChange={setIsIdbOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" />新增</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>新增工業局核定函</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>工業局函號</Label>
                                    <Input value={newIdb.bureauRefNumber} onChange={e => setNewIdb({ ...newIdb, bureauRefNumber: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>發文日期</Label>
                                        <Input type="date" value={newIdb.issueDate} onChange={e => setNewIdb({ ...newIdb, issueDate: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>有效期限 (通常3年)</Label>
                                        <Input type="date" value={newIdb.expiryDate} onChange={e => setNewIdb({ ...newIdb, expiryDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>級別 (Tier)</Label>
                                        <Select onValueChange={v => setNewIdb({ ...newIdb, tier: v })}>
                                            <SelectTrigger><SelectValue placeholder="選擇級別" /></SelectTrigger>
                                            <SelectContent>
                                                {['A+', 'A', 'B', 'C', 'D'].map(t => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>核配比率 (e.g. 0.2)</Label>
                                        <Input type="number" step="0.01" value={newIdb.allocationRate} onChange={e => setNewIdb({ ...newIdb, allocationRate: e.target.value })} placeholder="0.20" />
                                    </div>
                                </div>
                                <Button onClick={handleAddIdb}>儲存</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>函號</TableHead>
                                <TableHead>級別</TableHead>
                                <TableHead>比率</TableHead>
                                <TableHead>發文日</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recognitions?.map((r: any) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.bureauRefNumber}</TableCell>
                                    <TableCell>{r.tier}</TableCell>
                                    <TableCell>{r.allocationRate ? `${(r.allocationRate * 100).toFixed(0)}%` : '-'}</TableCell>
                                    <TableCell>{new Date(r.issueDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteIdb(r.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!recognitions || recognitions.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">無資料</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Recruitment Proofs */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>國內求才證明書 (Recruitment Proofs)</CardTitle>
                    <Dialog open={isProofOpen} onOpenChange={setIsProofOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" />新增</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>新增國內求才證明</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>求才證明序號</Label>
                                    <Input value={newProof.receiptNumber} onChange={e => setNewProof({ ...newProof, receiptNumber: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>受理單位 (Job Center)</Label>
                                    <Input value={newProof.jobCenter} onChange={e => setNewProof({ ...newProof, jobCenter: e.target.value })} placeholder="e.g. 台中就業中心" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>求才登記日</Label>
                                        <Input type="date" value={newProof.registerDate} onChange={e => setNewProof({ ...newProof, registerDate: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>證明發文日</Label>
                                        <Input type="date" value={newProof.issueDate} onChange={e => setNewProof({ ...newProof, issueDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="border-t pt-4 mt-2">
                                    <h4 className="font-medium mb-3">審查費資訊 (可後補)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>收據號碼</Label>
                                            <Input value={newProof.reviewFeeReceiptNo} onChange={e => setNewProof({ ...newProof, reviewFeeReceiptNo: e.target.value })} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>繳費日期</Label>
                                            <Input type="date" value={newProof.reviewFeePayDate} onChange={e => setNewProof({ ...newProof, reviewFeePayDate: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={handleAddProof}>儲存</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>序號</TableHead>
                                <TableHead>單位</TableHead>
                                <TableHead>發文日</TableHead>
                                <TableHead>審查費</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proofs?.map((p: any) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.receiptNumber}</TableCell>
                                    <TableCell>{p.jobCenter}</TableCell>
                                    <TableCell>{new Date(p.issueDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {p.reviewFeeReceiptNo ? (
                                            <span className="text-green-600">已繳 ({p.reviewFeeReceiptNo})</span>
                                        ) : (
                                            <span className="text-yellow-600">未繳</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProof(p.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!proofs || proofs.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">無資料</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
