"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search, Check, Building2, User } from 'lucide-react';

// Steps:
// 1. Select Employer (選擇雇主)
// 2. Select Worker (選擇移工)
// 3. Select Details (Letter + Date + Type) (選擇詳情)

export default function NewDeploymentPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Selections
    const [selectedEmployer, setSelectedEmployer] = useState<any>(null);
    const [selectedWorker, setSelectedWorker] = useState<any>(null);
    const [selectedLetter, setSelectedLetter] = useState<any>(null);

    // Form Details
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [jobType, setJobType] = useState('製造工');

    // Search States
    const [employerQuery, setEmployerQuery] = useState('');
    const [employerResults, setEmployerResults] = useState<any[]>([]);

    const [workerQuery, setWorkerQuery] = useState('');
    const [workerResults, setWorkerResults] = useState<any[]>([]);

    // Employer Details (Letters)
    const [employerLetters, setEmployerLetters] = useState<any[]>([]);

    // --- Search Employers ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (employerQuery) {
                try {
                    const res = await fetch(`http://localhost:3001/api/employers?q=${employerQuery}&limit=5`);
                    if (res.ok) {
                        const { data } = await res.json();
                        setEmployerResults(data);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setEmployerResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [employerQuery]);

    // --- Search Workers ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (workerQuery) {
                try {
                    // Filter for inactive workers (no active deployment)
                    const res = await fetch(`http://localhost:3001/api/workers?q=${workerQuery}&status=inactive&limit=5`);
                    if (res.ok) {
                        const { data } = await res.json();
                        setWorkerResults(data);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setWorkerResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [workerQuery]);

    // --- Fetch Employer Letters on Selection ---
    useEffect(() => {
        if (selectedEmployer) {
            const fetchDetails = async () => {
                try {
                    const res = await fetch(`http://localhost:3001/api/employers/${selectedEmployer.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        // Filter for valid letters (quota available, not expired)
                        const validLetters = (data.recruitmentLetters || []).filter((l: any) => {
                            const hasQuota = l.usedQuota < l.approvedQuota;
                            const notExpired = new Date(l.expiryDate) > new Date();
                            return hasQuota && notExpired;
                        });
                        setEmployerLetters(validLetters);
                        if (validLetters.length > 0) {
                            setSelectedLetter(validLetters[0]);
                        } else {
                            setSelectedLetter(null);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            fetchDetails();
        }
    }, [selectedEmployer]);

    const handleSubmit = async () => {
        if (!selectedWorker || !selectedEmployer || !selectedLetter || !startDate) {
            setError('請完整填寫所有步驟 (Please complete all steps).');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3001/api/deployments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: selectedWorker.id,
                    employerId: selectedEmployer.id,
                    recruitmentLetterId: selectedLetter.id,
                    startDate,
                    jobType
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '派工建立失敗 (Failed to create deployment)');
            }

            // Success -> Redirect to Worker Profile
            router.push(`/workers/${selectedWorker.id}`);

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">新增聘僱派工 (New Deployment)</h1>
            <p className="text-slate-500 mb-8">建立移工與雇主之間的聘僱合約關係。</p>

            {/* Progress Bar */}
            <div className="flex items-center mb-8 text-sm">
                <span className={`font-bold ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>1. 選擇雇主 (Employer)</span>
                <ChevronRight size={16} className="mx-2 text-gray-300" />
                <span className={`font-bold ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>2. 選擇移工 (Worker)</span>
                <ChevronRight size={16} className="mx-2 text-gray-300" />
                <span className={`font-bold ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>3. 聘僱詳情 (Details)</span>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-100">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow border border-slate-200 p-8">

                {/* STEP 1: Select Employer */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="text-blue-500" /> 選擇雇主 (Select Employer)
                        </h2>

                        <div>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    className="w-full border p-3 pl-10 rounded-lg outline-none focus:border-blue-500"
                                    placeholder="搜尋雇主名稱或統一編號..."
                                    value={employerQuery}
                                    onChange={e => setEmployerQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {employerResults.length > 0 && (
                                <div className="mt-2 border rounded-lg overflow-hidden divide-y">
                                    {employerResults.map(emp => (
                                        <div
                                            key={emp.id}
                                            onClick={() => { setSelectedEmployer(emp); setStep(2); }}
                                            className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition"
                                        >
                                            <div>
                                                <div className="font-bold">{emp.companyName}</div>
                                                <div className="text-sm text-gray-500">統編 (Tax ID): {emp.taxId}</div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedEmployer && (
                                <div className="mt-4 bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-700">
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold">{selectedEmployer.companyName}</div>
                                            <div className="text-sm">統編: {selectedEmployer.taxId}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(2)} className="bg-blue-600 text-white px-4 py-2 rounded">
                                        下一步 (Next)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: Select Worker */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User className="text-blue-500" /> 選擇移工 (Select Worker)
                        </h2>

                        <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded flex justify-between items-center">
                            <span>已選雇主 (Employer): {selectedEmployer?.companyName}</span>
                            <button onClick={() => setStep(1)} className="text-blue-500 hover:underline">更改 (Change)</button>
                        </div>

                        <div>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    className="w-full border p-3 pl-10 rounded-lg outline-none focus:border-blue-500"
                                    placeholder="搜尋移工姓名或護照號碼 (限未聘僱)..."
                                    value={workerQuery}
                                    onChange={e => setWorkerQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {workerResults.length > 0 && (
                                <div className="mt-2 border rounded-lg overflow-hidden divide-y">
                                    {workerResults.map(w => (
                                        <div
                                            key={w.id}
                                            onClick={() => { setSelectedWorker(w); setStep(3); }}
                                            className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition"
                                        >
                                            <div>
                                                <div className="font-bold">{w.englishName}</div>
                                                <div className="text-sm text-gray-500">{w.nationality} • {w.passports?.[0]?.passportNumber || 'No Passport'}</div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedWorker && (
                                <div className="mt-4 bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700">
                                            {selectedWorker.englishName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold">{selectedWorker.englishName}</div>
                                            <div className="text-sm">{selectedWorker.nationality}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-4 py-2 rounded">
                                        下一步 (Next)
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setStep(1)} className="text-slate-500 text-sm hover:underline mt-4">上一步 (Back)</button>
                    </div>
                )}

                {/* STEP 3: Details */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Check className="text-blue-500" /> 確認聘僱資料 (Details)
                        </h2>

                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                            <div>
                                <span className="block text-gray-500">移工 (Worker)</span>
                                <span className="font-medium">{selectedWorker?.englishName}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">雇主 (Employer)</span>
                                <span className="font-medium">{selectedEmployer?.companyName}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">選擇招募函 (Recruitment Letter)</label>
                                {employerLetters.length === 0 ? (
                                    <div className="text-red-500 text-sm p-3 bg-red-50 rounded border border-red-100">
                                        該雇主無可用招募函額度，請先新增招募函或增加名額。<br />
                                        (No valid quota available for this employer. Please add a recruitment letter first.)
                                    </div>
                                ) : (
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={selectedLetter?.id || ''}
                                        onChange={e => {
                                            const l = employerLetters.find(x => x.id === e.target.value);
                                            setSelectedLetter(l);
                                        }}
                                    >
                                        <option value="" disabled>請選擇招募函</option>
                                        {employerLetters.map(l => (
                                            <option key={l.id} value={l.id}>
                                                許可函號: {l.letterNumber} (剩餘名額: {l.approvedQuota - l.usedQuota})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">聘僱起始日 (Start Date)</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">工作類別 (Job Type)</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={jobType}
                                        onChange={e => setJobType(e.target.value)}
                                        placeholder="e.g. 製造工, 機構看護"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                            <button
                                onClick={() => setStep(2)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                            >
                                上一步 (Back)
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !selectedLetter}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '處理中...' : '確認派工 (Confirm Deployment)'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
