import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, CheckSquare } from 'lucide-react';
import AttachmentManager from '../common/AttachmentManager';

interface DocumentsTabProps {
    worker: any;
}

export default function DocumentsTab({ worker }: DocumentsTabProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
    const [docCategory, setDocCategory] = useState<string>('entry_packet');
    const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setIsTemplatesLoading(true);
        fetch(`http://localhost:3001/api/documents/templates?category=${docCategory}`) // Ensure port is correct or use relative path if proxied
            .then(res => res.json())
            .then(data => {
                setTemplates(Array.isArray(data) ? data : []);
                setSelectedTemplates([]);
            })
            .catch(console.error)
            .finally(() => setIsTemplatesLoading(false));
    }, [docCategory]);

    const handleTemplateSelect = (id: string) => {
        if (selectedTemplates.includes(id)) {
            setSelectedTemplates(selectedTemplates.filter(tid => tid !== id));
        } else {
            setSelectedTemplates([...selectedTemplates, id]);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTemplates(templates.map(t => t.id));
        } else {
            setSelectedTemplates([]);
        }
    };

    const handleDownload = async (idsToDownload: string[]) => {
        if (idsToDownload.length === 0) return;
        setIsGenerating(true);
        try {
            const res = await fetch('http://localhost:3001/api/documents/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: worker.id,
                    templateIds: idsToDownload
                })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                let filename = 'Document.docx';
                const disposition = res.headers.get('Content-Disposition');
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) {
                        filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
                    }
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const err = await res.json();
                alert('Generation Failed: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('System Error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex gap-6 h-[600px]">
            {/* Sidebar */}
            <div className="w-1/4 space-y-2 h-full flex flex-col">
                <h4 className="font-bold text-slate-700 mb-2">文件類別 (Category)</h4>
                <div className="space-y-1 overflow-y-auto flex-1 pr-2">
                    {[
                        { id: 'entry_packet', label: '新入境套組 (Entry)' },
                        { id: 'handover_packet', label: '交工本 (Handover)' },
                        { id: 'medical_check', label: '定期體檢 (Medical)' },
                        { id: 'transfer_exit', label: '轉出/離境 (Transfer)' },
                        { id: 'entry_report', label: '入國通報 (Report)' },
                        { id: 'permit_app', label: '函文申請 (Permit)' }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setDocCategory(cat.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition ${docCategory === cat.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            <span className="font-medium text-sm">{cat.label}</span>
                            {docCategory === cat.id && <CheckSquare size={16} />}
                        </button>
                    ))}
                </div>

                <div className="pt-4 border-t mt-2 h-1/3 overflow-hidden flex flex-col">
                    <h4 className="font-bold text-slate-700 mb-2">已上傳文件</h4>
                    <div className="flex-1 overflow-y-auto">
                        <AttachmentManager refId={worker.id} refTable="workers" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-3/4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        文件列表 ({docCategory})
                    </h3>
                    <button
                        disabled={selectedTemplates.length === 0 || isGenerating}
                        onClick={() => handleDownload(selectedTemplates)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow transition ${selectedTemplates.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        {selectedTemplates.length > 0 ? `下載選取 (${selectedTemplates.length})` : '批次下載'}
                    </button>
                </div>

                <div className="bg-white border rounded-lg overflow-hidden shadow-sm flex-1 overflow-y-auto">
                    {isTemplatesLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading templates...</div>
                    ) : templates.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">在此類別無可用範本 (No templates found)</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b sticky top-0">
                                <tr>
                                    <th className="w-12 p-3 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            checked={templates.length > 0 && selectedTemplates.length === templates.length}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">文件名稱</th>
                                    <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">說明</th>
                                    <th className="w-20 text-center p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {templates.map(tmpl => (
                                    <tr key={tmpl.id} className="hover:bg-slate-50 transition">
                                        <td className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedTemplates.includes(tmpl.id)}
                                                onChange={() => handleTemplateSelect(tmpl.id)}
                                            />
                                        </td>
                                        <td className="p-3 font-medium text-slate-700">{tmpl.name}</td>
                                        <td className="p-3 text-sm text-slate-500">{tmpl.description || '-'}</td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => handleDownload([tmpl.id])}
                                                title="下載單一文件"
                                                className="text-slate-400 hover:text-blue-600 transition"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
