'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INTERACTION_TYPES, InteractionTypeKey, getInteractionTypeLabel } from '@/lib/leadConstants';
import { Phone, MapPin, Mail, MessageSquare, Calendar as CalendarIcon, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Interaction {
    id: string;
    type: string;
    summary: string;
    detailedNotes: string | null;
    outcome: string | null;
    date: string;
}

interface ActivityTimelineProps {
    leadId: string;
    interactions: Interaction[];
    onUpdate: () => void;
}

const getInteractionIcon = (type: string) => {
    switch (type.toUpperCase()) {
        case 'CALL':
            return <Phone className="h-4 w-4" />;
        case 'VISIT':
            return <MapPin className="h-4 w-4" />;
        case 'EMAIL':
            return <Mail className="h-4 w-4" />;
        case 'LINE':
        case 'MEETING':
            return <MessageSquare className="h-4 w-4" />;
        default:
            return <CalendarIcon className="h-4 w-4" />;
    }
};

const getInteractionColor = (type: string) => {
    switch (type.toUpperCase()) {
        case 'CALL':
            return 'bg-green-100 text-green-600';
        case 'VISIT':
            return 'bg-purple-100 text-purple-600';
        case 'EMAIL':
            return 'bg-blue-100 text-blue-600';
        case 'LINE':
            return 'bg-emerald-100 text-emerald-600';
        case 'MEETING':
            return 'bg-orange-100 text-orange-600';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

export default function ActivityTimeline({ leadId, interactions, onUpdate }: ActivityTimelineProps) {
    const [newInteraction, setNewInteraction] = useState({
        type: 'CALL' as InteractionTypeKey,
        summary: '',
        detailedNotes: '',
        nextFollowUpDate: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newInteraction.summary.trim()) {
            toast.error('請輸入活動摘要');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch(`/api/leads/${leadId}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newInteraction.type,
                    summary: newInteraction.summary,
                    detailedNotes: newInteraction.detailedNotes || null,
                    nextFollowUpDate: newInteraction.nextFollowUpDate || null
                })
            });

            if (!res.ok) {
                throw new Error('Failed to add interaction');
            }

            toast.success('活動紀錄已新增');
            setNewInteraction({
                type: 'CALL',
                summary: '',
                detailedNotes: '',
                nextFollowUpDate: ''
            });
            onUpdate();
        } catch (error) {
            console.error('Error adding interaction:', error);
            toast.error('新增活動紀錄失敗');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">活動時間軸</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Interaction Form */}
                <form onSubmit={handleSubmit} className="space-y-3 pb-4 border-b">
                    <Select
                        value={newInteraction.type}
                        onValueChange={(value) => setNewInteraction(prev => ({ ...prev, type: value as InteractionTypeKey }))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(INTERACTION_TYPES).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        placeholder="簡短摘要（例如：討論報價）"
                        value={newInteraction.summary}
                        onChange={(e) => setNewInteraction(prev => ({ ...prev, summary: e.target.value }))}
                        required
                    />

                    <Textarea
                        placeholder="詳細記錄..."
                        value={newInteraction.detailedNotes}
                        onChange={(e) => setNewInteraction(prev => ({ ...prev, detailedNotes: e.target.value }))}
                        rows={3}
                    />

                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">下次追蹤日期</label>
                            <Input
                                type="date"
                                value={newInteraction.nextFollowUpDate}
                                onChange={(e) => setNewInteraction(prev => ({ ...prev, nextFollowUpDate: e.target.value }))}
                            />
                        </div>
                        <Button type="submit" disabled={submitting} className="flex-shrink-0">
                            {submitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            紀錄活動
                        </Button>
                    </div>
                </form>

                {/* Timeline List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {interactions.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">尚無活動紀錄</p>
                        </div>
                    ) : (
                        interactions.map((interaction, index) => (
                            <div
                                key={interaction.id}
                                className="relative pl-8 pb-4 last:pb-0"
                            >
                                {/* Timeline line */}
                                {index < interactions.length - 1 && (
                                    <div className="absolute left-3 top-8 bottom-0 w-px bg-gray-200" />
                                )}

                                {/* Icon */}
                                <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center ${getInteractionColor(interaction.type)}`}>
                                    {getInteractionIcon(interaction.type)}
                                </div>

                                {/* Content */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                                {getInteractionTypeLabel(interaction.type)}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="font-bold text-sm text-gray-700">
                                                {interaction.summary}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {new Date(interaction.date).toLocaleDateString('zh-TW', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    {interaction.detailedNotes && (
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                            {interaction.detailedNotes}
                                        </p>
                                    )}
                                    {interaction.outcome && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            結果：{interaction.outcome}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
