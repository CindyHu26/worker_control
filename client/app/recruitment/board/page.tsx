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
import { User, Flag, Plane, Briefcase, FileText } from 'lucide-react';

import ArrivalModal from '@/components/kanban/ArrivalModal';

// --- Types ---
type Card = {
    id: string; // deploymentId
    processStage: string;
    worker: {
        id: string;
        englishName: string;
        chineseName: string | null;
        nationality: string;
    };
    employer: {
        companyName: string;
    };
};

type BoardData = Record<string, Card[]>;

const STAGES = {
    recruitment: { title: 'Recruitment', color: 'bg-slate-100 border-slate-200' },
    visa_processing: { title: 'Visa Processing', color: 'bg-blue-50 border-blue-200' },
    flight_booking: { title: 'Flight Booking', color: 'bg-yellow-50 border-yellow-200' },
    arrival: { title: 'Arrival', color: 'bg-green-50 border-green-200' },
    medical_check: { title: 'Entry Med Check', color: 'bg-indigo-50 border-indigo-200' },
};

// --- Components ---

function DraggableCard({ card }: { card: Card }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: card.id, data: { card } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab mb-3 group"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                    {card.worker.nationality}
                </span>
                <span className="text-xs text-slate-400 font-mono">#{card.worker.id.substring(0, 6)}</span>
            </div>
            <h4 className="font-bold text-slate-800">{card.worker.chineseName || card.worker.englishName}</h4>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <Briefcase size={12} />
                <span className="truncate max-w-[150px]">{card.employer.companyName}</span>
            </div>
        </div>
    );
}

function Column({ id, cards }: { id: string, cards: Card[] }) {
    const { setNodeRef } = useSortable({ id });
    const config = STAGES[id as keyof typeof STAGES];

    return (
        <div ref={setNodeRef} className={`flex flex-col min-w-[280px] w-full bg-slate-50/50 rounded-xl p-4 border-t-4 ${config.color.replace('bg-', 'border-t-').split(' ')[1]} h-full`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700">{config.title}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-400 border border-slate-200">
                    {cards.length}
                </span>
            </div>

            <SortableContext id={id} items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 min-h-[100px]">
                    {cards.map(card => (
                        <DraggableCard key={card.id} card={card} />
                    ))}
                    {cards.length === 0 && (
                        <div className="h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 text-sm p-4">
                            Drop here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export default function RecruitmentBoard() {
    const [board, setBoard] = useState<BoardData>({
        recruitment: [],
        visa_processing: [],
        flight_booking: [],
        arrival: [],
        medical_check: []
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [pendingMove, setPendingMove] = useState<{ cardId: string, overId: string } | null>(null);
    const [showArrivalModal, setShowArrivalModal] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchBoard();
    }, []);

    const fetchBoard = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/kanban/board'); // Assuming API is running locally
            if (res.ok) {
                const data = await res.json();
                // Ensure all keys exist
                const safeBoard: BoardData = {
                    recruitment: data.recruitment || [],
                    visa_processing: data.visa_processing || [],
                    flight_booking: data.flight_booking || [],
                    arrival: data.arrival || [],
                    medical_check: data.medical_check || []
                };
                setBoard(safeBoard);
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
        // Optional: Implement real-time reordering preview if complex
    };

    const moveCard = async (cardId: string, targetStage: string, payload?: any) => {
        // Optimistic Update
        let movedCard: Card | null = null;
        setBoard(prev => {
            const newBoard = { ...prev };
            // Find and remove
            for (const stage of Object.keys(newBoard)) {
                const idx = newBoard[stage].findIndex(c => c.id === cardId);
                if (idx !== -1) {
                    movedCard = newBoard[stage][idx];
                    newBoard[stage].splice(idx, 1);
                    break;
                }
            }
            // Add to new
            if (movedCard) {
                const updatedCard = { ...movedCard, processStage: targetStage };
                newBoard[targetStage].push(updatedCard);
            }
            return newBoard;
        });

        // API Call
        try {
            await fetch(`http://localhost:3001/api/kanban/cards/${cardId}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: targetStage, ...payload })
            });
        } catch (error) {
            console.error('Failed to move card', error);
            // Revert would go here (fetchBoard to reset)
            fetchBoard();
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        // Find source container
        let sourceStage = '';
        for (const stage in board) {
            if (board[stage].find(c => c.id === activeId)) {
                sourceStage = stage;
                break;
            }
        }

        // Find target container
        // 'over' could be a container ID or a card ID
        let targetStage = over.id as string;
        if (targetStage in board) {
            // Dropped on container
        } else {
            // Dropped on a card, find its container
            for (const stage in board) {
                if (board[stage].find(c => c.id === targetStage)) {
                    targetStage = stage;
                    break;
                }
            }
        }

        if (sourceStage === targetStage) return;

        // ** Business Logic Interception **
        if (targetStage === 'arrival') {
            setPendingMove({ cardId: activeId, overId: targetStage });
            setShowArrivalModal(true);
            return;
        }

        moveCard(activeId, targetStage);
    };

    const handleArrivalSubmit = (flightInfo: any) => {
        if (pendingMove) {
            moveCard(pendingMove.cardId, 'arrival', { flightInfo });
            setPendingMove(null);
        }
    };

    // Find active card for overlay
    let activeCard: Card | null = null;
    if (activeId) {
        for (const stage in board) {
            const found = board[stage].find(c => c.id === activeId);
            if (found) {
                activeCard = found;
                break;
            }
        }
    }

    if (loading) return <div className="p-10 text-center text-slate-400">Loading Board...</div>;

    return (
        <div className="p-4 h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Plane className="text-blue-600" />
                    Recruitment Pipeline
                </h1>

                <div className="flex gap-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Recruitment</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-200 rounded-sm"></div> Processing</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-200 rounded-sm"></div> Arrival</span>
                </div>
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
                        <Column key={stageId} id={stageId} cards={board[stageId]} />
                    ))}
                </div>

                <DragOverlay>
                    {activeCard ? <DraggableCard card={activeCard} /> : null}
                </DragOverlay>
            </DndContext>

            <ArrivalModal
                isOpen={showArrivalModal}
                onClose={() => { setShowArrivalModal(false); setPendingMove(null); }}
                onSubmit={handleArrivalSubmit}
            />
        </div>
    );
}

