"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2, Globe2, Plus, Phone, Mail, MapPin,
    FileText, CheckCircle2, Star, Trash2, Edit2, X,
    CreditCard, Image as ImageIcon, ShieldCheck
} from 'lucide-react';

// Types
interface AgencyCompany {
    id: string;
    name: string;
    licenseNo: string;
    taxId: string;
    responsiblePerson: string;
    address?: string;
    phone?: string;
    fax?: string;
    email?: string;
    isDefault: boolean;
    // New Fields
    agencyCode?: string;
    licenseExpiryDate?: string;
    // Bilingual
    nameEn?: string;
    addressEn?: string;
    representativeEn?: string;
    bankName?: string;
    bankCode?: string;
    bankBranch?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
    sealLargeUrl?: string;
    sealSmallUrl?: string;
    logoUrl?: string;
}

interface ForeignAgency {
    id: string;
    name: string;
    chineseName?: string;
    country: string; // VN, ID, PH, TH
    code?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
}

export default function AgencySettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'internal' | 'foreign'>('internal');
    const [internalAgencies, setInternalAgencies] = useState<AgencyCompany[]>([]);
    const [foreignAgencies, setForeignAgencies] = useState<ForeignAgency[]>([]);
    const [loading, setLoading] = useState(true);

    // Foreign Modal State (kept for foreign agencies)
    const [showForeignModal, setShowForeignModal] = useState(false);
    const [foreignForm, setForeignForm] = useState<Partial<ForeignAgency>>({ country: 'VN' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const [internalRes, foreignRes] = await Promise.all([
                fetch(`${apiUrl}/settings/agency-companies`),
                fetch(`${apiUrl}/settings/foreign-agencies`)
            ]);

            if (internalRes.ok) setInternalAgencies(await internalRes.json());
            if (foreignRes.ok) setForeignAgencies(await foreignRes.json());
        } catch (error) {
            console.error('Failed to fetch agency data', error);
        } finally {
            setLoading(false);
        }
    };



    const handleCreateForeign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${apiUrl}/settings/foreign-agencies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(foreignForm)
            });
            if (res.ok) {
                setShowForeignModal(false);
                setForeignForm({ country: 'VN' });
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiUrl}/settings/agency-companies/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true })
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const getCountryFlag = (code: string) => {
        switch (code) {
            case 'VN': return '🇻🇳';
            case 'ID': return '🇮🇩';
            case 'PH': return '🇵🇭';
            case 'TH': return '🇹🇭';
            default: return '🌐';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">仲介資料管理</h1>
                <p className="text-gray-500 mt-2">設定我方公司資料與國外合作仲介</p>
            </header>

            {/* Main Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('internal')}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium border-b-2 transition-colors ${activeTab === 'internal'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Building2 size={18} />
                    我方公司資料 (My Agencies)
                </button>
                <button
                    onClick={() => setActiveTab('foreign')}
                    className={`pb-3 px-4 flex items-center gap-2 font-medium border-b-2 transition-colors ${activeTab === 'foreign'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Globe2 size={18} />
                    國外仲介管理 (Foreign Partners)
                </button>
            </div>

            {/* Content */}
            {activeTab === 'internal' ? (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => router.push('/settings/agencies/new')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all shadow-sm"
                        >
                            <Plus size={18} /> 新增公司
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {internalAgencies.map(agency => (
                            <div key={agency.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${agency.isDefault ? 'border-blue-500 ring-2 ring-blue-50' : 'border-transparent hover:border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                        <Building2 size={24} />
                                    </div>
                                    {agency.isDefault ? (
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle2 size={12} /> DEFAULT
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleSetDefault(agency.id)}
                                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                                            title="Set as Default"
                                        >
                                            <Star size={20} />
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-1">{agency.name}</h3>
                                <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 font-mono">Tax: {agency.taxId}</span>
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 font-mono">Lic: {agency.licenseNo}</span>
                                    {agency.agencyCode && <span className="bg-blue-50 px-2 py-0.5 rounded text-xs text-blue-600 font-mono">Code: {agency.agencyCode}</span>}
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span className="line-clamp-1">{agency.address || 'No Address'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        <span>{agency.phone || 'No Phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-gray-400" />
                                        <span className="line-clamp-1">{agency.email || 'No Email'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-gray-400" />
                                        <span>Rep: {agency.responsiblePerson}</span>
                                    </div>
                                    {agency.bankName && (
                                        <div className="flex items-center gap-2 text-blue-600 mt-2 pt-2 border-t border-dashed">
                                            <CreditCard size={14} />
                                            <span>{agency.bankName} ({agency.bankCode})</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t flex gap-2">
                                    <button
                                        onClick={() => router.push(`/settings/agencies/${agency.id}`)}
                                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 transition-all text-sm font-medium"
                                    >
                                        <Edit2 size={14} />
                                        編輯
                                    </button>
                                </div>
                            </div>
                        ))}

                        {internalAgencies.length === 0 && !loading && (
                            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-500">尚無公司資料</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowForeignModal(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all shadow-sm"
                        >
                            <Plus size={18} /> 新增國外仲介
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {foreignAgencies.map(agency => (
                                    <tr key={agency.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{getCountryFlag(agency.country)}</span>
                                                <span className="font-bold text-gray-700">{agency.country}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                                            {agency.chineseName && <div className="text-xs text-gray-500">{agency.chineseName}</div>}
                                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit mt-1 font-mono">{agency.code || 'NO CODE'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{agency.contactPerson || '-'}</span>
                                                </div>
                                                {agency.email && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Mail size={12} /> {agency.email}
                                                    </div>
                                                )}
                                                {agency.phone && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Phone size={12} /> {agency.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            -
                                        </td>
                                    </tr>
                                ))}
                                {foreignAgencies.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            尚無國外仲介資料
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Foreign Modal (Unchanged) */}
            {showForeignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50">
                            <h2 className="text-xl font-bold text-green-800">新增國外仲介</h2>
                            <button onClick={() => setShowForeignModal(false)} className="text-green-800/50 hover:text-green-900">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateForeign} className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-gray-700">名稱 (English) *</label>
                                    <input required className="w-full border rounded-lg px-3 py-2"
                                        value={foreignForm.name || ''} onChange={e => setForeignForm({ ...foreignForm, name: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">國別</label>
                                    <select className="w-full border rounded-lg px-3 py-2 bg-white"
                                        value={foreignForm.country} onChange={e => setForeignForm({ ...foreignForm, country: e.target.value })}
                                    >
                                        <option value="VN">越南</option>
                                        <option value="ID">印尼</option>
                                        <option value="PH">菲律賓</option>
                                        <option value="TH">泰國</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">中文名稱</label>
                                    <input className="w-full border rounded-lg px-3 py-2"
                                        value={foreignForm.chineseName || ''} onChange={e => setForeignForm({ ...foreignForm, chineseName: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">代碼 (Code)</label>
                                    <input className="w-full border rounded-lg px-3 py-2" placeholder="e.g. VNM01"
                                        value={foreignForm.code || ''} onChange={e => setForeignForm({ ...foreignForm, code: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">聯絡人</label>
                                    <input className="w-full border rounded-lg px-3 py-2"
                                        value={foreignForm.contactPerson || ''} onChange={e => setForeignForm({ ...foreignForm, contactPerson: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">電話</label>
                                    <input className="w-full border rounded-lg px-3 py-2"
                                        value={foreignForm.phone || ''} onChange={e => setForeignForm({ ...foreignForm, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">電子郵件</label>
                                <input type="email" className="w-full border rounded-lg px-3 py-2"
                                    value={foreignForm.email || ''} onChange={e => setForeignForm({ ...foreignForm, email: e.target.value })} />
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowForeignModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">新增</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
