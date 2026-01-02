'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PageContainer, { TableWrapper } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Trash2, Lock, Database } from 'lucide-react';
import { toast } from 'sonner';

interface ReferenceItem {
    id: string;
    category: string;
    code: string;
    label: string;
    labelEn?: string;
    sortOrder: number;
    isSystem: boolean;
    isActive: boolean;
}

// Category display names (can be extended)
const CATEGORY_LABELS: Record<string, string> = {
    'BUSINESS_CONTRACT_TYPE': '合約類別 (Contract Types)',
    'RECRUITMENT_TYPE': '招募類型 (Recruitment Types)',
    'NATIONALITY': '國籍 (Nationalities)',
};

export default function ReferencesPage() {
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [items, setItems] = useState<ReferenceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        label: '',
        labelEn: '',
        sortOrder: 0
    });

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/reference/categories');
            const data = await res.json();
            setCategories(data);
            if (data.length > 0 && !selectedCategory) {
                setSelectedCategory(data[0]);
            }
        } catch (error) {
            toast.error('無法載入分類列表');
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    // Fetch items for selected category
    const fetchItems = useCallback(async (category: string) => {
        setItemsLoading(true);
        try {
            const res = await fetch(`/api/reference/items/${category}`);
            const data = await res.json();
            setItems(data);
        } catch (error) {
            toast.error('無法載入項目資料');
        } finally {
            setItemsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (selectedCategory) {
            fetchItems(selectedCategory);
        }
    }, [selectedCategory, fetchItems]);

    // Handle add/edit
    const handleOpenDialog = (item?: ReferenceItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                code: item.code,
                label: item.label,
                labelEn: item.labelEn || '',
                sortOrder: item.sortOrder
            });
        } else {
            setEditingItem(null);
            setFormData({ code: '', label: '', labelEn: '', sortOrder: 0 });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedCategory) return;

        try {
            if (editingItem) {
                // Update
                const res = await fetch(`/api/reference/items/${selectedCategory}/${editingItem.code}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) throw new Error('Update failed');
                toast.success('更新成功');
            } else {
                // Create
                const res = await fetch(`/api/reference/items/${selectedCategory}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Create failed');
                }
                toast.success('新增成功');
            }
            setDialogOpen(false);
            fetchItems(selectedCategory);
        } catch (error: any) {
            toast.error(error.message || '操作失敗');
        }
    };

    const handleDelete = async (item: ReferenceItem) => {
        if (item.isSystem) {
            toast.error('系統項目無法刪除');
            return;
        }
        if (!confirm(`確定要刪除「${item.label}」嗎？`)) return;

        try {
            const res = await fetch(`/api/reference/items/${item.category}/${item.code}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Delete failed');
            toast.success('刪除成功');
            if (selectedCategory) fetchItems(selectedCategory);
        } catch (error) {
            toast.error('刪除失敗');
        }
    };

    return (
        <PageContainer
            title="主檔資料管理 (Master Data Management)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '系統設定', href: '/system' },
                { label: '主檔資料管理' }
            ]}
        >
            <div className="flex gap-6">
                {/* Category Sidebar */}
                <Card className="w-64 shrink-0">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            資料分類
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">載入中...</div>
                        ) : (
                            <div className="space-y-1">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {CATEGORY_LABELS[cat] || cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="mb-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">
                            {selectedCategory ? (CATEGORY_LABELS[selectedCategory] || selectedCategory) : '請選擇分類'}
                        </h2>
                        {selectedCategory && (
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="mr-2 h-4 w-4" />
                                新增項目
                            </Button>
                        )}
                    </div>

                    {itemsLoading ? (
                        <div className="text-center py-8 text-gray-500">載入中...</div>
                    ) : (
                        <TableWrapper>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">代碼</TableHead>
                                        <TableHead>名稱</TableHead>
                                        <TableHead className="w-[150px]">英文名稱</TableHead>
                                        <TableHead className="w-[80px]">排序</TableHead>
                                        <TableHead className="w-[80px]">類型</TableHead>
                                        <TableHead className="w-[100px] text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                尚無資料
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono">{item.code}</TableCell>
                                                <TableCell>{item.label}</TableCell>
                                                <TableCell className="text-gray-500">{item.labelEn}</TableCell>
                                                <TableCell>{item.sortOrder}</TableCell>
                                                <TableCell>
                                                    {item.isSystem ? (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Lock className="h-3 w-3" />
                                                            系統
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">自訂</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenDialog(item)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={item.isSystem ? 'opacity-30 cursor-not-allowed' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}
                                                            onClick={() => handleDelete(item)}
                                                            disabled={item.isSystem}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableWrapper>
                    )}
                </div>
            </div>

            {/* Edit/Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? '編輯項目' : '新增項目'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">代碼 (Code)</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                disabled={!!editingItem}
                                placeholder="e.g., FULL_SERVICE"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="label">名稱 (中文)</Label>
                            <Input
                                id="label"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                placeholder="e.g., 全權委託"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="labelEn">名稱 (English)</Label>
                            <Input
                                id="labelEn"
                                value={formData.labelEn}
                                onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                                placeholder="e.g., Full Service"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sortOrder">排序</Label>
                            <Input
                                id="sortOrder"
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSave}>儲存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
