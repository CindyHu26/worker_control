import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search } from "lucide-react";
import CVReviewModal from './CVReviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface JobOrderCandidatesProps {
    interviewId: string;
    candidates: any[];
    onUpdate: () => void;
}

export default function JobOrderCandidates({ interviewId, candidates, onUpdate }: JobOrderCandidatesProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableCandidates, setAvailableCandidates] = useState<any[]>([]);

    const handleDecision = async (result: 'accepted' | 'rejected', remarks?: string) => {
        if (!selectedCandidate) return;
        try {
            const res = await fetch(`http://localhost:3001/api/interviews/${interviewId}/candidates/${selectedCandidate.worker.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ result, remarks })
            });
            if (!res.ok) throw new Error('Failed');
            setSelectedCandidate(null);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        }
    };

    const fetchAvailableCandidates = async () => {
        // Fetch candidates with status CANDIDATE
        const res = await fetch('http://localhost:3001/api/interviews/candidates');
        const data = await res.json();
        const currentIds = candidates.map(c => c.worker.id);
        // Filter out already added ones
        setAvailableCandidates(data.filter((c: any) => !currentIds.includes(c.id)));
    };

    const handleAddCandidates = async (workerIds: string[]) => {
        try {
            await fetch(`http://localhost:3001/api/interviews/${interviewId}/candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerIds })
            });
            setIsAddOpen(false);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>候選人名單 (Candidates)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => { setIsAddOpen(true); fetchAvailableCandidates(); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    加入候選人
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>姓名</TableHead>
                            <TableHead>國籍</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    暫無候選人
                                </TableCell>
                            </TableRow>
                        ) : (
                            candidates.map((c: any) => (
                                <TableRow key={c.worker.id}>
                                    <TableCell>
                                        <div>{c.worker.englishName}</div>
                                        <div className="text-xs text-muted-foreground">{c.worker.chineseName}</div>
                                    </TableCell>
                                    <TableCell>{c.worker.nationality}</TableCell>
                                    <TableCell>
                                        <Badge variant={c.result === 'pending' ? 'outline' : c.result === 'accepted' ? 'default' : 'secondary'}>
                                            {c.result}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => setSelectedCandidate(c)}>
                                            審核 (Review)
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <CVReviewModal
                    isOpen={!!selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    candidate={selectedCandidate}
                    onDecision={handleDecision}
                />

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>選擇候選人</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Search className="h-4 w-4" />
                                <Input
                                    placeholder="搜尋..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded p-2">
                                {availableCandidates
                                    .filter(c => c.englishName.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border-b last:border-0 lowercase">
                                            <div>
                                                <div className="font-medium">{c.englishName}</div>
                                                <div className="text-xs text-muted-foreground">{c.nationality} • {c.gender}</div>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => handleAddCandidates([c.id])}>
                                                選擇
                                            </Button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
