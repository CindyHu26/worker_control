import { useState, useEffect, useRef } from 'react';
import { format, addMonths } from 'date-fns';
import { FileText, Plus, Trash2, Calendar, Download, Upload, Pencil } from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPut } from '@/lib/api';
import ExcelJS from 'exceljs';
import { RecruitmentLetterForm } from '@/components/recruitment/RecruitmentLetterForm';
import { RecruitmentTypeMap } from '@/utils/maps';

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
            // alert('刪除失敗，可能尚有使用中的名額');
            // The API now returns a JSON error message instead of throwing immediately if handled well,
            // but apiDelete might throw. Let's rely on global error handling or console log.
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

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                函文號碼 / 發文日期
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                招募類型
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                已用 / 核准名額
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                失效日期
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">操作</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {letters.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    尚無招募函資料。請點擊「新增招募函」建立。
                                </td>
                            </tr>
                        ) : letters.map(letter => {
                            const isExpired = new Date(letter.expiryDate) < new Date();

                            return (
                                <tr key={letter.id} className={`${isExpired ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                            title="點擊編輯"
                                            onClick={() => {
                                                setSelectedLetter(letter);
                                                setViewMode('edit');
                                            }}
                                        >
                                            {letter.letterNumber}
                                        </div>
                                        <div className="text-sm text-gray-500">{letter.issueDate.split('T')[0]}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {RecruitmentTypeMap[letter.recruitmentType || ''] || letter.recruitmentType || '一般'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {letter.usedQuota} / {letter.approvedQuota}
                                        </div>
                                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className={`h-full ${letter.usedQuota >= letter.approvedQuota ? 'bg-red-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, (letter.usedQuota / letter.approvedQuota) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {letter.expiryDate.split('T')[0]}
                                        {isExpired && <span className="ml-2 text-xs text-red-500 font-bold">(Ex)</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setSelectedLetter(letter);
                                                setViewMode('edit');
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(letter.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
