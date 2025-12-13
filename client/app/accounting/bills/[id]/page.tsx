"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    FileText, DollarSign, Calendar, User, Building2,
    CheckCircle, XCircle, Clock, Receipt, AlertCircle,
    ArrowLeft, Printer
} from 'lucide-react';

interface Bill {
    id: string;
    billNo: string;
    payerType: string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
    billingDate: string;
    dueDate: string;
    year: number;
    month: number;
    invoiceNumber?: string;
    worker?: {
        id: string;
        englishName: string;
        chineseName: string;
    };
    employer?: {
        id: string;
        companyName: string;
        taxId: string;
    };
    items: Array<{
        id: string;
        description: string;
        amount: number;
        feeCategory: string;
    }>;
    invoice?: {
        id: string;
        invoiceNumber: string;
        invoiceDate: string;
        status: string;
        totalAmount: number;
        buyerName?: string;
        buyerIdentifier?: string;
        randomCode?: string;
    };
}

export default function BillDetailPage() {
    const params = useParams();
    const router = useRouter();
    const billId = params.id as string;

    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(false);

    useEffect(() => {
        fetchBillDetail();
    }, [billId]);

    const fetchBillDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/accounting/bills/${billId}`);
            if (res.ok) {
                const data = await res.json();
                setBill(data);
            } else {
                alert('Failed to load bill');
            }
        } catch (error) {
            console.error(error);
            alert('Error loading bill');
        } finally {
            setLoading(false);
        }
    };

    const handleIssueInvoice = async () => {
        if (!bill) return;

        const confirmed = confirm(`確定要為帳單 ${bill.billNo} 開立發票嗎？\n\nAre you sure you want to issue an invoice for bill ${bill.billNo}?`);
        if (!confirmed) return;

        setIssuing(true);
        try {
            const res = await fetch(`http://localhost:3001/api/accounting/bills/${billId}/issue-invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Optional parameters for invoice customization
                    printMark: 'N',
                    carrierType: '',
                    donation: '0'
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`發票開立成功！\n\nInvoice issued successfully!\nInvoice Number: ${data.invoiceNumber}`);
                fetchBillDetail(); // Refresh to show invoice
            } else {
                const err = await res.json();
                alert(`發票開立失敗: ${err.error}\n\nFailed to issue invoice: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error issuing invoice');
        } finally {
            setIssuing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertCircle size={48} className="text-slate-300" />
                <p className="text-slate-500">Bill not found</p>
                <button onClick={() => router.back()} className="text-blue-600 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        draft: 'bg-slate-100 text-slate-700',
        issued: 'bg-blue-100 text-blue-700',
        paid: 'bg-green-100 text-green-700',
        overdue: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-500'
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    返回 Back
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            帳單明細 Bill Detail
                        </h1>
                        <p className="text-slate-500 font-mono text-lg">{bill.billNo}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusColors[bill.status] || statusColors.draft}`}>
                        {bill.status.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Bill Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Payer Info */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        {bill.payerType === 'worker' ? <User size={18} /> : <Building2 size={18} />}
                        付款人 Payer
                    </h3>
                    {bill.worker && (
                        <div>
                            <p className="text-lg font-bold text-slate-900">{bill.worker.chineseName}</p>
                            <p className="text-slate-600">{bill.worker.englishName}</p>
                            <p className="text-xs text-slate-400 mt-2">Worker ID: {bill.worker.id.substring(0, 8)}</p>
                        </div>
                    )}
                    {bill.employer && (
                        <div>
                            <p className="text-lg font-bold text-slate-900">{bill.employer.companyName}</p>
                            <p className="text-slate-600">統編 Tax ID: {bill.employer.taxId}</p>
                        </div>
                    )}
                </div>

                {/* Amount Info */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 shadow-lg text-white">
                    <h3 className="text-sm font-bold uppercase mb-4 opacity-90">總金額 Total Amount</h3>
                    <p className="text-4xl font-bold mb-4">NT$ {Number(bill.totalAmount).toLocaleString()}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="opacity-75">已付 Paid</p>
                            <p className="font-bold">NT$ {Number(bill.paidAmount).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="opacity-75">餘額 Balance</p>
                            <p className="font-bold">NT$ {Number(bill.balance).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <Calendar size={18} />
                        日期 Dates
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-500">帳單日期 Billing Date</p>
                            <p className="font-bold text-slate-900">{new Date(bill.billingDate).toLocaleDateString('zh-TW')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">到期日 Due Date</p>
                            <p className="font-bold text-slate-900">{new Date(bill.dueDate).toLocaleDateString('zh-TW')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">帳期 Period</p>
                            <p className="font-bold text-slate-900">{bill.year}/{String(bill.month).padStart(2, '0')}</p>
                        </div>
                    </div>
                </div>

                {/* Invoice Status Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <Receipt size={18} />
                        發票狀態 Invoice Status
                    </h3>

                    {bill.invoice ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle size={20} />
                                <span className="font-bold">已開立 Issued</span>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                                <div>
                                    <p className="text-xs text-green-700">發票號碼 Invoice Number</p>
                                    <p className="font-mono font-bold text-green-900">{bill.invoice.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-green-700">開立日期 Issue Date</p>
                                    <p className="font-bold text-green-900">
                                        {new Date(bill.invoice.invoiceDate).toLocaleDateString('zh-TW')}
                                    </p>
                                </div>
                                {bill.invoice.randomCode && (
                                    <div>
                                        <p className="text-xs text-green-700">隨機碼 Random Code</p>
                                        <p className="font-mono font-bold text-green-900">{bill.invoice.randomCode}</p>
                                    </div>
                                )}
                            </div>
                            <button
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                            >
                                <Printer size={18} />
                                列印發票 Print Invoice
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                                <XCircle size={20} />
                                <span className="font-bold">尚未開立 Not Issued</span>
                            </div>
                            <p className="text-sm text-slate-500">
                                此帳單尚未開立電子發票
                                <br />
                                This bill has no invoice yet.
                            </p>
                            <button
                                onClick={handleIssueInvoice}
                                disabled={issuing || bill.status === 'cancelled'}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {issuing ? (
                                    <>
                                        <Clock size={18} className="animate-spin" />
                                        開立中 Issuing...
                                    </>
                                ) : (
                                    <>
                                        <Receipt size={18} />
                                        開立發票 Issue Invoice
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bill Items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                        <FileText size={18} />
                        帳單項目 Bill Items
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                            <tr>
                                <th className="p-4">項目 Description</th>
                                <th className="p-4">類別 Category</th>
                                <th className="p-4 text-right">金額 Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bill.items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 text-slate-900">{item.description}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                            {item.feeCategory}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                                        NT$ {Number(item.amount).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                            <tr>
                                <td colSpan={2} className="p-4 text-right font-bold text-slate-700">
                                    總計 Total
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-lg text-slate-900">
                                    NT$ {Number(bill.totalAmount).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
