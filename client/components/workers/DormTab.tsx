import { Home, Bed, Info } from 'lucide-react';

interface DormTabProps {
    worker: any;
}

export default function DormTab({ worker }: DormTabProps) {
    // Current Dorm Info
    const dorm = worker.dormitory;
    const bed = worker.bed;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <Home className="text-blue-600" /> 宿舍管理 (Dormitory)
                </h3>
                {/* Future: Add 'Change Bed' / 'Assign Dorm' Action */}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                {!dorm ? (
                    <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                        <Home size={48} className="mb-2 opacity-20" />
                        <h4 className="text-lg font-medium">尚未分配宿舍</h4>
                        <p className="text-sm">No dormitory assigned.</p>
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

                                {bed?.room?.meters && bed.room.meters.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <label className="block text-xs font-semibold text-slate-500 mb-2">房內電錶 (Room Meters)</label>
                                        <div className="flex gap-2">
                                            {bed.room.meters.map((m: any) => (
                                                <span key={m.id} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                                                    {m.meterName} (${Number(m.ratePerUnit)}/unit)
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 text-blue-800 p-4 rounded flex items-start gap-3 text-sm">
                <Info size={16} className="mt-0.5" />
                <div>
                    需調整宿舍請前往 <a href="/dormitories" className="underline font-bold">宿舍管理中心</a> 進行床位調度與異動。
                    <br />
                    To change bed assignment, please visit the Dormitory Management Center.
                </div>
            </div>
        </div>
    );
}
