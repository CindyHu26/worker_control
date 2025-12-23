'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface RelocationNotificationFormProps {
    notification: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RelocationNotificationForm({ notification, onClose, onSuccess }: RelocationNotificationFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            mailingDate: notification.mailingDate ? notification.mailingDate.split('T')[0] : '',
            filingDate: notification.filingDate ? notification.filingDate.split('T')[0] : '',
            receiptDate: notification.receiptDate ? notification.receiptDate.split('T')[0] : '',
            receiptNumber: notification.receiptNumber || '',
            status: notification.status || 'PENDING',
            notes: notification.notes || ''
        }
    });

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch(`http://localhost:3001/api/relocation/notifications/${notification.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to update notification');

            toast.success('Notification updated');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select {...register('status')} className="w-full border p-2 rounded">
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Receipt No.</label>
                    <input {...register('receiptNumber')} className="w-full border p-2 rounded" placeholder="e.g. 112123456" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Mailing Date</label>
                    <input type="date" {...register('mailingDate')} className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Filing Date</label>
                    <input type="date" {...register('filingDate')} className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Receipt Date</label>
                    <input type="date" {...register('receiptDate')} className="w-full border p-2 rounded text-sm" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea {...register('notes')} className="w-full border p-2 rounded h-20" placeholder="Optional remarks..." />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Changes</button>
            </div>
        </form>
    );
}
