'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CandidateImportPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const handleUpload = async () => {
        if (!file) {
            toast.error('è«‹é¸?‡æ?æ¡?);
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/candidates/import', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '?¯å…¥å¤±æ?');
            }

            setResult(data);
            toast.success(`?å??¯å…¥ ${data.imported} ç­†ï??è? ${data.duplicates} ç­†`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <StandardPageLayout
            title="?¯å…¥?™é¸äººå±¥æ­?
            subtitle="ä¸Šå‚³ Excel ?¹æ¬¡?¯å…¥äººæ?è³‡æ?"
            actions={
                <Link href="/candidates">
                    <Button variant="outline">è¿”å??—è¡¨</Button>
                </Link>
            }
        >
            <div className="max-w-4xl space-y-6">
                {/* Upload Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center bg-white hover:border-blue-400 transition-colors"
                >
                    <FileSpreadsheet className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                        ?–æ‹½ Excel æª”æ??³æ­¤ï¼Œæ?é»æ??¸æ?æª”æ?
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        ?¯æ´ .xlsx, .xls ?¼å?
                    </p>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload">
                        <Button variant="outline" className="cursor-pointer" asChild>
                            <span>
                                <Upload size={16} className="mr-2" />
                                ?¸æ?æª”æ?
                            </span>
                        </Button>
                    </label>
                </div>

                {/* Selected File */}
                {file && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="font-medium text-slate-800">{file.name}</p>
                                <p className="text-sm text-slate-600">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        </div>
                        <Button onClick={handleUpload} disabled={uploading}>
                            {uploading ? 'ä¸Šå‚³ä¸?..' : '?‹å??¯å…¥'}
                        </Button>
                    </div>
                )}

                {/* Result Summary */}
                {result && (
                    <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">?¯å…¥çµæ?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-green-700 mb-1">
                                    <CheckCircle size={20} />
                                    <span className="font-medium">?å??¯å…¥</span>
                                </div>
                                <p className="text-2xl font-bold text-green-900">{result.imported}</p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-yellow-700 mb-1">
                                    <AlertCircle size={20} />
                                    <span className="font-medium">?è?è³‡æ?</span>
                                </div>
                                <p className="text-2xl font-bold text-yellow-900">{result.duplicates}</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-red-700 mb-1">
                                    <AlertCircle size={20} />
                                    <span className="font-medium">?¯å…¥?¯èª¤</span>
                                </div>
                                <p className="text-2xl font-bold text-red-900">{result.errors}</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => router.push('/candidates')}>
                                ?å??™é¸äººå?è¡?
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </StandardPageLayout>
    );
}
