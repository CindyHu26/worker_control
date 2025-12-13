import React from 'react';
import { FileText, Download, Briefcase, X } from 'lucide-react';

interface BatchActionsBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onGenerateDocuments: () => void;
    onExportCsv: () => void;
    onUpdateStatus: () => void;
}

export default function BatchActionsBar({
    selectedCount,
    onClearSelection,
    onGenerateDocuments,
    onExportCsv,
    onUpdateStatus
}: BatchActionsBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-6 animate-in slide-in-from-bottom-5 z-50">
            <div className="flex items-center gap-3 border-r border-slate-700 pr-4">
                <span className="font-bold whitespace-nowrap">{selectedCount} Selected</span>
                <button
                    onClick={onClearSelection}
                    className="p-1 hover:bg-slate-800 rounded-full transition"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onGenerateDocuments}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition"
                >
                    <FileText size={18} />
                    <span className="text-sm font-medium">Generate Docs</span>
                </button>

                <button
                    onClick={onExportCsv}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition"
                >
                    <Download size={18} />
                    <span className="text-sm font-medium">Export CSV</span>
                </button>

                <button
                    onClick={onUpdateStatus}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition"
                >
                    <Briefcase size={18} />
                    <span className="text-sm font-medium">Update Status</span>
                </button>
            </div>
        </div>
    );
}
