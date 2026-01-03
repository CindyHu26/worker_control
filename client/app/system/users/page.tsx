"use client";

import React, { useState, useEffect } from 'react';
import StandardPageLayout, { TableWrapper } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Shield, Search, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface User {
    id: string;
    username: string;
    name: string;
    role: string;
    createdAt: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'staff'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('無法載入使用者資料');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Operation failed');
            }

            toast.success(editingUser ? "使用者資料已更新" : "新使用者已建立");

            setIsDialogOpen(false);
            fetchUsers();
            resetForm();
        } catch (error: any) {
            toast.error(error.message || "操作失敗");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此使用者嗎？此動作無法復原。')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success("使用者已移除");
                fetchUsers();
            } else {
                toast.error("刪除失敗");
            }
        } catch (error) {
            console.error('Delete error', error);
            toast.error("操作發生錯誤");
        }
    };

    const openCreateDialog = () => {
        setEditingUser(null);
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '', // Password optional on edit
            name: user.name,
            role: user.role
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ username: '', password: '', name: '', role: 'staff' });
    };

    return (
        <StandardPageLayout
            title="帳號與權限管理"
            subtitle="管理系統使用者帳號、角色指派與存取權限"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '系統設定', href: '/portal' },
                { label: '帳號管理' }
            ]}
            actions={
                <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    新增使用者
                </Button>
            }
        >
            <TableWrapper>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[200px]">使用者名稱</TableHead>
                            <TableHead>姓名</TableHead>
                            <TableHead className="w-[150px]">角色權限</TableHead>
                            <TableHead className="w-[150px]">建立日期</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    載入中...
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    尚無使用者資料
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-gray-50/50 group">
                                    <TableCell className="font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                {user.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            {user.username}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{user.name}</TableCell>
                                    <TableCell>
                                        <span className={`
                                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'}
                                        `}>
                                            {user.role === 'admin' ? '系統管理員' :
                                                user.role === 'manager' ? '經理' : '一般員工'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="編輯"
                                                onClick={() => openEditDialog(user)}
                                            >
                                                <Edit2 className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="刪除"
                                                onClick={() => handleDelete(user.id)}
                                                disabled={user.role === 'admin' && user.username === 'admin'}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableWrapper>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? '編輯使用者' : '新增使用者'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">使用者名稱</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!editingUser}
                                    required
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">角色權限</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="選擇角色" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="staff">一般員工 (Staff)</SelectItem>
                                        <SelectItem value="manager">經理 (Manager)</SelectItem>
                                        <SelectItem value="admin">系統管理員 (Admin)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">姓名</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">密碼 {editingUser && '(若不修改請留空)'}</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    minLength={8}
                                    className="bg-white pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                </Button>
                            </div>
                            {!editingUser && <p className="text-xs text-gray-500">密碼長度至少需 8 個字元</p>}
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">儲存</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </StandardPageLayout>
    );
}
