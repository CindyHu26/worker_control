"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Plus, ChevronDown, ChevronRight, Briefcase, Calendar } from 'lucide-react';

interface EntryPermit {
    id: String;
    permitNumber: string;
    issueDate: string;
    expiryDate: string;
    quota: number;
    usedCount: number;
    _count?: { deployments: number };
}

interface RecruitmentLetter {
    id: string;
    letterNumber: string;
    issueDate: string;
    expiryDate: string;
    approvedQuota: number;
    usedQuota: number; // DB field
    calculatedUsedQuota?: number; // From API math
    entryPermits: EntryPermit[];
}

export default function EmployerRecruitmentPage() {
    const params = useParams();
    const router = useRouter();
    const employerId = params.id as string;

    const [letters, setLetters] = useState<RecruitmentLetter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedLetterId, setExpandedLetterId] = useState<string | null>(null);

    // Modal States
    const [showLetterModal, setShowLetterModal] = useState(false);
    const [showPermitModal, setShowPermitModal] = useState(false);
    const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);

    // Forms
    const [letterForm, setLetterForm] = useState({ letterNumber: '', issueDate: '', expiryDate: '', approvedQuota: '' });
    const [permitForm, setPermitForm] = useState({ permitNumber: '', issueDate: '', expiryDate: '', quota: '' });

    useEffect(() => {
        fetchLetters();
    }, [employerId]);

    const fetchLetters = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/recruitment/letters?employerId=${employerId}`);
            if (res.ok) {
                const data = await res.json();
                setLetters(data);
                if (data.length > 0) setExpandedLetterId(data[0].id); // Auto expand first
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLetter = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/recruitment/letters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employerId, ...letterForm })
            });
            if (res.ok) {
                setShowLetterModal(false);
                setLetterForm({ letterNumber: '', issueDate: '', expiryDate: '', approvedQuota: '' });
                fetchLetters();
            } else {
                alert('Failed to create letter');
            }
        } catch (err) {
            alert('Error creating letter');
        }
    };

    const handleCreatePermit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLetterId) return;
        try {
            const res = await fetch(`/api/recruitment/letters/${selectedLetterId}/permits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(permitForm)
            });
            if (res.ok) {
                setShowPermitModal(false);
                setPermitForm({ permitNumber: '', issueDate: '', expiryDate: '', quota: '' });
                fetchLetters();
            } else {
                const err = await res.json();
                alert('Failed: ' + err.error);
            }
        } catch (err) {
            alert('Error creating permit');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedLetterId(expandedLetterId === id ? null : id);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <button onClick={() => router.back()} className="text-slate-500 hover:text-blue-600 mb-2 text-sm flex items-center gap-1">
                        ← Back to Employer
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="text-blue-600" /> 招募函管理 (Recruitment Documents)
                    </h1>
                    <p className="text-slate-500 mt-1">Manage Recruitment Letters and Entry Permits</p>
                </div>
                <button
                    onClick={() => setShowLetterModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm font-medium"
                >
                    <Plus size={18} /> Add Recruitment Letter
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-slate-400">Loading authorized documents...</div>
            ) : (
                <div className="space-y-6">
                    {letters.length === 0 && (
                        <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-600">No Recruitment Letters</h3>
                            <button onClick={() => setShowLetterModal(true)} className="text-blue-600 font-bold mt-2 hover:underline">Create One</button>
                        </div>
                    )}

                    {letters.map(letter => {
                        const isExpanded = expandedLetterId === letter.id;
                        const usedPercentage = Math.round((letter.calculatedUsedQuota || 0) / letter.approvedQuota * 100);

                        return (
                            <div key={letter.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
                                {/* Header / Summary Row */}
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                    onClick={() => toggleExpand(letter.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{letter.letterNumber}</h3>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><Calendar size={14} /> Issued: {new Date(letter.issueDate).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1">Expires: {new Date(letter.expiryDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Quota Usage</p>
                                            <div className="flex items-end gap-2">
                                                <span className={`text-xl font-bold ${usedPercentage >= 100 ? 'text-red-500' : 'text-blue-600'}`}>
                                                    {letter.calculatedUsedQuota}
                                                </span>
                                                <span className="text-slate-400 text-sm mb-1">/ {letter.approvedQuota}</span>
                                            </div>
                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${usedPercentage >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        {isExpanded ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded Content: Entry Permits */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Entry Permits (Batches)</h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedLetterId(letter.id); setShowPermitModal(true); }}
                                                className="text-xs bg-white border border-slate-300 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-md font-medium transition"
                                            >
                                                + Add Entry Permit
                                            </button>
                                        </div>

                                        {letter.entryPermits.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic ml-2">No entry permits issued yet.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {letter.entryPermits.map(permit => (
                                                    <div key={permit.id as any} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h5 className="font-bold text-slate-800">{permit.permitNumber}</h5>
                                                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Batch</span>
                                                        </div>
                                                        <div className="space-y-1 text-xs text-slate-500">
                                                            <p>Issued: {new Date(permit.issueDate).toLocaleDateString()}</p>
                                                            <p>Expires: {new Date(permit.expiryDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[10px] uppercase font-bold text-slate-400">Workers</p>
                                                                <p className="font-bold text-slate-700 text-lg">{permit.usedCount} <span className="text-slate-400 text-sm font-normal">/ {permit.quota}</span></p>
                                                            </div>
                                                            {/* We could add link to see connected workers here */}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Letter Modal */}
            {showLetterModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">New Recruitment Letter</h3>
                        <form onSubmit={handleCreateLetter} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Letter Number (函號)</label>
                                <input required className="w-full border p-2 rounded" value={letterForm.letterNumber} onChange={e => setLetterForm({ ...letterForm, letterNumber: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Issue Date</label>
                                    <input required type="date" className="w-full border p-2 rounded" value={letterForm.issueDate} onChange={e => setLetterForm({ ...letterForm, issueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                    <input required type="date" className="w-full border p-2 rounded" value={letterForm.expiryDate} onChange={e => setLetterForm({ ...letterForm, expiryDate: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Approved Quota (核定名額)</label>
                                <input required type="number" className="w-full border p-2 rounded" value={letterForm.approvedQuota} onChange={e => setLetterForm({ ...letterForm, approvedQuota: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowLetterModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permit Modal */}
            {showPermitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">New Entry Permit (Batch)</h3>
                        <form onSubmit={handleCreatePermit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Permit Number (核准函號)</label>
                                <input required className="w-full border p-2 rounded" value={permitForm.permitNumber} onChange={e => setPermitForm({ ...permitForm, permitNumber: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Issue Date</label>
                                    <input required type="date" className="w-full border p-2 rounded" value={permitForm.issueDate} onChange={e => setPermitForm({ ...permitForm, issueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                    <input required type="date" className="w-full border p-2 rounded" value={permitForm.expiryDate} onChange={e => setPermitForm({ ...permitForm, expiryDate: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Batch Quota (引進名額)</label>
                                <input required type="number" className="w-full border p-2 rounded" value={permitForm.quota} onChange={e => setPermitForm({ ...permitForm, quota: e.target.value })} />
                                <p className="text-xs text-slate-500 mt-1">Cannot exceed remaining Recruitment Letter quota.</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowPermitModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create Permit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
