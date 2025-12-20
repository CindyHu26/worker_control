import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";

// 輔助樣式：模仿舊系統的表格 Header 背景色，但用現代的灰色調
const labelStyle = "bg-slate-100 text-slate-600 font-medium p-2 border-r border-b text-sm flex items-center";
const valueStyle = "p-2 border-b text-sm text-slate-900 border-r-0 md:border-r";

export default function EmployerSummaryBoard({ data }: { data: any }) {
    if (!data) return null;

    return (
        <Card className="mb-6 shadow-sm border-t-4 border-t-blue-600">
            <CardHeader className="py-3 px-4 bg-slate-50/50 border-b flex flex-row justify-between items-center">
                <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">
                        {data.basic.shortName || data.basic.name}
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({data.basic.code ? `${data.basic.code} / ` : ''}{data.basic.taxId})
                        </span>
                    </CardTitle>
                </div>
                {/* 右上角直接顯示最關鍵的數字：在台人數 */}
                <Badge variant="outline" className="text-base px-3 py-1 bg-white">
                    <Users className="w-4 h-4 mr-2 text-green-600" />
                    在台移工: <span className="ml-1 font-bold text-green-600">{data.stats.activeWorkers}</span> 人
                </Badge>
            </CardHeader>

            <CardContent className="p-0">
                {/* CSS Grid: 手機單欄，平板雙欄(舊系統樣式)，電腦四欄 */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 border-l border-r border-b">

                    {/* 第一列：基本聯絡 */}
                    <div className={labelStyle}>負責人</div>
                    <div className={valueStyle}>{data.basic.responsiblePerson}</div>

                    <div className={labelStyle}>聯絡電話</div>
                    <div className={valueStyle}>{data.basic.phone}</div>

                    <div className={labelStyle}>傳真號碼</div>
                    <div className={valueStyle}>{data.basic.fax || '-'}</div>

                    {/* 第二列：證號資訊 (工廠/機構才有的) */}
                    <div className={labelStyle}>勞保證號</div>
                    <div className={valueStyle}>{data.biz.laborInsNo || '-'}</div>

                    <div className={labelStyle}>健保代號</div>
                    <div className={valueStyle}>{data.biz.healthInsNo || '-'}</div>

                    <div className={labelStyle}>工廠登記</div>
                    <div className={valueStyle}>{data.biz.factoryReg || '無 (家庭類)'}</div>

                    {/* 第三列：地址 (佔滿整行) */}
                    <div className={labelStyle}>通訊地址</div>
                    <div className={`p-2 border-b text-sm md:col-span-5`}>
                        {data.basic.address}
                    </div>

                    {/* 第四列：統計與歸屬 (High Value Info) */}
                    <div className={`${labelStyle} bg-blue-50 text-blue-800`}>可用名額</div>
                    <div className="p-2 border-b text-sm font-bold text-blue-700 md:border-r">
                        {data.stats.quotaLeft} <span className="text-xs font-normal text-slate-400">/ {data.stats.quotaTotal}</span>
                    </div>

                    <div className={labelStyle}>業務人員</div>
                    <div className={valueStyle}>{data.meta.assignee}</div>

                    <div className={labelStyle}>所屬仲介</div>
                    <div className={valueStyle}>{data.meta.agency}</div>
                </div>
            </CardContent>
        </Card>
    );
}
