import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Save, RefreshCw } from 'lucide-react';

import ExcelJS from 'exceljs';
import { apiGet, apiPost } from '@/lib/api';

interface LaborCount {
    year: number;
    month: number;
    count: number;
}

export default function LaborCountManager({ employerId }: { employerId: string }) {
    const [counts, setCounts] = useState<LaborCount[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch data
    // Fetch data
    const fetchCounts = async () => {
        setLoading(true);
        try {
            const data = await apiGet<LaborCount[]>(`/api/employers/${employerId}/labor-counts`);
            setCounts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, [employerId]);

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

                // Get headers from first row
                const headerRow = worksheet.getRow(1);
                headerRow.eachCell((cell, colNumber) => {
                    headers[colNumber] = cell.value?.toString().trim() || '';
                });

                // Get data from subsequent rows
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    const rowData: any = {};
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber];
                        if (header) {
                            // Extract raw value (handle potential formula result)
                            const value = cell.value;
                            rowData[header] = (value && typeof value === 'object' && 'result' in value)
                                ? value.result
                                : value;
                        }
                    });
                    data.push(rowData);
                });

                // Validate and format
                const formattedData = data.map(row => ({
                    year: Number(row['Year'] || row['年份'] || row['year']),
                    month: Number(row['Month'] || row['月份'] || row['month']),
                    count: Number(row['Count'] || row['人數'] || row['count'])
                })).filter(r => r.year && r.month && !isNaN(r.count));

                if (formattedData.length === 0) {
                    alert('未發現有效資料，請確認欄位為 Year, Month, Count');
                    return;
                }

                // Send to API
                // Send to API
                const res = await apiPost(`/api/employers/${employerId}/labor-counts`, { data: formattedData });
                if (res.ok) {
                    alert(`成功匯入 ${formattedData.length} 筆資料`);
                    fetchCounts();
                } else {
                    alert('匯入失敗 (Import failed)');
                }
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

    // Helper to get count for a specific cell
    const getCount = (y: number, m: number) => {
        const found = counts.find(c => c.year === y && c.month === m);
        return found ? found.count : '-';
    };

    // Generate years to show (e.g. this year and previous 2)
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2];
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
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
                        onClick={async () => {
                            try {
                                const workbook = new ExcelJS.Workbook();
                                const worksheet = workbook.addWorksheet('Template');
                                worksheet.columns = [
                                    { header: 'Year (年份)', key: 'year', width: 15 },
                                    { header: 'Month (月份)', key: 'month', width: 15 },
                                    { header: 'Count (人數)', key: 'count', width: 15 },
                                ];
                                // Example data
                                const thisYear = new Date().getFullYear();
                                worksheet.addRow({ year: thisYear, month: 1, count: 5 });
                                worksheet.addRow({ year: thisYear, month: 2, count: 5 });

                                const buffer = await workbook.xlsx.writeBuffer();
                                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                                // Create a download link and trigger it
                                const url = window.URL.createObjectURL(blob);
                                const anchor = document.createElement('a');
                                anchor.href = url;
                                anchor.download = 'labor_count_template.xlsx';
                                document.body.appendChild(anchor);
                                anchor.click();
                                document.body.removeChild(anchor);
                                window.URL.revokeObjectURL(url);
                            } catch (err) {
                                console.error('Export failed', err);
                                alert('下載範本失敗 (Export failed)');
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50 text-sm"
                    >
                        <Download size={16} /> 下載範本 (Template)
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
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
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-700">
                            <th className="border p-2 font-bold w-24">年份 / 月份</th>
                            {months.map(m => (
                                <th key={m} className="border p-2 font-semibold">{m}月</th>
                            ))}
                            <th className="border p-2 font-bold w-24">平均</th>
                        </tr>
                    </thead>
                    <tbody>
                        {years.map(year => {
                            // Calculate simple average for row display (optional)
                            const rowCounts = counts.filter(c => c.year === year);
                            const avg = rowCounts.length > 0
                                ? (rowCounts.reduce((a, b) => a + b.count, 0) / rowCounts.length).toFixed(1)
                                : '-';

                            return (
                                <tr key={year} className="hover:bg-blue-50">
                                    <td className="border p-3 font-bold bg-gray-50">{year}</td>
                                    {months.map(month => (
                                        <td key={month} className="border p-3 text-gray-700">
                                            {getCount(year, month)}
                                        </td>
                                    ))}
                                    <td className="border p-3 font-bold text-blue-600 bg-gray-50">{avg}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-xs text-gray-400 text-right">
                * 系統將自動根據「申請當月」回推 12 個月計算平均人數
            </div>
        </div>
    );
}
