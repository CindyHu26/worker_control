
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Plus, Download, FileCheck, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ContractForm from './ContractForm';

interface Attachment {
    id: string;
    fileName: string;
    // ...
}

interface ServiceContract {
    id: string;
    contractNumber?: string;
    type: string;
    startDate: string;
    endDate: string;
    serviceFee: number;
    status: string;
    attachments: Attachment[];
}

interface ContractListProps {
    employerId: string;
}

export default function ContractList({ employerId }: ContractListProps) {
    const [contracts, setContracts] = useState<ServiceContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<ServiceContract | null>(null);

    const fetchContracts = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/contracts/employer/${employerId}`);
            if (res.ok) {
                const data = await res.json();
                setContracts(data);
            }
        } catch (error) {
            console.error('Failed to fetch contracts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [employerId]);

    const handleEdit = (contract: ServiceContract) => {
        setEditingContract(contract);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this contract?')) return;
        try {
            await fetch(`http://localhost:3001/api/contracts/${id}`, { method: 'DELETE' });
            fetchContracts();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDownload = async (attachmentId: string, fileName: string) => {
        // Implement single file download logic
        // We can use the batch download endpoint with a single ID for simplicity if supported, 
        // or a direct download link if we have one.
        // For now, let's trigger the batch download for the single file.
        try {
            const res = await fetch('http://localhost:3001/api/documents/batch-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attachmentIds: [attachmentId] })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`; // The API returns a zip
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    if (loading) return <div className="py-4 text-center text-gray-500">載入合約中...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    委任合約 (Service Contracts)
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-white"
                    onClick={() => { setEditingContract(null); setIsFormOpen(true); }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    新增合約
                </Button>
            </div>

            <div className="p-0">
                {contracts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        尚無合約記錄
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">合約編號</th>
                                    <th className="px-6 py-3">類型</th>
                                    <th className="px-6 py-3">期間</th>
                                    <th className="px-6 py-3">服務費</th>
                                    <th className="px-6 py-3">狀態</th>
                                    <th className="px-6 py-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contracts.map(contract => (
                                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {contract.contractNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 capitalize">
                                            {contract.type === 'recruitment' ? '招募' : contract.type}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {format(new Date(contract.startDate), 'yyyy/MM/dd')} - {format(new Date(contract.endDate), 'yyyy/MM/dd')}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            ${contract.serviceFee.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${contract.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    contract.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {contract.status === 'active' ? '有效' :
                                                    contract.status === 'expired' ? '過期' : contract.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            {contract.attachments.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title={contract.attachments[0].fileName}
                                                    onClick={() => handleDownload(contract.attachments[0].id, contract.attachments[0].fileName)}
                                                >
                                                    <Download className="w-4 h-4 text-blue-600" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(contract)}
                                            >
                                                <FileText className="w-4 h-4 text-gray-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(contract.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <ContractForm
                    employerId={employerId}
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={fetchContracts}
                    initialData={editingContract}
                />
            )}
        </div>
    );
}
