"use client";

import React, { useState } from 'react';
import { FileText, Download, FileDown, PackageOpen, CheckCircle2, Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';

interface GeneratedDocument {
    filename: string;
    size: number;
    templateId: string;
}

interface GenerateResult {
    success: boolean;
    worker: {
        id: string;
        englishName: string;
        chineseName: string;
    };
    deployment: {
        id: string;
        startDate: string;
        employer: any;
    };
    documents: GeneratedDocument[];
}

export default function EntryDocumentsPage() {
    const [selectedWorker, setSelectedWorker] = useState<any>(null);
    const [selectedDeployment, setSelectedDeployment] = useState<string>('');
    const [generating, setGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<GenerateResult | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

    const handleGenerateDocuments = async () => {
        if (!selectedWorker) {
            alert('請先選擇移工');
            return;
        }

        setGenerating(true);
        setGeneratedResult(null);

        try {
            const response = await fetch('/api/entry-documents/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: selectedWorker.id,
                    deploymentId: selectedDeployment || undefined
                })
            });

            if (!response.ok) {
                throw new Error('產生文件失敗');
            }

            const result: GenerateResult = await response.json();
            setGeneratedResult(result);
        } catch (error) {
            console.error(error);
            alert('產生文件時發生錯誤');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadSingle = async (filename: string) => {
        if (!selectedWorker || !generatedResult) return;

        setDownloadingFile(filename);

        try {
            // 重新產生並下載單一文件
            const response = await fetch('/api/entry-documents/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: selectedWorker.id,
                    deploymentId: selectedDeployment || undefined
                })
            });

            if (!response.ok) {
                throw new Error('下載失敗');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('下載文件時發生錯誤');
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleDownloadAllAsZip = async () => {
        if (!selectedWorker) return;

        setDownloadingFile('ZIP');

        try {
            const response = await fetch('/api/entry-documents/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: selectedWorker.id,
                    deploymentId: selectedDeployment || undefined
                })
            });

            if (!response.ok) {
                throw new Error('下載失敗');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `entry_documents_${selectedWorker.englishName}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('下載時發生錯誤');
        } finally {
            setDownloadingFile(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <PageContainer
            title="入境文件準備"
            subtitle="產生移工入國通報與證照申辦所需文件"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Worker Selection */}
                <div className="lg:col-span-1 bg-white rounded-lg border p-6">
                    <h2 className="text-lg font-semibold mb-4">選擇移工與合約</h2>

                    {/* TODO: Add Worker Selector Component */}
                    <div className="text-sm text-gray-500">
                        移工選擇器 (待實作)
                    </div>
                </div>

                {/* Right Panel - Document Types & Generation */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Document Types Selection */}
                    <div className="bg-white rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-4">文件類型說明</h2>

                        <div className="space-y-3 mb-6">
                            <h3 className="text-sm font-medium text-gray-700">入國通報 (3日內)</h3>
                            <div className="space-y-2 pl-4 text-sm text-gray-600">
                                <div>• 雇主聘僱外國人入國通報單</div>
                                <div>• 外國人名冊</div>
                                <div>• 生活照顧服務計畫書</div>
                                <div>• 工資切結書</div>
                            </div>

                            <h3 className="text-sm font-medium text-gray-700 pt-4">入境健檢 (3日內)</h3>
                            <div className="space-y-2 pl-4 text-sm text-gray-600">
                                <div>• 健康檢查申請表</div>
                            </div>

                            <h3 className="text-sm font-medium text-gray-700 pt-4">申請聘僱許可 (15日內)</h3>
                            <div className="space-y-2 pl-4 text-sm text-gray-600">
                                <div>• AF-043 聘僱許可申請書</div>
                            </div>

                            <h3 className="text-sm font-medium text-gray-700 pt-4">社會保險加保</h3>
                            <div className="space-y-2 pl-4 text-sm text-gray-600">
                                <div>• 勞工保險加保申報表</div>
                                <div>• 全民健康保險投保申報表</div>
                                <div>• 勞工職業災害保險加保申報表</div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateDocuments}
                            disabled={!selectedWorker || generating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    產生中...
                                </>
                            ) : (
                                <>
                                    <FileText size={18} />
                                    批次產生文件
                                </>
                            )}
                        </button>
                    </div>

                    {/* Generated Documents Result */}
                    {generatedResult && generatedResult.documents.length > 0 && (
                        <div className="bg-white rounded-lg border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">已產生文件</h2>
                                <button
                                    onClick={handleDownloadAllAsZip}
                                    disabled={downloadingFile === 'ZIP'}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors text-sm"
                                >
                                    {downloadingFile === 'ZIP' ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            下載中...
                                        </>
                                    ) : (
                                        <>
                                            <PackageOpen size={16} />
                                            全部打包下載 (ZIP)
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {generatedResult.documents.map((doc, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText size={20} className="text-blue-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {doc.filename}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatFileSize(doc.size)}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadSingle(doc.filename)}
                                            disabled={downloadingFile === doc.filename}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 transition-colors flex-shrink-0"
                                        >
                                            {downloadingFile === doc.filename ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    下載中
                                                </>
                                            ) : (
                                                <>
                                                    <FileDown size={14} />
                                                    下載
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                                <div className="flex gap-2 items-start text-sm text-green-800">
                                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-medium">產生完成！</span>
                                        您可以逐一下載審核，或直接打包下載全部文件。
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    {!generatedResult && (
                        <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                            <div className="flex gap-2 items-start">
                                <CheckCircle2 size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">使用說明</p>
                                    <ul className="text-xs space-y-1 pl-4 list-disc">
                                        <li>選擇移工後，點擊「批次產生文件」</li>
                                        <li>產生完成後，可選擇：</li>
                                        <li className="pl-4">• <strong>逐一下載</strong> - 適合逐一審核的工作流程</li>
                                        <li className="pl-4">• <strong>全部打包下載</strong> - 適合批量處理的工作流程</li>
                                        <li>系統會自動填入移工、雇主、合約等相關資料</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
