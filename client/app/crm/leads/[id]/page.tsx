"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, MapPin, User, ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';

type Lead = {
    id: string;
    companyName: string | null;
    contactPerson: string | null;
    jobTitle: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    address: string | null;
    status: string;
    source: string | null;
    assignedTo: string | null;
    nextFollowUpDate: string | null;
    interactions: Interaction[];
};

type Interaction = {
    id: string;
    type: string;
    summary: string;
    detailedNotes: string | null;
    date: string;
    outcome: string | null;
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const router = useRouter();

    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    // Interaction Form State
    const [newType, setNewType] = useState('Call');
    const [newSummary, setNewSummary] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [nextFollowUp, setNextFollowUp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchLead();
    }, [id]);

    const fetchLead = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/leads/${id}`);
            if (res.ok) {
                const data = await res.json();
                setLead(data);
            } else {
                alert('Failed to load lead');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInteraction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`http://localhost:3001/api/leads/${id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newType,
                    summary: newSummary,
                    detailedNotes: newNotes,
                    nextFollowUpDate: nextFollowUp || null
                })
            });

            if (res.ok) {
                // Refresh
                setNewSummary('');
                setNewNotes('');
                setNextFollowUp('');
                fetchLead();
            }
        } catch (error) {
            alert('Error adding interaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConvert = async () => {
        if (!confirm('Are you sure you want to convert this lead to a formal Employer?')) return;

        try {
            const res = await fetch(`http://localhost:3001/api/leads/${id}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operatorId: 'CURRENT_USER_ID' }) // Should be handled by context/auth
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/employers/${data.employer.id}`);
            } else {
                const err = await res.json();
                alert('Conversion failed: ' + err.error);
            }
        } catch (error) {
            alert('Conversion error');
        }
    };

    const handleMarkLost = async () => {
        const reason = prompt("Please enter reason for loss:");
        if (!reason) return;

        try {
            await fetch(`http://localhost:3001/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'LOST', outcome: reason }) // Depending on if we added outcome field to Lead? We have interactions.
                // Assuming status update is enough. We can add interaction for "Marked as Lost".
            });
            // Also add an interaction?
            await fetch(`http://localhost:3001/api/leads/${id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'System',
                    summary: 'Marked as Lost',
                    detailedNotes: reason
                })
            });
            fetchLead();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-10">Loading...</div>;
    if (!lead) return <div className="p-10">Lead not found</div>;

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{lead.companyName || "Unnamed Lead"}</h1>
                        <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase font-bold">
                            {lead.status}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {lead.status !== 'WON' && lead.status !== 'LOST' && (
                        <>
                            <button
                                onClick={handleConvert}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                <CheckCircle size={18} /> Convert to Employer
                            </button>
                            <button
                                onClick={handleMarkLost}
                                className="flex items-center gap-2 bg-slate-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 border border-slate-200"
                            >
                                <XCircle size={18} /> Mark Lost
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left: Info Pannel */}
                <div className="col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <User size={18} /> Contact Info
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold">Contact Person</label>
                            <div className="text-slate-800 font-medium">{lead.contactPerson || '-'}</div>
                            <div className="text-xs text-slate-500">{lead.jobTitle}</div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone size={16} className="text-slate-400 mt-1" />
                            <div>
                                <div className="text-sm font-medium">{lead.mobile || '-'}</div>
                                <div className="text-xs text-slate-500">{lead.phone || '-'}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-slate-400" />
                            <div className="text-sm">{lead.email || '-'}</div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-slate-400 mt-1" />
                            <div className="text-sm">{lead.address || '-'}</div>
                        </div>

                        <hr className="my-4" />

                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold">Next Follow Up</label>
                            <div className="text-slate-800 font-medium text-lg">
                                {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'Not Set'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Activity Timeline */}
                <div className="col-span-8 space-y-6">
                    {/* Add Interaction Box */}
                    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4">Log Activity</h3>
                        <form onSubmit={handleAddInteraction} className="space-y-3">
                            <div className="flex gap-4">
                                <select
                                    className="p-2 border border-slate-300 rounded-lg text-sm w-32"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                >
                                    <option value="Call">Phone Call</option>
                                    <option value="Visit">Site Visit</option>
                                    <option value="Email">Email</option>
                                    <option value="Line">LINE</option>
                                    <option value="Meeting">Meeting</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Short summary (e.g. Discussed pricing)"
                                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
                                    value={newSummary}
                                    onChange={(e) => setNewSummary(e.target.value)}
                                    required
                                />
                            </div>
                            <textarea
                                placeholder="Detailed notes..."
                                className="w-full p-2 border border-slate-300 rounded-lg text-sm h-20"
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.target.value)}
                            />
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span>Next Follow Up:</span>
                                    <input
                                        type="date"
                                        className="p-1 border border-slate-300 rounded"
                                        value={nextFollowUp}
                                        onChange={(e) => setNextFollowUp(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send size={14} /> Log Activity
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-500 uppercase text-xs">Past Activities</h3>
                        {lead.interactions.length === 0 && (
                            <div className="text-center text-slate-400 py-10">No activities recorded yet.</div>
                        )}
                        {lead.interactions.map(interaction => (
                            <div key={interaction.id} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${interaction.type === 'Call' ? 'bg-green-100 text-green-600' :
                                        interaction.type === 'Visit' ? 'bg-purple-100 text-purple-600' :
                                            'bg-slate-100 text-slate-600'
                                    }`}>
                                    {interaction.type === 'Call' ? <Phone size={18} /> :
                                        interaction.type === 'Visit' ? <MapPin size={18} /> :
                                            <Mail size={18} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800">{interaction.type} - {interaction.summary}</h4>
                                        <span className="text-xs text-slate-400">{new Date(interaction.date).toLocaleString()}</span>
                                    </div>
                                    {interaction.detailedNotes && (
                                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{interaction.detailedNotes}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
