import { useState, useEffect } from 'react';
import { User, Save, X, Phone, MapPin, Calendar, CreditCard, Droplet, Ruler, FileText, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IdentityTabProps {
    worker: any;
    onUpdate: (data: any) => Promise<void>;
}

export default function IdentityTab({ worker, onUpdate }: IdentityTabProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...worker });
    const [isLoading, setIsLoading] = useState(false);

    // Renewal Modal State
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewType, setRenewType] = useState<'passport' | 'arc'>('passport');
    const [renewData, setRenewData] = useState({
        newNumber: '',
        issueDate: '',
        expiryDate: ''
    });

    // Helpers
    const calculateAge = (dob: string) => {
        if (!dob) return '-';
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onUpdate(formData);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert('更新失敗');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/workers/${worker.id}/documents/renew`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: renewType,
                    ...renewData
                })
            });
            if (!res.ok) throw new Error('Renewal failed');
            alert('Renewal Successful');
            setShowRenewModal(false);
            window.location.reload(); // Simple reload to refresh data
        } catch (error) {
            alert('Failed to renew document');
        }
    };

    // Get Active Documents
    const currentPassport = worker.passports?.find((p: any) => p.isCurrent) || worker.passports?.[0]; // Fallback if no current marked
    const currentArc = worker.arcs?.find((a: any) => a.isCurrent) || worker.arcs?.[0];

    const passportHistory = worker.passports?.filter((p: any) => p.id !== currentPassport?.id) || [];
    const arcHistory = worker.arcs?.filter((a: any) => a.id !== currentArc?.id) || [];

    return (
        <div className="space-y-8">
            {/* 1. Official Documents Section */}
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4 mb-6">
                    <FileText className="text-red-600" /> 證件管理 (Official Documents)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Passport Card */}
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden relative group">
                        <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex justify-between items-center">
                            <span className="font-bold text-red-800">護照 (Passport)</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${currentPassport?.isCurrent ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                {currentPassport?.isCurrent ? 'Current' : 'Expired'}
                            </span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase">Passport No</label>
                                <p className="text-xl font-mono font-bold tracking-wide text-slate-900">{currentPassport?.passportNumber || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Issue Date</label>
                                    <p>{currentPassport?.issueDate ? new Date(currentPassport.issueDate).toLocaleDateString() : '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Expiry Date</label>
                                    <p className={new Date(currentPassport?.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                                        {currentPassport?.expiryDate ? new Date(currentPassport.expiryDate).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 flex justify-end gap-2 border-t">
                            <button
                                onClick={() => { setRenewType('passport'); setShowRenewModal(true); }}
                                className="text-sm bg-white border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 text-slate-700"
                            >
                                Renew (換發)
                            </button>
                        </div>
                    </div>

                    {/* ARC Card */}
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden relative group">
                        <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                            <span className="font-bold text-blue-800">居留證 (ARC)</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${currentArc?.isCurrent ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                {currentArc?.isCurrent ? 'Current' : 'Expired'}
                            </span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase">ARC No</label>
                                <p className="text-xl font-mono font-bold tracking-wide text-slate-900">{currentArc?.arcNumber || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Issue Date</label>
                                    <p>{currentArc?.issueDate ? new Date(currentArc.issueDate).toLocaleDateString() : '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase">Expiry Date</label>
                                    <p className={new Date(currentArc?.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                                        {currentArc?.expiryDate ? new Date(currentArc.expiryDate).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 flex justify-end gap-2 border-t">
                            <button
                                onClick={() => { setRenewType('arc'); setShowRenewModal(true); }}
                                className="text-sm bg-white border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 text-slate-700"
                            >
                                Renew (換發)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Document History Table */}
                {(passportHistory.length > 0 || arcHistory.length > 0) && (
                    <div className="mt-8">
                        <h4 className="font-bold text-slate-600 mb-4 flex items-center gap-2">
                            <Clock size={16} /> 歷史證件紀錄 (Document History)
                        </h4>
                        <div className="bg-white border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 border-b">
                                    <tr>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2">Number</th>
                                        <th className="px-4 py-2">Issue Date</th>
                                        <th className="px-4 py-2">Expiry Date</th>
                                        <th className="px-4 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {passportHistory.map((h: any) => (
                                        <tr key={h.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 text-slate-500">Passport</td>
                                            <td className="px-4 py-2 font-mono">{h.passportNumber}</td>
                                            <td className="px-4 py-2">{new Date(h.issueDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{new Date(h.expiryDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2"><span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">Expired</span></td>
                                        </tr>
                                    ))}
                                    {arcHistory.map((h: any) => (
                                        <tr key={h.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 text-slate-500">ARC</td>
                                            <td className="px-4 py-2 font-mono">{h.arcNumber}</td>
                                            <td className="px-4 py-2">{new Date(h.issueDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{new Date(h.expiryDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2"><span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">Expired</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Basic Info Section (Existing Logic) */}
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4 mb-6">
                    <User className="text-blue-600" /> 基本資料 (Identity)
                    <div className="ml-auto flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => { setIsEditing(false); setFormData({ ...worker }); }}
                                    className="px-3 py-1 text-sm rounded border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                                >
                                    <X size={14} /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 font-bold shadow-sm"
                                >
                                    <Save size={14} /> Save
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1 text-sm rounded bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium shadow-sm transition"
                            >
                                Edit Info
                            </button>
                        )}
                    </div>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Information Columns ... (Simplified for this file content) */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">English Name</label>
                                {isEditing ? <input name="englishName" value={formData.englishName} onChange={handleChange} className="w-full border p-2 rounded" /> : <p className="font-bold">{worker.englishName}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Chinese Name</label>
                                {isEditing ? <input name="chineseName" value={formData.chineseName} onChange={handleChange} className="w-full border p-2 rounded" /> : <p>{worker.chineseName}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Nationality</label>
                                {isEditing ? (
                                    <select name="nationality" value={formData.nationality} onChange={handleChange} className="w-full border p-2 rounded">
                                        <option value="ID">Indonesia</option>
                                        <option value="VN">Vietnam</option>
                                        <option value="PH">Philippines</option>
                                        <option value="TH">Thailand</option>
                                    </select>
                                ) : <p>{worker.nationality}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">DOB / Age</label>
                                {isEditing ? <input type="date" name="dob" value={formData.dob?.split('T')[0]} onChange={handleChange} className="w-full border p-2 rounded" /> : <p>{new Date(worker.dob).toLocaleDateString()} ({calculateAge(worker.dob)} yrs)</p>}
                            </div>
                        </div>
                    </div>
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Phone</label>
                                {isEditing ? <input name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} className="w-full border p-2 rounded" /> : <p>{worker.mobilePhone}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Foreign Address</label>
                                {isEditing ? <textarea name="foreignAddress" value={formData.foreignAddress} onChange={handleChange} className="w-full border p-2 rounded" /> : <p>{worker.foreignAddress}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Renewal Modal */}
            {showRenewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
                        <h4 className="text-lg font-bold mb-4">
                            換發{renewType === 'passport' ? '護照' : '居留證'} (Renew {renewType === 'passport' ? 'Passport' : 'ARC'})
                        </h4>
                        <form onSubmit={handleRenewSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">New Number</label>
                                <input
                                    required
                                    className="w-full border p-2 rounded uppercase font-mono"
                                    value={renewData.newNumber}
                                    onChange={e => setRenewData({ ...renewData, newNumber: e.target.value })}
                                    placeholder={renewType === 'passport' ? 'Ex. N98765432' : 'Ex. AB98765432'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Issue Date</label>
                                <input
                                    type="date" required
                                    className="w-full border p-2 rounded"
                                    value={renewData.issueDate}
                                    onChange={e => setRenewData({ ...renewData, issueDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                <input
                                    type="date" required
                                    className="w-full border p-2 rounded"
                                    value={renewData.expiryDate}
                                    onChange={e => setRenewData({ ...renewData, expiryDate: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowRenewModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirm Renewal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
