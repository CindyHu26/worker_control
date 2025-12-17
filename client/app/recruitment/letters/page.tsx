"use client";

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// --- Types ---
type EntryPermit = {
    id: string;
    permitNumber: string; // Permit No (文號)
    issueDate: string;
    expiryDate: string;
    workerCount: number;
    receiptNo?: string;
    applicationDate?: string;
    feeAmount?: number;
    trNumber?: string;
    attachmentPath?: string;
    _count?: { deployments: number };
};

type RecruitmentLetter = {
    id: string;
    employer: { companyName: string; companyNameEn: string | null };
    letterNumber: string;
    issueDate: string;
    expiryDate: string;
    approvedQuota: number;
    usedQuota: number;
    revokedQuota: number;
    entryPermits: EntryPermit[];
    calculatedUsedQuota: number; // from backend logic
};

// --- Schema for Form ---
const entryPermitSchema = z.object({
    permitNumber: z.string().min(1, "Permit Number is required"),
    issueDate: z.string().min(1, "Issue Date is required"),
    expiryDate: z.string().min(1, "Expiry Date is required"),
    workerCount: z.coerce.number().min(1, "At least 1 worker"),
    receiptNo: z.string().optional(),
    applicationDate: z.string().optional(),
    feeAmount: z.coerce.number().optional(),
    trNumber: z.string().optional(),
    attachmentPath: z.string().optional(),
});

type EntryPermitFormData = z.infer<typeof entryPermitSchema>;

export default function RecruitmentLettersPage() {
    const [letters, setLetters] = useState<RecruitmentLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLetter, setSelectedLetter] = useState<RecruitmentLetter | null>(null); // For modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<EntryPermitFormData>({
        resolver: zodResolver(entryPermitSchema) as any,
        defaultValues: {
            workerCount: 1,
            feeAmount: 100 // Default fee?
        }
    });

    const fetchLetters = async () => {
        try {
            const token = Cookies.get('token');
            const res = await fetch('/api/recruitment/letters', {
                headers: { 'Authorization': `Bearer ${token}` }
            }); // Fetches all
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setLetters(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLetters();
    }, []);

    const openAddPermitModal = (letter: RecruitmentLetter) => {
        setSelectedLetter(letter);
        reset(); // Clear form
        setIsModalOpen(true);
    };

    const onSubmit = async (data: EntryPermitFormData) => {
        if (!selectedLetter) return;

        try {
            const token = Cookies.get('token');
            const res = await fetch(`/api/recruitment/letters/${selectedLetter.id}/permits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    workerCount: Number(data.workerCount), // Ensure number
                    feeAmount: data.feeAmount ? Number(data.feeAmount) : 0
                })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.error}`);
                return;
            }

            // Success
            setIsModalOpen(false);
            fetchLetters(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Failed to submit');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Recruitment Documents (招募函 & 入國引進許可)</h1>
                <p className="text-gray-500 text-sm">Manage Employer Recruitment Letters and register Entry Permits.</p>
            </header>

            <div className="space-y-6">
                {letters.map(letter => (
                    <div key={letter.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Letter Header */}
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">{letter.employer.companyName}</h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                        {letter.letterNumber}
                                    </span>
                                    <span>Issued: {new Date(letter.issueDate).toLocaleDateString()}</span>
                                    <span>Expires: {new Date(letter.expiryDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Quota Usage</div>
                                <div className="text-xl font-bold text-gray-800">
                                    <span className={letter.calculatedUsedQuota > letter.approvedQuota ? "text-red-600" : "text-green-600"}>
                                        {letter.calculatedUsedQuota}
                                    </span>
                                    <span className="text-gray-400 mx-1">/</span>
                                    {letter.approvedQuota}
                                </div>
                            </div>
                        </div>

                        {/* Entry Permits List */}
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Entry Permits (入國引進許可)</h4>
                                <button
                                    onClick={() => openAddPermitModal(letter)}
                                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors"
                                >
                                    + Register Permit
                                </button>
                            </div>

                            {letter.entryPermits.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No entry permits registered yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                            <tr>
                                                <th className="py-2 px-3">Permit No</th>
                                                <th className="py-2 px-3">Issue Date</th>
                                                <th className="py-2 px-3">Workers</th>
                                                <th className="py-2 px-3">Application Info</th>
                                                <th className="py-2 px-3">Used</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {letter.entryPermits.map(permit => (
                                                <tr key={permit.id} className="hover:bg-gray-50">
                                                    <td className="py-2 px-3 font-medium text-gray-800">{permit.permitNumber}</td>
                                                    <td className="py-2 px-3 text-gray-600">{new Date(permit.issueDate).toLocaleDateString()}</td>
                                                    <td className="py-2 px-3 text-gray-800">{permit.workerCount}</td>
                                                    <td className="py-2 px-3 text-gray-500 text-xs">
                                                        {permit.receiptNo && <div>Receipt: {permit.receiptNo}</div>}
                                                        {permit.applicationDate && <div>App Date: {new Date(permit.applicationDate).toLocaleDateString()}</div>}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-600">
                                                        {permit._count?.deployments || 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && selectedLetter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg">New Entry Permit</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-4">
                                Adding permit for <strong>{selectedLetter.letterNumber}</strong> ({selectedLetter.employer.companyName})
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Permit No (文號)</label>
                                    <input {...register("permitNumber")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="勞動發事字第..." />
                                    {errors.permitNumber && <p className="text-red-500 text-xs">{errors.permitNumber.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Worker Count (人數)</label>
                                    <input type="number" {...register("workerCount")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    {errors.workerCount && <p className="text-red-500 text-xs">{errors.workerCount.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Issue Date (發文日)</label>
                                    <input type="date" {...register("issueDate")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    {errors.issueDate && <p className="text-red-500 text-xs">{errors.issueDate.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Expiry Date (有效期限)</label>
                                    <input type="date" {...register("expiryDate")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    {errors.expiryDate && <p className="text-red-500 text-xs">{errors.expiryDate.message}</p>}
                                </div>
                            </div>

                            <hr className="border-gray-100" />
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Application Tracking (Optional)</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Receipt No (收文號)</label>
                                    <input {...register("receiptNo")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">App Date (送件日)</label>
                                    <input type="date" {...register("applicationDate")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">Fee Amount (規費)</label>
                                    <input type="number" {...register("feeAmount")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600 uppercase">TR Number (收據號)</label>
                                    <input {...register("trNumber")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors">Create Permit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
