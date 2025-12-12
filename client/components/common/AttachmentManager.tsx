
"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Trash2, Download, Upload } from 'lucide-react';

interface Attachment {
    id: string;
    fileName: string;
    filePath: string;
    fileType: string;
    uploadedAt: string;
}

interface AttachmentManagerProps {
    refId: string;
    refTable: string;
    allowUpload?: boolean;
}

export default function AttachmentManager({ refId, refTable, allowUpload = true }: AttachmentManagerProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploading, setUploading] = useState(false);

    const fetchAttachments = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/attachments/${refTable}/${refId}`);
            if (res.ok) {
                const data = await res.json();
                setAttachments(data);
            }
        } catch (error) {
            console.error('Failed to fetch attachments', error);
        }
    };

    useEffect(() => {
        if (refId && refTable) {
            fetchAttachments();
        }
    }, [refId, refTable]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('refId', refId);
        formData.append('refTable', refTable);

        try {
            const res = await fetch('http://localhost:3001/api/attachments', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchAttachments();
            } else {
                const err = await res.json();
                alert('Upload failed: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Upload error');
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const res = await fetch(`http://localhost:3001/api/attachments/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setAttachments(prev => prev.filter(a => a.id !== id));
            } else {
                alert('Delete failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-4">
            {allowUpload && (
                <div className="flex items-center gap-4">
                    <label className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition shadow-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={18} />
                        <span className="font-medium">{uploading ? 'Uploading...' : 'Upload Document'}</span>
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                    <p className="text-sm text-gray-500">Supported: Images, PDF, Docs</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {attachments.map(file => (
                    <div key={file.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-gray-100 p-2 rounded-lg border border-gray-200 flex-shrink-0">
                                {file.fileType && file.fileType.startsWith('image/') ? (
                                    <ImageIcon className="text-purple-600" size={24} />
                                ) : (
                                    <FileText className="text-blue-600" size={24} />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate" title={file.fileName}>{file.fileName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 pl-2">
                            <a
                                href={`http://localhost:3001${file.filePath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="Download/View"
                            >
                                <Download size={18} />
                            </a>
                            {allowUpload && (
                                <button
                                    onClick={() => handleDelete(file.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {attachments.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                        <p className="text-sm">No documents found for this record.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
