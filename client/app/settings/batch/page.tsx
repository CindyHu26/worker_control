"use client";

import { useState, useEffect } from 'react';
import {
    ArrowRightLeft, BadgeDollarSign, Building2,
    CheckCircle2, AlertTriangle, Play, RefreshCw, Users, Home
} from 'lucide-react';

interface Employer {
    id: string;
    companyName: string;
    agencyCompanyId?: string;
}

interface AgencyCompany {
    id: string;
    name: string;
    isDefault: boolean;
}

interface Dormitory {
    id: string;
    name: string;
}

export default function BatchOperationsPage() {
    const [activeTab, setActiveTab] = useState<'transfer' | 'fees'>('transfer');

    // Data Lists
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [agencies, setAgencies] = useState<AgencyCompany[]>([]);
    const [dormitories, setDormitories] = useState<Dormitory[]>([]);
    const [loading, setLoading] = useState(true);

    // Transfer State
    const [transferEmployerId, setTransferEmployerId] = useState('');
    const [targetAgencyId, setTargetAgencyId] = useState('');

    // Fees State
    const [feeFilterType, setFeeFilterType] = useState<'employer' | 'dormitory'>('employer');
    const [feeFilterId, setFeeFilterId] = useState('');

    const [updateServiceFee, setUpdateServiceFee] = useState(false);
    const [serviceFeeAmount, setServiceFeeAmount] = useState<number | ''>('');

    const [updateAccomFee, setUpdateAccomFee] = useState(false);
    const [accomFeeAmount, setAccomFeeAmount] = useState<number | ''>('');

    const [previewCount, setPreviewCount] = useState<number | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [empRes, agRes, dormRes] = await Promise.all([
                fetch('http://localhost:3001/api/employers'),
                fetch('http://localhost:3001/api/settings/agency-companies'),
                fetch('http://localhost:3001/api/dormitories')
            ]);

            if (empRes.ok) {
                const data = await empRes.json();
                setEmployers(data.data || []); // Assuming API returns wrapped data
            }
            if (agRes.ok) setAgencies(await agRes.json());
            if (dormRes.ok) setDormitories(await dormRes.json());

        } catch (error) {
            console.error('Failed to fetch lists', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!transferEmployerId || !targetAgencyId) {
            alert('Please select both Employer and Target Agency');
            return;
        }

        if (!window.confirm('確定要執行此移轉？\nConfirm transfer of this employer to new agency?')) return;

        try {
            const res = await fetch('http://localhost:3001/api/batch/transfer-agency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employerId: transferEmployerId,
                    newAgencyCompanyId: targetAgencyId
                })
            });

            if (res.ok) {
                alert('Transfer Successful!');
                fetchInitialData(); // Refresh to match new state
            } else {
                alert('Transfer Failed');
            }
        } catch (error) {
            console.error(error);
            alert('Transfer Error');
        }
    };

    const handleFeePreview = async () => {
        if (!feeFilterId) return;

        try {
            // Check count using dry run
            const res = await fetch('http://localhost:3001/api/batch/update-fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filterType: feeFilterType,
                    filterId: feeFilterId,
                    targetFee: 'service_fee', // Dummy for count check
                    amount: 0,
                    dryRun: true
                })
            });
            const data = await res.json();
            setPreviewCount(data.matchedDeployments);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFeeUpdate = async () => {
        if (!feeFilterId) {
            alert('Select a filter target');
            return;
        }
        if (!updateServiceFee && !updateAccomFee) {
            alert('Select at least one fee to update');
            return;
        }

        if (!window.confirm(`即將更新 ${previewCount !== null ? previewCount : '?'} 筆資料。\n此操作無法復原，確定執行？`)) return;

        try {
            let updatedTotal = 0;

            if (updateServiceFee && serviceFeeAmount !== '') {
                const res = await fetch('http://localhost:3001/api/batch/update-fees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filterType: feeFilterType,
                        filterId: feeFilterId,
                        targetFee: 'service_fee',
                        amount: Number(serviceFeeAmount)
                    })
                });
                const d = await res.json();
                updatedTotal += d.updatedRecords || 0;
            }

            if (updateAccomFee && accomFeeAmount !== '') {
                const res = await fetch('http://localhost:3001/api/batch/update-fees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filterType: feeFilterType,
                        filterId: feeFilterId,
                        targetFee: 'accommodation_fee',
                        amount: Number(accomFeeAmount)
                    })
                });
                const d = await res.json();
                updatedTotal += d.updatedRecords || 0; // Note: might double count if same records updated twice
            }

            alert(`Batch Update Complete! processed records.`);
            setPreviewCount(null); // Reset

        } catch (error) {
            console.error(error);
            alert('Update Failed');
        }
    };

    // Filtered lists
    const currentEmployer = employers.find(e => e.id === transferEmployerId);
    const currentAgency = agencies.find(a => a.id === currentEmployer?.agencyCompanyId);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <RefreshCw className="text-blue-600" />
                    批次作業中心 (Batch Operations)
                </h1>
                <p className="text-gray-500 mt-2">高風險操作區：案件移轉與費用批量調整</p>
            </header>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('transfer')}
                        className={`flex-1 py-4 text-center font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'transfer' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <ArrowRightLeft size={20} />
                        案件移轉 (Entity Transfer)
                    </button>
                    <button
                        onClick={() => setActiveTab('fees')}
                        className={`flex-1 py-4 text-center font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'fees' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <BadgeDollarSign size={20} />
                        費用批次調漲/降 (Bulk Fee Adjustment)
                    </button>
                </div>

                <div className="p-8">
                    {/* TAB 1: Transfer */}
                    {activeTab === 'transfer' && (
                        <div className="space-y-8 max-w-2xl mx-auto">
                            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 text-blue-800 text-sm">
                                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                                <p>Changing an Employer's Agency Company will update the letterhead for ALL future generated documents. Past documents are unaffected.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Employer</label>
                                    <select
                                        className="w-full border rounded-lg max-h-60"
                                        value={transferEmployerId}
                                        onChange={e => setTransferEmployerId(e.target.value)}
                                    >
                                        <option value="">-- Choose Employer --</option>
                                        {employers.map(e => (
                                            <option key={e.id} value={e.id}>{e.companyName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Visual Flow */}
                                <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <div className="text-center w-1/3">
                                        <div className="text-xs text-gray-500 mb-1">Current Agency</div>
                                        <div className="font-bold text-gray-800 line-clamp-2">
                                            {currentAgency ? currentAgency.name : (currentEmployer ? 'Default Agency' : '-')}
                                        </div>
                                    </div>
                                    <ArrowRightLeft className="text-gray-400" />
                                    <div className="text-center w-1/3">
                                        <div className="text-xs text-gray-500 mb-1">New Agency</div>
                                        <div className="font-bold text-blue-600 line-clamp-2">
                                            {agencies.find(a => a.id === targetAgencyId)?.name || 'Select Target...'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select New Agency Company</label>
                                    <select
                                        className="w-full border rounded-lg"
                                        value={targetAgencyId}
                                        onChange={e => setTargetAgencyId(e.target.value)}
                                    >
                                        <option value="">-- Choose New Agency --</option>
                                        {agencies.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.name} {a.isDefault ? '(Default)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleTransfer}
                                    disabled={!transferEmployerId || !targetAgencyId}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Confirm Transfer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Fees */}
                    {activeTab === 'fees' && (
                        <div className="space-y-8 max-w-2xl mx-auto">
                            <div className="bg-orange-50 p-4 rounded-lg flex items-start gap-3 text-orange-800 text-sm">
                                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                                <p>Updates will apply to all <b>ACTIVE</b> deployments matching the criteria. This overwrites existing contract fee settings.</p>
                            </div>

                            {/* Filter Section */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-800 border-b pb-2">1. Select Target Group</h3>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${feeFilterType === 'employer' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>
                                        <input type="radio" name="filterType" checked={feeFilterType === 'employer'} onChange={() => { setFeeFilterType('employer'); setFeeFilterId(''); setPreviewCount(null); }} className="hidden" />
                                        <Users size={18} /> By Employer
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${feeFilterType === 'dormitory' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>
                                        <input type="radio" name="filterType" checked={feeFilterType === 'dormitory'} onChange={() => { setFeeFilterType('dormitory'); setFeeFilterId(''); setPreviewCount(null); }} className="hidden" />
                                        <Home size={18} /> By Dormitory
                                    </label>
                                </div>

                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={feeFilterId}
                                    onChange={e => { setFeeFilterId(e.target.value); setPreviewCount(null); }}
                                >
                                    <option value="">-- Select {feeFilterType === 'employer' ? 'Employer' : 'Dormitory'} --</option>
                                    {feeFilterType === 'employer' ? (
                                        employers.map(e => <option key={e.id} value={e.id}>{e.companyName}</option>)
                                    ) : (
                                        dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                                    )}
                                </select>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleFeePreview}
                                        disabled={!feeFilterId}
                                        className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
                                    >
                                        Check Impacted Count
                                    </button>
                                </div>
                                {previewCount !== null && (
                                    <div className="bg-gray-100 p-3 rounded text-center font-bold text-gray-700 animate-in fade-in">
                                        預計更新人數: {previewCount} 人
                                    </div>
                                )}
                            </div>

                            {/* Update Section */}
                            <div className="space-y-4 pt-4">
                                <h3 className="font-bold text-gray-800 border-b pb-2">2. Set New Fees</h3>

                                <div className={`p-4 rounded-lg border transition-all ${updateServiceFee ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="chkService" checked={updateServiceFee} onChange={e => setUpdateServiceFee(e.target.checked)} className="w-5 h-5" />
                                        <label htmlFor="chkService" className="font-bold text-gray-800">調整服務費 (Service Fee)</label>
                                    </div>
                                    {updateServiceFee && (
                                        <div className="ml-7">
                                            <input type="number" placeholder="New Amount (e.g. 1500)" className="w-full border p-2 rounded"
                                                value={serviceFeeAmount} onChange={e => setServiceFeeAmount(Number(e.target.value))} />
                                            <p className="text-xs text-gray-500 mt-1">*Updates Year 1, 2, and 3 to this amount.</p>
                                        </div>
                                    )}
                                </div>

                                <div className={`p-4 rounded-lg border transition-all ${updateAccomFee ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="chkAccom" checked={updateAccomFee} onChange={e => setUpdateAccomFee(e.target.checked)} className="w-5 h-5" />
                                        <label htmlFor="chkAccom" className="font-bold text-gray-800">調整膳宿費 (Accommodation Fee)</label>
                                    </div>
                                    {updateAccomFee && (
                                        <div className="ml-7">
                                            <input type="number" placeholder="New Amount (e.g. 2500)" className="w-full border p-2 rounded"
                                                value={accomFeeAmount} onChange={e => setAccomFeeAmount(Number(e.target.value))} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleFeeUpdate}
                                disabled={!previewCount || (!updateServiceFee && !updateAccomFee)}
                                className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                            >
                                <Play size={20} />
                                執行批次更新 (Execute)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
