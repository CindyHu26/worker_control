import { useState, useEffect, useRef } from 'react';
import { format, addMonths } from 'date-fns';
import { FileText, Plus, Trash2, Calendar, Download, Upload, Pencil } from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPut } from '@/lib/api';
import ExcelJS from 'exceljs';
import { RecruitmentLetterForm } from '@/components/recruitment/RecruitmentLetterForm';

interface RecruitmentLetter {
    id: string;
    letterNumber: string;
    issueDate: string; // ISO
    expiryDate: string; // ISO
    approvedQuota: number;
    usedQuota: number;
    // ... other fields
    submissionDate?: string;
    laborMinistryReceiptDate?: string;
    workAddress?: string;
    recruitmentType?: string;
    remarks?: string;
}

interface RecruitmentLetterManagerProps {
    employerId: string;
}

export default function RecruitmentLetterManager({ employerId }: RecruitmentLetterManagerProps) {
    const [letters, setLetters] = useState<RecruitmentLetter[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // View State: 'list' | 'create' | 'edit'
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedLetter, setSelectedLetter] = useState<RecruitmentLetter | undefined>(undefined);

    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchLetters = async () => {
        try {
            const data = await apiGet<any>(`/api/employers/${employerId}`);
            // Sort by issueDate desc
            const sorted = (data.recruitmentLetters || []).sort((a: any, b: any) =>
                new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
            );
            setLetters(sorted);
        } catch (error) {
            console.error('載入函文失敗', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLetters();
    }, [employerId]);

    const handleFormSubmit = async (data: any) => {
        try {
            if (data.id) {
                // Update
                await apiPut(`/api/employers/${employerId}/recruitment-letters/${data.id}`, data);
                // Keep in edit mode or go back? Usually go back or stay.
                // Let's reload list but stay in edit mode to acknowledge success
                alert('更新成功');
            } else {
                // Create
                const res = await apiPost(`/api/employers/${employerId}/recruitment-letters`, data);
                // Switch to edit mode with the new ID to allow attachments
                setSelectedLetter(res as any);
                setViewMode('edit');
                alert('新增成功，現在可以上傳檔案了');
            }
            fetchLetters();
        } catch (error) {
            console.error(error);
            alert('儲存失敗 (Error saving letter)');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此招募函嗎？')) return;
        try {
            await apiDelete(`/api/employers/${employerId}/recruitment-letters/${id}`);
            fetchLetters();
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
                    if (rowNumber === 1) return; // Skip header
                    const letterNumber = row.getCell(1).value?.toString() || '';
                    if (!letterNumber) return;

                    let issueDate = row.getCell(2).value;
                    let expiryDate = row.getCell(3).value;
                    let quota = row.getCell(4).value;

                    // Excel date handling
                    if (typeof issueDate === 'object') issueDate = (issueDate as Date).toISOString().split('T')[0];
                    if (typeof expiryDate === 'object') expiryDate = (expiryDate as Date).toISOString().split('T')[0];

                    data.push({
                        letterNumber,
                        issueDate,
                        expiryDate,
                        approvedQuota: Number(quota) || 0,
                        recruitmentType: '初招' // Default
                    });
                });

                let count = 0;
                for (const item of data) {
                    await apiPost(`/api/employers/${employerId}/recruitment-letters`, item);
                    count++;
                }

                alert(`成功匯入 ${count} 筆函文`);
                fetchLetters();

            } catch (error) {
                console.error(error);
                alert('匯入失敗，請確認檔案格式正確 (Import failed)');
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    if (isLoading) return <div className="text-gray-500 text-sm">載入招募函資料中...</div>;

    // Render Form View
    if (viewMode === 'create' || viewMode === 'edit') {
        return (
            <RecruitmentLetterForm
                employerId={employerId}
                initialData={viewMode === 'edit' ? selectedLetter : undefined}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                    setViewMode('list');
                    setSelectedLetter(undefined);
                }}
            />
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    招募函管理 ({letters.length})
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            // Download Template
                            const workbook = new ExcelJS.Workbook();
                            const worksheet = workbook.addWorksheet('Letters');
                            worksheet.columns = [
                                { header: '發文號', key: 'no', width: 25 },
                                { header: '發文日期', key: 'issue', width: 15 },
                                { header: '失效日期', key: 'expiry', width: 15 },
                                { header: '核准名額', key: 'quota', width: 10 },
                            ];
                            worksheet.addRow({ no: '勞動發管字第...', issue: format(new Date(), 'yyyy-MM-dd'), expiry: format(addMonths(new Date(), 6), 'yyyy-MM-dd'), quota: 1 });

                            const buffer = await workbook.xlsx.writeBuffer();
                            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'recruitment_letters_template.xlsx';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1 text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download className="w-3 h-3" /> 下載範本
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 text-sm bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors shadow-sm"
                    >
                        <Upload className="w-3 h-3" /> {importing ? '匯入中' : '匯入 Excel'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls" />
                    <button
                        onClick={() => {
                            setSelectedLetter(undefined);
                            setViewMode('create');
                        }}
                        className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-3 h-3" />
                        新增招募函
                    </button>
                </div>
            </div>

            <div className="p-6">
                {letters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                        尚無招募函資料。請點擊「新增」建立或「匯入 Excel」。
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {letters.map(letter => {
                            const available = letter.approvedQuota - letter.usedQuota;
                            const isExpired = new Date(letter.expiryDate) < new Date();
                            const isFull = available <= 0;

                            return (
                                <div key={letter.id} className={`relative p-4 rounded-lg border ${isExpired ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-gray-800 text-sm truncate pr-2 cursor-pointer hover:text-blue-600"
                                                title="點擊編輯"
                                                onClick={() => {
                                                    setSelectedLetter(letter);
                                                    setViewMode('edit');
                                                }}
                                            >
                                                {letter.letterNumber}
                                            </h4>
                                            {letter.recruitmentType && (
                                                <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit mt-1">
                                                    {letter.recruitmentType}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setSelectedLetter(letter);
                                                    setViewMode('edit');
                                                }}
                                                className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                                title="編輯"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(letter.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="刪除"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-xs text-gray-500 mb-3 gap-2">
                                        <Calendar className="w-3 h-3" />
                                        <span>{format(new Date(letter.issueDate), 'yyyy-MM-dd')} ~ {format(new Date(letter.expiryDate), 'yyyy-MM-dd')}</span>
                                    </div>

                                    <div className="bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full ${isExpired ? 'bg-gray-400' : isFull ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min((letter.usedQuota / letter.approvedQuota) * 100, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">已用: {letter.usedQuota} / {letter.approvedQuota}</span>
                                        <span className={`font-bold ${isExpired ? 'text-gray-500' : isFull ? 'text-red-600' : 'text-blue-600'}`}>
                                            剩餘: {available}
                                        </span>
                                    </div>

                                    {isExpired && (
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 border-2 border-red-500 text-red-500 font-bold px-2 text-lg rounded opacity-30 select-none pointer-events-none">
                                            EXPIRED
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
