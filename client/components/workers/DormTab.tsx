import { Home, Bed, Info, History, Mail } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { format } from 'date-fns';
import { useState } from 'react';
import RelocationNotificationForm from './RelocationNotificationForm';

interface DormTabProps {
    worker: any;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DormTab({ worker }: DormTabProps) {
    // Current Dorm Info
    const dorm = worker.dormitory;
    const bed = worker.bed;
    const [editNotif, setEditNotif] = useState<any>(null);

    const { data: history } = useSWR(`/api/relocation/worker/${worker.id}`, fetcher);
    const { data: notifications } = useSWR(`/api/relocation/notifications?workerId=${worker.id}`, fetcher);

    return (
        <div className="space-y-8">
            {/* 1. Current Accommodation Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <Home className="text-blue-600" /> 宿舍管理 (Dormitory)
                    </h3>
                    <a href={`/workers/${worker.id}/relocate`} className="text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">
                        變更住宿 (Relocate)
                    </a>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                    {!dorm ? (
                        <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                            <Home size={48} className="mb-2 opacity-20" />
                            <h4 className="text-lg font-medium">尚未分配宿舍 (Unassigned)</h4>
                            <p className="text-sm">Currently no active dormitory assignment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">DORM</span>
                                    {dorm.name}
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500">地址 (Address)</label>
                                        <p className="text-lg">{dorm.address}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500">房東 / 管理人 (Landlord)</label>
                                        <p className="text-base">{dorm.landlordName} ({dorm.landlordPhone})</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">BED</span>
                                    住宿位置
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded border border-slate-200 text-center min-w-[80px]">
                                            <label className="block text-xs text-slate-400 mb-1">房號 (Room)</label>
                                            <span className="text-xl font-bold text-slate-800">{bed?.room?.roomNumber || '?'}</span>
                                        </div>
                                        <div className="text-slate-300">/</div>
                                        <div className="bg-white p-3 rounded border border-slate-200 text-center min-w-[80px]">
                                            <label className="block text-xs text-slate-400 mb-1">床位 (Bed)</label>
                                            <span className="text-xl font-bold text-slate-800">{bed?.bedCode || '?'}</span>
                                        </div>
                                    </div>
                                    {bed?.isOccupied && (
                                        <span className="inline-block bg-green-100 text-green-600 px-2 py-1 rounded text-xs">Occupied</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Accommodation History */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <History className="text-gray-500" size={20} /> Accommodation History
                    </h3>
                    <div className="space-y-4 relative border-l-2 border-gray-100 ml-2 pl-6">
                        {history?.map((record: any) => (
                            <div key={record.id} className="relative">
                                <span className={`absolute -left-[31px] w-3 h-3 rounded-full border-2 border-white ${record.isCurrent ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                <div className="text-sm">
                                    <p className="font-medium text-slate-900">
                                        {record.dormitoryBed
                                            ? `${record.dormitoryBed.room.dormitory.name} (Room ${record.dormitoryBed.room.roomNumber} - Bed ${record.dormitoryBed.bedCode})`
                                            : record.address || 'External Address'}
                                    </p>
                                    <div className="text-xs text-gray-500 flex gap-2">
                                        <span>{format(new Date(record.startDate), 'yyyy-MM-dd')}</span>
                                        <span>to</span>
                                        <span>{record.endDate ? format(new Date(record.endDate), 'yyyy-MM-dd') : 'Present'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!history || history.length === 0) && (
                            <div className="text-gray-400 text-sm italic">No history records.</div>
                        )}
                    </div>
                </div>

                {/* 3. Relocation Notifications */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Mail className="text-gray-500" size={20} /> Government Notifications
                    </h3>
                    <div className="space-y-3">
                        {notifications?.map((notif: any) => (
                            <div key={notif.id} className="border rounded p-3 text-sm flex justify-between items-start bg-gray-50 group hover:bg-gray-100 transition-colors">
                                <div>
                                    <span className="font-bold block text-slate-700">{notif.notificationType.replace('_', ' ')}</span>
                                    <span className="text-xs text-gray-500 block">Old: {notif.oldAddress || '-'}</span>
                                    <span className="text-xs text-gray-500 block">New: {notif.newAddress || '-'}</span>

                                    <div className="mt-2 flex gap-2 text-xs flex-wrap">
                                        {notif.mailingDate && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Mailed: {format(new Date(notif.mailingDate), 'MM/dd')}</span>}
                                        {notif.receiptDate && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Receipt: {format(new Date(notif.receiptDate), 'MM/dd')}</span>}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col gap-2 items-end">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${notif.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        notif.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {notif.status}
                                    </span>
                                    <button
                                        onClick={() => setEditNotif(notif)}
                                        className="text-xs text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!notifications || notifications.length === 0) && (
                            <div className="text-gray-400 text-sm italic">No notification records.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Notification Modal */}
            {editNotif && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Update Notification</h3>
                            <button onClick={() => setEditNotif(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <RelocationNotificationForm
                            notification={editNotif}
                            onClose={() => setEditNotif(null)}
                            onSuccess={() => {
                                mutate(`/api/relocation/notifications?workerId=${worker.id}`);
                                setEditNotif(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-blue-50 text-blue-800 p-4 rounded flex items-start gap-3 text-sm">
                <Info size={16} className="mt-0.5" />
                <div>
                    Change of residence requires notification to MOL/NIA within 7 days.
                    <br />
                    請務必於 7 日內完成變更住宿通報 (勞動部/移民署)。
                </div>
            </div>
        </div>
    );
}
