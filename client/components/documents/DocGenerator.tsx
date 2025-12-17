import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"; // 假設您有
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Loader2 } from 'lucide-react';

interface DocGeneratorProps {
    category: string;      // e.g., 'recruitment', 'worker'
    contextId: string;     // 資料ID
    contextType: string;   // 傳給後端的類型參數
    label?: string;        // 按鈕文字
}

export function DocGenerator({ category, contextId, contextType, label = "產生文件" }: DocGeneratorProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    // 載入該分類的模板清單
    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/templates?category=${category}`);
            const data = await res.json();
            setTemplates(data);
        } finally {
            setLoading(false);
        }
    };

    // 觸發下載
    const handleGenerate = async (template: any) => {
        setGeneratingId(template.id);
        try {
            const res = await fetch(`/api/templates/${template.id}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contextType, contextId })
            });

            if (!res.ok) throw new Error('Generation failed');

            // 處理 Blob 下載
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `產生文件_${template.name}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error(error);
            alert("文件產生失敗，請檢查資料是否完整");
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <Dialog onOpenChange={(open) => open && loadTemplates()}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>選擇文件模板 ({category})</DialogTitle>
                </DialogHeader>

                <div className="space-y-2 mt-4">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : templates.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">尚無可用的模板，請先至設定區上傳。</p>
                    ) : (
                        templates.map(tpl => (
                            <div key={tpl.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition">
                                <div>
                                    <div className="font-medium">{tpl.name}</div>
                                    <div className="text-xs text-gray-500">{tpl.description || '無描述'}</div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleGenerate(tpl)}
                                    disabled={generatingId === tpl.id}
                                >
                                    {generatingId === tpl.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}