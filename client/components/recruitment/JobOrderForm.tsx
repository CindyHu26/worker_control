"use client";

import { useState, useEffect } from 'react';

interface Employer {
    id: string;
    companyName: string;
    taxId: string;
}

interface JobOrderFormProps {
    onSuccess: () => void;
}

export default function JobOrderForm({ onSuccess }: JobOrderFormProps) {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [formData, setFormData] = useState({
        employerId: '',
        requiredWorkers: 1,
        orderDate: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch employers for dropdown
        fetch('http://localhost:3001/api/recruitment/employers/list')
            .then(res => res.json())
            .then(data => setEmployers(data))
            .catch(err => console.error('Failed to load employers', err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('http://localhost:3001/api/recruitment/job-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onSuccess();
                // Reset form slightly but keep date maybe? or reset all
                setFormData({
                    employerId: '',
                    requiredWorkers: 1,
                    orderDate: new Date().toISOString().split('T')[0]
                });
            } else {
                alert('Failed to create Job Order');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating Job Order');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">新增招募單 (New Job Order)</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">雇主名稱 (Employer)</label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.employerId}
                        onChange={e => setFormData({ ...formData, employerId: e.target.value })}
                        required
                    >
                        <option value="">請選擇雇主...</option>
                        {employers.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.companyName} ({emp.taxId})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">需求人數 (Required)</label>
                    <input
                        type="number"
                        min="1"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.requiredWorkers}
                        onChange={e => setFormData({ ...formData, requiredWorkers: parseInt(e.target.value) })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">訂單日期 (Order Date)</label>
                    <input
                        type="date"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.orderDate}
                        onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? '處理中...' : '新增招募單'}
                    </button>
                </div>
            </form>
        </div>
    );
}
