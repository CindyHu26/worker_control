"use client";

import { useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';

export default function AccountingPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ message: string; count: number } | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('http://localhost:3001/api/accounting/generate-monthly-fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, month })
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('System Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-slate-800">財務管理</h1>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
                    <Calendar className="text-blue-600" /> 月費帳單生成
                </h2>

                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">年份</label>
                            <input
                                type="number"
                                className="w-full border p-2 rounded"
                                value={year}
                                onChange={e => setYear(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">月份</label>
                            <select
                                className="w-full border p-2 rounded"
                                value={month}
                                onChange={e => setMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{m}月</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`w-full py-3 rounded text-white font-bold transition flex justify-center items-center gap-2
                            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? '生成中...' : '執行生成'}
                    </button>

                    {result && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mt-4 flex items-center gap-2">
                            <CheckCircle size={20} />
                            <div>
                                <p className="font-bold">{result.message}</p>
                                {/* <p className="text-sm">Created {result.count} bills.</p> */}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
