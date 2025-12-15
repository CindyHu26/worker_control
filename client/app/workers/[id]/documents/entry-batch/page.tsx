"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText, Download, CheckSquare, Square, Save, Loader2, Building, Home, MapPin } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    description?: string;
}

interface GenerateResult {
    zipUrl: string;
    files: { name: string; url: string }[];
}

export default function EntryBatchPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

    // Global Context Form State
    const [globalParams, setGlobalParams] = useState({
        entryDate: '',
        medCheckDate: '',
        dispatchDate: new Date().toISOString().split('T')[0], // Default today
        addressOption: 'FACTORY', // FACTORY, EMPLOYER_HOME, COMPANY, AGENCY
        hospitalName: '',
        agentName: ''
    });

    const [result, setResult] = useState<GenerateResult | null>(null);

    // Fetch Templates (Category: entry)
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/documents/templates?category=entry');
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data);
                    // Pre-select all by default? Or none? Let's select all for convenience.
                    setSelectedTemplates(new Set(data.map((t: Template) => t.id)));
                }
            } catch (error) {
                console.error('Failed to fetch templates', error);
            }
        };
        fetchTemplates();
    }, []);

    const toggleTemplate = (id: string) => {
        const newSet = new Set(selectedTemplates);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTemplates(newSet);
    };

    const handleGenerate = async () => {
        if (selectedTemplates.size === 0) return alert('Please select at least one document.');

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('http://localhost:3001/api/documents/batch-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: params.id,
                    templateIds: Array.from(selectedTemplates),
                    globalParams
                })
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                const err = await res.json();
                alert(`Generation failed: ${err.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate documents.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={`/workers/${params.id}`}
                    className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500"
                >
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">入境文件批次生成中心</h1>
                    <p className="text-slate-500">快速設定參數並生成整套入境文件</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Global Parameters */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Date Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            日期設定
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">入境日期 (Entry Date)</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    value={globalParams.entryDate}
                                    onChange={e => setGlobalParams({ ...globalParams, entryDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">體檢日期 (Med Check)</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    value={globalParams.medCheckDate}
                                    onChange={e => setGlobalParams({ ...globalParams, medCheckDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">發文日期 (Dispatch)</label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    value={globalParams.dispatchDate}
                                    onChange={e => setGlobalParams({ ...globalParams, dispatchDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Resolver */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-amber-600" />
                            居留地址設定
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                                <input
                                    type="radio" name="addressOption" value="FACTORY"
                                    checked={globalParams.addressOption === 'FACTORY'}
                                    onChange={e => setGlobalParams({ ...globalParams, addressOption: e.target.value })}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="text-sm">
                                    <span className="font-medium block text-slate-900">同工作地 (Factory)</span>
                                    <span className="text-slate-500 text-xs">工廠登記地址</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                                <input
                                    type="radio" name="addressOption" value="EMPLOYER_HOME"
                                    checked={globalParams.addressOption === 'EMPLOYER_HOME'}
                                    onChange={e => setGlobalParams({ ...globalParams, addressOption: e.target.value })}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="text-sm">
                                    <span className="font-medium block text-slate-900">雇主戶籍地 (Home)</span>
                                    <span className="text-slate-500 text-xs">負責人戶籍地址</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                                <input
                                    type="radio" name="addressOption" value="COMPANY"
                                    checked={globalParams.addressOption === 'COMPANY'}
                                    onChange={e => setGlobalParams({ ...globalParams, addressOption: e.target.value })}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="text-sm">
                                    <span className="font-medium block text-slate-900">公司登記地 (Office)</span>
                                    <span className="text-slate-500 text-xs">公司營業登記地址</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                                <input
                                    type="radio" name="addressOption" value="AGENCY"
                                    checked={globalParams.addressOption === 'AGENCY'}
                                    onChange={e => setGlobalParams({ ...globalParams, addressOption: e.target.value })}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="text-sm">
                                    <span className="font-medium block text-slate-900">仲介代管地 (Agency)</span>
                                    <span className="text-slate-500 text-xs">仲介公司地址</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Other Params */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Building size={18} className="text-purple-600" />
                            其他設定
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">指定醫院 (Hospital)</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    value={globalParams.hospitalName}
                                    onChange={e => setGlobalParams({ ...globalParams, hospitalName: e.target.value })}
                                >
                                    <option value="">-- 請選擇 --</option>
                                    <option value="長庚醫療財團法人林口長庚紀念醫院">林口長庚紀念醫院</option>
                                    <option value="衛生福利部桃園醫院">衛生福利部桃園醫院</option>
                                    <option value="敏盛綜合醫院">敏盛綜合醫院</option>
                                    <option value="聯新國際醫院">聯新國際醫院</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">聯繫人 (Agent/Contact)</label>
                                <input
                                    type="text"
                                    placeholder="輸入聯繫人姓名"
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    value={globalParams.agentName}
                                    onChange={e => setGlobalParams({ ...globalParams, agentName: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Template Selection & Generation */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Selection List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-800">選擇入境文件</h3>
                            <button
                                onClick={() => {
                                    if (selectedTemplates.size === templates.length) setSelectedTemplates(new Set());
                                    else setSelectedTemplates(new Set(templates.map(t => t.id)));
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {selectedTemplates.size === templates.length ? '取消全選' : '全選'}
                            </button>
                        </div>

                        {templates.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No entry templates found.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {templates.map(tmpl => (
                                    <label key={tmpl.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 cursor-pointer transition">
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedTemplates.has(tmpl.id)}
                                                onChange={() => toggleTemplate(tmpl.id)}
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{tmpl.name}</div>
                                            {tmpl.description && (
                                                <div className="text-sm text-slate-500 mt-0.5">{tmpl.description}</div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="p-4 bg-slate-50 border-t border-slate-100 sticky bottom-0 z-10">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || selectedTemplates.size === 0}
                                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-white transition shadow-lg
                                    ${loading || selectedTemplates.size === 0
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99]'}
                                `}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={20} />
                                        生成 {selectedTemplates.size} 份文件 (Generate Batch)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Result Panel */}
                    {result && (
                        <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 p-6 animate-in slide-in-from-bottom-2">
                            <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                                <CheckSquare size={20} />
                                生成成功 (Success)
                            </h3>

                            {/* ZIP Download */}
                            <a
                                href={`http://localhost:3001${result.zipUrl}`}
                                className="block w-full bg-emerald-600 text-white rounded-lg py-3 px-4 text-center font-bold hover:bg-emerald-700 transition shadow mb-6 flex items-center justify-center gap-2"
                            >
                                <Download size={20} />
                                下載全部文件包 (.Zip)
                            </a>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">個別文件下載</h4>
                                {result.files.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-emerald-100 hover:bg-white transition">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 truncate max-w-[300px]">{file.name}</span>
                                        </div>
                                        <a
                                            href={`http://localhost:3001${file.url}`}
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
                                            title="Download Single File"
                                        >
                                            <Download size={16} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
