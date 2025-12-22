import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // 假設路徑

// [新增] 定義資料型別
interface JobOrder {
    id: string;
    registryDate: string | Date; // 根據 API 回傳調整
    centerName?: string;
    vacancyCount: number;
    certificateNo?: string;
    status: string;
}

// [新增] 定義 Props 介面
interface Props {
    employerId: string;
    onSelectOrder: (order: JobOrder) => void;
}

export function JobOrderSelector({ employerId, onSelectOrder }: Props) {
    // 假資料 mockup (實際應從 API 讀取)
    const jobOrders: JobOrder[] = [
        {
            id: 'JO-001',
            registryDate: '2024-11-01',
            centerName: '台中就業中心',
            vacancyCount: 5,
            status: 'certificate_received', // 已拿到求才證明
            certificateNo: '中就字第113000123號'
        },
        {
            id: 'JO-002',
            registryDate: '2024-12-15',
            centerName: '彰化就業中心',
            vacancyCount: 2,
            status: 'processing' // 公告中
        }
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">1. 選擇國內求才依據 (Job Orders)</h3>
            <div className="grid gap-4 md:grid-cols-2">
                {jobOrders.map(order => (
                    <div
                        key={order.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${order.status === 'certificate_received' ? 'border-blue-500 bg-blue-50 hover:bg-blue-100' : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                        onClick={() => order.status === 'certificate_received' && onSelectOrder(order)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-800">{order.centerName}</p>
                                <p className="text-sm text-gray-500">登記日: {order.registryDate as string}</p>
                                <p className="text-sm mt-2">需求人數: <span className="font-bold text-blue-600">{order.vacancyCount} 人</span></p>
                            </div>
                            <Badge
                                variant={order.status === 'certificate_received' ? 'default' : 'secondary'}
                                className={order.status === 'certificate_received' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}
                            >
                                {order.status === 'certificate_received' ? '已有證明' : '公告中'}
                            </Badge>
                        </div>
                        {order.certificateNo && (
                            <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-blue-800">
                                求才證明：{order.certificateNo}
                            </div>
                        )}
                    </div>
                ))}

                {/* 新增按鈕 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-6 cursor-pointer hover:border-blue-500 hover:text-blue-500">
                    + 新增求才登記
                </div>
            </div>
        </div>
    );
}