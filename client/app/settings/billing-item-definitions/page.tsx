'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { toast } from 'sonner';

interface BillingItemDefinition {
    id: string;
    code: string;
    name: string;
    nameEn?: string;
    category: string;
    isSystem: boolean;
    isActive: boolean;
    sortOrder: number;
}

const categoryLabels: Record<string, string> = {
    SERVICE_FEE: '服務費',
    ARC_FEE: '居留證費',
    HEALTH_CHECK_FEE: '體檢費',
    DORMITORY_FEE: '膳宿費',
    MEDICAL_FEE: '醫療費',
    INSURANCE_FEE: '保險費',
    AIRPORT_PICKUP: '接機費',
    TRAINING_FEE: '訓練費',
    PLACEMENT_FEE: '仲介費',
    STABILIZATION_FEE: '安定費',
    ADMIN_FEE: '行政費',
    OTHER_FEE: '其他費用',
};

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));

export default function BillingItemDefinitionsPage() {
    const [items, setItems] = useState<BillingItemDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<{
        code: string;
        name: string;
        nameEn?: string;
        category: string;
        sortOrder: number;
    }>();

    const fetchItems = async () => {
        try {
            const data = await apiGet<BillingItemDefinition[]>('/api/billing-item-definitions');
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch billing item definitions:', error);
            // Error toast handled globally by apiRequest
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const onSubmit = async (data: any) => {
        try {
            const url = editingId
                ? `/api/billing-item-definitions/${editingId}`
                : '/api/billing-item-definitions';

            const payload = {
                ...data,
                sortOrder: parseInt(data.sortOrder) || 0
            };

            if (editingId) {
                await apiPut(url, payload);
            } else {
                await apiPost(url, payload);
            }

            toast.success(editingId ? '更新成功' : '新增成功');
            await fetchItems();
            reset();
            setShowForm(false);
            setEditingId(null);
        } catch (error) {
            console.error('Failed to save:', error);
            // Error toast handled globally
        }
    };

    const handleEdit = (item: BillingItemDefinition) => {
        setEditingId(item.id);
        setValue('code', item.code);
        setValue('name', item.name);
        setValue('nameEn', item.nameEn || '');
        setValue('category', item.category);
        setValue('sortOrder', item.sortOrder);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此帳款科目嗎？')) return;

        try {
            await apiDelete(`/api/billing-item-definitions/${id}`);
            toast.success('刪除成功');
            await fetchItems();
        } catch (error) {
            console.error('Failed to delete:', error);
            // Error toast handled globally
        }
    };

    const handleToggleActive = async (item: BillingItemDefinition) => {
        try {
            await apiPut(`/api/billing-item-definitions/${item.id}`, { isActive: !item.isActive });
            toast.success(item.isActive ? '已停用' : '已啟用');
            await fetchItems();
        } catch (error) {
            console.error('Failed to toggle:', error);
            // Error toast handled globally
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">載入中...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">帳款科目管理</h1>
                <button
                    onClick={() => {
                        reset();
                        setEditingId(null);
                        setShowForm(!showForm);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {showForm ? '取消' : '新增科目'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingId ? '編輯科目' : '新增科目'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">代碼 *</label>
                            <input
                                {...register('code', { required: '必填' })}
                                disabled={!!editingId}
                                className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                                placeholder="UTILITY"
                            />
                            {errors.code && <span className="text-red-500 text-sm">{errors.code.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">名稱 *</label>
                            <input
                                {...register('name', { required: '必填' })}
                                className="w-full border rounded px-3 py-2"
                                placeholder="水電費"
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">英文名稱</label>
                            <input
                                {...register('nameEn')}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Utility Fee"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">分類 *</label>
                            <select
                                {...register('category', { required: '必填' })}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">請選擇</option>
                                {categoryOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {errors.category && <span className="text-red-500 text-sm">{errors.category.message}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">排序</label>
                            <input
                                {...register('sortOrder')}
                                type="number"
                                className="w-full border rounded px-3 py-2"
                                placeholder="0"
                                defaultValue={0}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            儲存
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                reset();
                                setShowForm(false);
                                setEditingId(null);
                            }}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            取消
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">代碼</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">名稱</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">分類</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">排序</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">狀態</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {items.map(item => (
                            <tr key={item.id} className={!item.isActive ? 'bg-gray-100' : ''}>
                                <td className="px-4 py-3 font-mono text-sm">{item.code}</td>
                                <td className="px-4 py-3">
                                    {item.name}
                                    {item.nameEn && <span className="text-gray-400 text-sm ml-2">({item.nameEn})</span>}
                                    {item.isSystem && (
                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                            系統
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm">{categoryLabels[item.category] || item.category}</td>
                                <td className="px-4 py-3 text-sm">{item.sortOrder}</td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => handleToggleActive(item)}
                                        className={`px-2 py-1 text-xs rounded ${item.isActive
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-200 text-gray-500'
                                            }`}
                                    >
                                        {item.isActive ? '啟用中' : '已停用'}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                        >
                                            編輯
                                        </button>
                                        {!item.isSystem && (
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                刪除
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    尚無帳款科目，請新增
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
