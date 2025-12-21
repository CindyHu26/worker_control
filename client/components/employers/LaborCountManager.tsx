import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Save, RefreshCw, Plus } from 'lucide-react';

import ExcelJS from 'exceljs';
import { apiGet, apiPost } from '@/lib/api';

interface LaborCount {
    year: number;
    month: number;
    count: number;
}

export default function LaborCountManager({ employerId }: { employerId: string }) {
    const [counts, setCounts] = useState<LaborCount[]>([]);
    const [localCounts, setLocalCounts] = useState<LaborCount[]>([]); // Current state in UI
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track which years we want to display (default to current and previous)
    const [displayYears, setDisplayYears] = useState<number[]>([]);

    // Fetch data
    const fetchCounts = async () => {
        setLoading(true);
        try {
            const data = await apiGet<LaborCount[]>(`/api/employers/${employerId}/labor-counts`);
            setCounts(data);
            setLocalCounts(data);

            // Extract unique years from data + current/prev
            const currentYear = new Date().getFullYear();
            const dataYears = Array.from(new Set(data.map(c => c.year)));
            const initialYears = Array.from(new Set([currentYear, currentYear - 1, ...dataYears])).sort((a, b) => b - a);
            setDisplayYears(initialYears);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, [employerId]);

    // Handle single cell change
    const updateLocalCount = (year: number, month: number, value: string) => {
        const val = parseInt(value) || 0;
        setLocalCounts(prev => {
            const exists = prev.find(c => c.year === year && c.month === month);
            if (exists) {
                return prev.map(c => (c.year === year && c.month === month) ? { ...c, count: val } : c);
            } else {
                return [...prev, { year, month, count: val }];
            }
        });
    };

    // Save All
    const handleSave = async () => {
        setSaving(true);
        try {
            // Only send what's actually changed or added? 
            // The API handles upsert, so sending all relevant localCounts is fine.
            const res = await apiPost(`/api/employers/${employerId}/labor-counts`, { data: localCounts });
            alert('儲存完成 (Saved successfully)');
            fetchCounts();
        } catch (error) {
            console.error(error);
            alert('儲存失敗 (Save failed)');
        } finally {
            setSaving(false);
        }
    };

    // Add Year
    const handleAddYear = () => {
        const minYear = Math.min(...displayYears);
        const nextYear = minYear - 1;
        setDisplayYears(prev => [...prev, nextYear].sort((a, b) => b - a));
    };

    // Handle File Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const buffer = evt.target?.result as ArrayBuffer;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);

                const worksheet = workbook.getWorksheet(1);
                if (!worksheet) throw new Error('No worksheet found');

                const data: any[] = [];
                const headers: string[] = [];

                const headerRow = worksheet.getRow(1);
                headerRow.eachCell((cell, colNumber) => {
                    headers[colNumber] = cell.value?.toString().trim() || '';
                });

                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    const rowData: any = {};
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber];
                        if (header) {
                            const value = cell.value;
                            rowData[header] = (value && typeof value === 'object' && 'result' in value)
                                ? value.result
                                : value;
                        }
                    });
                    data.push(rowData);
                });

                const formattedData = data.map(row => ({
                    year: Number(row['Year'] || row['年份'] || row['year']),
                    month: Number(row['Month'] || row['月份'] || row['month']),
                    count: Number(row['Count'] || row['人數'] || row['count'])
                })).filter(r => r.year && r.month && !isNaN(r.count));

                if (formattedData.length === 0) {
                    alert('未發現有效資料，請確認欄位為 Year, Month, Count');
                    return;
                }

                await apiPost(`/api/employers/${employerId}/labor-counts`, { data: formattedData });
                alert(`成功匯入 ${formattedData.length} 筆資料`);
                fetchCounts();
            } catch (error) {
                console.error(error);
                alert('處理檔案時發生錯誤 (Error processing file).');
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const getCountValue = (y: number, m: number) => {
        const found = localCounts.find(c => c.year === y && c.month === m);
        return found ? found.count : '';
    };

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Upload className="text-blue-600" size={24} />
                        勞保人數管理 (Labor Insurance Counts)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        用於計算招募名額 (根據申請當月回推12個月之平均)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchCounts}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                        title="重新整理 (Refresh)"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold shadow-sm"
                    >
                        <Save size={16} /> {saving ? '儲存中...' : '儲存變更 (Save)'}
                    </button>

                    <button
                        onClick={handleAddYear}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                    >
                        <Plus size={16} /> 增加年份 (Add Year)
                    </button>

                    <div className="w-px h-8 bg-gray-200 mx-1" />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded hover:bg-blue-50 text-sm"
                    >
                        <Upload size={16} /> {importing ? '匯入中...' : '匯入 Excel'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                    />
                </div>
            </div>

            {/* Matrix View */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-center border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-700">
                            <th className="border-b p-3 font-bold w-24 bg-gray-50 sticky left-0 z-10">年份</th>
                            {months.map(m => (
                                <th key={m} className="border-b border-l p-3 font-semibold">{m}月</th>
                            ))}
                            <th className="border-b border-l p-3 font-bold w-24 bg-gray-50">平均</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {displayYears.map(year => {
                            const rowCounts = localCounts.filter(c => c.year === year);
                            const avgValue = rowCounts.length > 0
                                ? (rowCounts.reduce((a, b) => a + (b.count || 0), 0) / rowCounts.length).toFixed(1)
                                : '0.0';

                            return (
                                <tr key={year} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-3 font-bold bg-gray-50 sticky left-0 z-10 border-r">{year}</td>
                                    {months.map(month => (
                                        <td key={month} className="p-1 border-l">
                                            <input
                                                type="number"
                                                className="w-full p-2 text-center border-0 focus:ring-2 focus:ring-blue-500 rounded bg-transparent hover:bg-white"
                                                value={getCountValue(year, month)}
                                                onChange={(e) => updateLocalCount(year, month, e.target.value)}
                                                placeholder="-"
                                                min="0"
                                            />
                                        </td>
                                    ))}
                                    <td className="p-3 font-bold text-blue-600 bg-gray-50 border-l">{avgValue}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-xs">
                <div className="text-gray-400">
                    * 系統將自動根據「申請當月」回推 12 個月計算平均人數
                </div>
                <div className="text-indigo-600 font-medium">
                    提示：您可以直接在表格內輸入數字，修改後請記得點擊「儲存變更」
                </div>
            </div>
        </div>
    );
}
