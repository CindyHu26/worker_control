import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Check, X, FileText } from "lucide-react";

interface Worker {
    id: string;
    englishName: string;
    chineseName: string | null;
    nationality: string;
    dob: string;
    gender: string | null;
    maritalStatus: string | null;
    educationLevel: string | null;
    height: number | null;
    weight: number | null;
    religion: string | null;
}

interface InterviewCandidate {
    worker: Worker;
    result: string; // pending, accepted, rejected
    remarks: string | null;
}

interface CVReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: InterviewCandidate | null;
    onDecision: (result: 'accepted' | 'rejected', remarks?: string) => void;
}

export default function CVReviewModal({ isOpen, onClose, candidate, onDecision }: CVReviewModalProps) {
    if (!candidate) return null;

    const { worker } = candidate;
    const age = new Date().getFullYear() - new Date(worker.dob).getFullYear();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <DialogTitle className="text-xl">履歷審核 (CV Review)</DialogTitle>
                        <Badge variant={candidate.result === 'pending' ? 'outline' : candidate.result === 'accepted' ? 'default' : 'destructive'}>
                            {candidate.result.toUpperCase()}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-6 py-4">
                    {/* Left Column: Photo & Key Stats */}
                    <div className="col-span-1 space-y-4">
                        <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center border">
                            <span className="text-slate-400">Photo</span>
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg">{worker.englishName}</h3>
                            <p className="text-sm text-muted-foreground">{worker.chineseName}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Age:</span>
                                <span>{age}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Height:</span>
                                <span>{worker.height} cm</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Weight:</span>
                                <span>{worker.weight} kg</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="col-span-2 space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2 text-sm text-slate-500 uppercase tracking-wider">Personal Info</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Nationality</span>
                                    <span className="font-medium">{worker.nationality}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Gender</span>
                                    <span className="font-medium">{worker.gender}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Marital Status</span>
                                    <span className="font-medium">{worker.maritalStatus || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Religion</span>
                                    <span className="font-medium">{worker.religion || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h4 className="font-semibold mb-2 text-sm text-slate-500 uppercase tracking-wider">Education & Skills</h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Education Level</span>
                                    <span className="font-medium">{worker.educationLevel || '-'}</span>
                                </div>
                                {/* Add more skill fields later */}
                            </div>
                        </div>

                        {/* Actions Only if Pending */}
                        {candidate.result === 'pending' && (
                            <div className="pt-4 flex gap-3">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => onDecision('accepted')}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    錄取 (Accept)
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="destructive"
                                    onClick={() => onDecision('rejected')}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    不錄取 (Reject)
                                </Button>
                            </div>
                        )}
                        {candidate.result !== 'pending' && (
                            <div className="pt-4 p-3 bg-slate-50 rounded text-center text-sm text-slate-600 border border-slate-200">
                                Decision made: <span className="font-semibold">{candidate.result.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
