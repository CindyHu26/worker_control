
import React from 'react';
import { format, addMonths, isValid } from 'date-fns';
import { Check, AlertCircle, Clock, Plane } from 'lucide-react';

interface HealthTimelineProps {
    entryDate: string | Date | null;
    checks: any[]; // List of health checks for this deployment
    currentStatus?: string;
}

const HealthTimeline: React.FC<HealthTimelineProps> = ({ entryDate, checks }) => {
    if (!entryDate) return <div className="text-gray-400 text-sm">無入境日期資料，無法顯示時程</div>;

    const baseDate = new Date(entryDate);
    if (!isValid(baseDate)) return <div className="text-red-400 text-sm">入境日期格式錯誤</div>;

    // Define milestones
    const milestones = [
        { label: '入境健檢', monthOffset: 0, icon: Plane, type: 'entry' },
        { label: '6個月定期', monthOffset: 6, icon: Clock, type: '6mo' },
        { label: '18個月定期', monthOffset: 18, icon: Clock, type: '18mo' },
        { label: '30個月定期', monthOffset: 30, icon: Clock, type: '30mo' },
    ];

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">合約與體檢時程</h3>

            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded"></div>

                <div className="flex justify-between relative">
                    {milestones.map((milestone, index) => {
                        const targetDate = addMonths(baseDate, milestone.monthOffset);
                        // Find matching check record
                        const checkRecord = checks.find(c => c.checkType === milestone.type);

                        let statusColor = 'bg-gray-200 text-gray-400';
                        let borderColor = 'border-white';
                        let statusText = `${format(targetDate, 'yyyy/MM')} 預計`;

                        if (checkRecord) {
                            if (checkRecord.status === 'completed') {
                                if (checkRecord.result === 'pass') {
                                    statusColor = 'bg-green-500 text-white';
                                    statusText = '已完成 (合格)';
                                } else if (checkRecord.result === 'fail' || checkRecord.result === 'needs_recheck') {
                                    statusColor = 'bg-red-500 text-white';
                                    statusText = '異常追蹤中';
                                } else {
                                    statusColor = 'bg-green-100 text-green-600';
                                    statusText = '檢查完成';
                                }
                            } else if (checkRecord.status === 'scheduled') {
                                statusColor = 'bg-blue-500 text-white';
                                statusText = '已預約';
                            } else {
                                statusColor = 'bg-amber-100 text-amber-600 border-amber-300';
                                statusText = '待安排';
                            }
                        } else if (new Date() > targetDate) {
                            statusColor = 'bg-red-100 text-red-400';
                            statusText = '已逾期 (無紀錄)';
                        } else if (milestone.monthOffset === 0) {
                            // Entry check is usually implied done if they are here, but strictly...
                            statusColor = 'bg-green-500 text-white';
                            statusText = '入境已完成';
                        }

                        const Icon = milestone.icon;

                        return (
                            <div key={index} className="flex flex-col items-center z-10 w-24">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${borderColor} ${statusColor} mb-2 shadow-sm transition-all`}>
                                    {checkRecord?.result === 'fail' ? <AlertCircle size={18} /> : <Icon size={18} />}
                                </div>
                                <div className="text-sm font-bold text-gray-800 text-center">{milestone.label}</div>
                                <div className={`text-xs text-center mt-1 font-medium ${checkRecord?.status === 'completed' && checkRecord?.result === 'pass' ? 'text-green-600' : checkRecord?.result === 'fail' ? 'text-red-500' : 'text-gray-400'}`}>
                                    {statusText}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default HealthTimeline;
