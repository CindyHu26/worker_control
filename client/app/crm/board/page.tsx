"use client";

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Briefcase, User, Phone, Calendar, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Types ---
type Lead = {
    id: string;
    companyName: string | null;
    contactPerson: string | null;
    status: string;
    lastContactDate: string | null;
    nextFollowUpDate: string | null;
};

type BoardData = Record<string, Lead[]>;

const STAGES: any = {
    NEW: { title: '新進客戶 (New)', color: 'bg-slate-100 border-slate-200' },
    CONTACTED: { title: '已聯繫 (Contacted)', color: 'bg-blue-50 border-blue-200' },
    MEETING: { title: '安排訪談 (Meeting)', color: 'bg-purple-50 border-purple-200' },
    NEGOTIATING: { title: '報價協商 (Negotiating)', color: 'bg-yellow-50 border-yellow-200' },
    WON: { title: '成功簽約 (Won)', color: 'bg-green-50 border-green-200' },
    LOST: { title: '結案/流失 (Lost)', color: 'bg-red-50 border-red-200' },
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// --- Components ---

function DraggableCard({ lead }: { lead: Lead }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead.id, data: { lead } });

    const router = useRouter();

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Calculate days since last contact
    const getDaysSince = (dateStr: string | null) => {
        if (!dateStr) return null;
        const diff = Date.now() - new Date(dateStr).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const daysSince = getDaysSince(lead.lastContactDate);
    const isOverdue = daysSince !== null && daysSince > 7; // Example threshold

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => router.push(`/crm/leads/${lead.id}`)}
            className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab mb-3 group relative"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                    {lead.status}
                </span>
                {isOverdue && (
                    <span className="text-red-500" title="No contact for > 7 days">
                        <AlertCircle size={14} />
                    </span>
                )}
            </div>
            <h4 className="font-bold text-slate-800">{lead.companyName || "Unnamed Company"}</h4>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <User size={12} />
                <span className="truncate max-w-[150px]">{lead.contactPerson || "No Contact"}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                <Calendar size={12} />
                <span>
                    {lead.lastContactDate
                        ? `${daysSince} days ago`
                        : "Never contacted"}
                </span>
            </div>
        </div>
    );
}

function Column({ id, leads }: { id: string, leads: Lead[] }) {
    const { setNodeRef } = useSortable({ id });
    const config = STAGES[id] || { title: id, color: 'bg-gray-50 border-gray-200' };

    return (
        <div ref={setNodeRef} className={`flex flex-col min-w-[280px] w-full bg-slate-50/50 rounded-xl p-4 border-t-4 ${config.color.replace('bg-', 'border-t-').split(' ')[1]} h-full`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700">{config.title}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-400 border border-slate-200">
                    {leads.length}
                </span>
            </div>

            <SortableContext id={id} items={leads.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 min-h-[100px]">
                    {leads.map(lead => (
                        <DraggableCard key={lead.id} lead={lead} />
                    ))}
                    {leads.length === 0 && (
                        <div className="h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-sm p-4">
                            Drop here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export default function CRMBoard() {
    const [board, setBoard] = useState<BoardData>({
        NEW: [],
        CONTACTED: [],
        MEETING: [],
        NEGOTIATING: [],
        WON: [],
        LOST: []
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/leads`, { credentials: 'include' });
            if (res.ok) {
                const data: Lead[] = await res.json();

                // Group by status
                const newBoard: BoardData = {
                    NEW: [],
                    CONTACTED: [],
                    MEETING: [],
                    NEGOTIATING: [],
                    WON: [],
                    LOST: []
                };

                data.forEach(lead => {
                    if (newBoard[lead.status]) {
                        newBoard[lead.status].push(lead);
                    } else {
                        // Fallback/Unknown
                        if (!newBoard['NEW']) newBoard['NEW'] = [];
                        newBoard['NEW'].push(lead);
                    }
                });

                setBoard(newBoard);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
    };

    const moveCard = async (cardId: string, targetStage: string) => {
        // Optimistic Update
        let movedCard: Lead | null = null;
        setBoard(prev => {
            const newBoard = { ...prev };
            for (const stage of Object.keys(newBoard)) {
                const idx = newBoard[stage].findIndex(c => c.id === cardId);
                if (idx !== -1) {
                    movedCard = newBoard[stage][idx];
                    newBoard[stage].splice(idx, 1);
                    break;
                }
            }
            if (movedCard) {
                const updatedCard = { ...movedCard, status: targetStage };
                newBoard[targetStage].push(updatedCard);
            }
            return newBoard;
        });

        // API Call
        try {
            await fetch(`${apiUrl}/leads/${cardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: targetStage })
            });
        } catch (error) {
            console.error('Failed to move lead', error);
            fetchLeads();
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeId = active.id as string;
        let sourceStage = '';
        for (const stage in board) {
            if (board[stage].find(c => c.id === activeId)) {
                sourceStage = stage;
                break;
            }
        }

        let targetStage = over.id as string;
        if (targetStage in board) {
        } else {
            for (const stage in board) {
                if (board[stage].find(c => c.id === targetStage)) {
                    targetStage = stage;
                    break;
                }
            }
        }

        if (sourceStage === targetStage) return;

        moveCard(activeId, targetStage);
    };

    // Find active card for overlay
    let activeCard: Lead | null = null;
    if (activeId) {
        for (const stage in board) {
            const found = board[stage].find(c => c.id === activeId);
            if (found) {
                activeCard = found;
                break;
            }
        }
    }

    const router = useRouter(); // Hook added here for the button

    if (loading) return <div className="p-10 text-center text-slate-400">Loading Leads...</div>;

    return (
        <div className="p-4 h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="text-blue-600" />
                    Sales Pipeline
                </h1>
                <button
                    onClick={() => router.push('/crm/leads/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + 新增潛在客戶
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto h-full pb-4">
                    {Object.keys(STAGES).map(stageId => (
                        <Column key={stageId} id={stageId} leads={board[stageId]} />
                    ))}
                </div>

                <DragOverlay>
                    {activeCard ? <DraggableCard lead={activeCard} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
