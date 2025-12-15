import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Save, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

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
    const fetchCounts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/employers/${employerId}/labor-counts`);
            if (res.ok) {
                const data = await res.json();
                setCounts(data);
            }
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
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Expect columns: Year, Month, Count
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                // Validate and format
                const formattedData = data.map(row => ({
                    year: Number(row['Year'] || row['年份'] || row['year']),
                    month: Number(row['Month'] || row['月份'] || row['month']),
                    count: Number(row['Count'] || row['人數'] || row['count'])
                })).filter(r => r.year && r.month && !isNaN(r.count));

                if (formattedData.length === 0) {
                    alert('No valid data found. Please ensure columns are Year, Month, Count.');
                    return;
                }

                // Send to API (Existing quota service expects 'data')
                const res = await fetch(`http://localhost:3001/api/employers/${employerId}/labor-counts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: formattedData })
                });

                if (res.ok) {
                    alert(`Successfully imported ${formattedData.length} records.`);
                    fetchCounts();
                } else {
                    alert('Import failed.');
                }
            } catch (error) {
                console.error(error);
                alert('Error processing file.');
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
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
                        用於計算招募名額 (Based on average of previous 12 months)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchCounts}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => {
                            // Create sample template
                            const ws = XLSX.utils.json_to_sheet([
                                { Year: currentYear, Month: 1, Count: 5 },
                                { Year: currentYear, Month: 2, Count: 5 }
                            ]);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Template");
                            XLSX.writeFile(wb, "labor_count_template.xlsx");
                        }}
                        className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50 text-sm"
                    >
                        <Download size={16} /> 下載範本
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
