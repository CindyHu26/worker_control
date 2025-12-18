
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Hypothetical

interface ContractFormProps {
    employerId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // If editing
}

export default function ContractForm({ employerId, isOpen, onClose, onSuccess, initialData }: ContractFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        contractNumber: initialData?.contractNumber || '',
        type: initialData?.type || 'recruitment',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        serviceFee: initialData?.serviceFee || '',
        signedDate: initialData?.signedDate || '',
        status: initialData?.status || 'active',
        notes: initialData?.notes || ''
    });
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('employerId', employerId);
            data.append('contractNumber', formData.contractNumber);
            data.append('type', formData.type);
            data.append('startDate', formData.startDate ? new Date(formData.startDate).toISOString() : '');
            data.append('endDate', formData.endDate ? new Date(formData.endDate).toISOString() : '');
            data.append('serviceFee', formData.serviceFee); // Backend handles number conversion
            if (formData.signedDate) data.append('signedDate', new Date(formData.signedDate).toISOString());
            data.append('status', formData.status);
            data.append('notes', formData.notes);

            if (file) {
                data.append('file', file);
            }

            const url = initialData
                ? `http://localhost:3001/api/contracts/${initialData.id}`
                : `http://localhost:3001/api/contracts`;

            const method = initialData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                body: data, // Using FormData, content-type header is set automatically
            });

            if (!res.ok) {
                throw new Error('Failed to save contract');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error saving contract');
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (field: string, date: Date | undefined) => {
        if (date) {
            setFormData(prev => ({ ...prev, [field]: format(date, 'yyyy-MM-dd') }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? '編輯合約' : '新增委任合約 (Create Contract)'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>合約編號 (Contract No)</Label>
                            <Input
                                value={formData.contractNumber}
                                onChange={e => setFormData({ ...formData, contractNumber: e.target.value })}
                                placeholder="C-2024-001"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>合約類型 (Type)</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="recruitment">招募委任 (Recruitment)</option>
                                <option value="management">生活管理 (Management)</option>
                                <option value="other">其他 (Other)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>合約起始日 (Start)</Label>
                            <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>合約截止日 (End)</Label>
                            <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>簽署日期 (Signed Date)</Label>
                            <Input type="date" value={formData.signedDate} onChange={e => setFormData({ ...formData, signedDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>服務費用 (Fee)</Label>
                            <Input
                                type="number"
                                value={formData.serviceFee}
                                onChange={e => setFormData({ ...formData, serviceFee: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>附件上傳 (Upload PDF)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept=".pdf,.jpg,.png"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                            />
                            {initialData?.attachments?.length > 0 && !file && (
                                <span className="text-sm text-green-600">已上傳: {initialData.attachments[0].fileName}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>備註 (Notes)</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>取消</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            儲存
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
