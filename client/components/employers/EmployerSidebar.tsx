import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Info, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MissingItem {
    id: string;
    label: string;
    sectionId: string;
}

interface EmployerSidebarProps {
    completeness: number;
    missingItems: MissingItem[];
    impacts: {
        title: string;
        description: string;
        level: 'error' | 'warning' | 'info';
    }[];
    onScrollTo?: (sectionId: string) => void;
}

export function EmployerSidebar({ completeness, missingItems, impacts, onScrollTo }: EmployerSidebarProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 text-center">資料完整度</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className={cn(
                            completeness < 50 ? "text-red-500" :
                                completeness < 90 ? "text-amber-500" : "text-green-500"
                        )}>
                            {completeness < 100 ? "資料不足" : "資料完整"}
                        </span>
                        <span>{completeness}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500 ease-in-out",
                                completeness < 50 ? "bg-red-500" :
                                    completeness < 90 ? "bg-amber-500" : "bg-green-500"
                            )}
                            style={{ width: `${completeness}%` }}
                        />
                    </div>
                    <div className="bg-gray-50/50 rounded-lg p-3 border border-dashed border-gray-200">
                        <p className="text-xs text-gray-400 mb-2 font-medium">尚未完成項目 ({missingItems.length})</p>
                        <div className="space-y-1">
                            {missingItems.length === 0 ? (
                                <p className="text-xs text-green-600">已全部完成！</p>
                            ) : (
                                missingItems.slice(0, 5).map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => onScrollTo?.(item.sectionId)}
                                        className="w-full flex items-center justify-between text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-white p-1.5 rounded transition-colors group"
                                    >
                                        <span>• {item.label}</span>
                                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))
                            )}
                            {missingItems.length > 5 && (
                                <p className="text-[10px] text-gray-400 text-center mt-1">以及其他 {missingItems.length - 5} 項...</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 font-medium text-sm px-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>缺漏影響分析</span>
                </div>

                {impacts.map((impact, index) => (
                    <div key={index} className={cn(
                        "p-3 rounded-lg border flex gap-3 shadow-sm",
                        impact.level === 'error' ? "bg-red-50/50 border-red-100" :
                            impact.level === 'warning' ? "bg-amber-50/50 border-amber-100" :
                                "bg-blue-50/50 border-blue-100"
                    )}>
                        <div className="mt-0.5 shrink-0">
                            {impact.level === 'error' && <AlertCircle className="h-4 w-4 text-red-600 font-bold" />}
                            {impact.level === 'warning' && <AlertCircle className="h-4 w-4 text-amber-600" />}
                            {impact.level === 'info' && <Info className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="space-y-1">
                            <h4 className={cn(
                                "text-sm font-semibold",
                                impact.level === 'error' ? "text-red-900" :
                                    impact.level === 'warning' ? "text-amber-900" :
                                        "text-blue-900"
                            )}>{impact.title}</h4>
                            <p className={cn(
                                "text-xs leading-relaxed",
                                impact.level === 'error' ? "text-red-700/80" :
                                    impact.level === 'warning' ? "text-amber-700/80" :
                                        "text-blue-700/80"
                            )}>{impact.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t space-y-4">
                <p className="text-xs font-medium text-gray-500 px-2">檔案工具</p>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 hover:border-blue-100 cursor-pointer text-blue-600 transition-all shadow-sm">
                        <CheckCircle2 className="h-5 w-5 mb-1" />
                        <span className="text-[10px] text-gray-600">上傳證件</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 hover:border-purple-100 cursor-pointer text-purple-600 transition-all shadow-sm">
                        <AlertCircle className="h-5 w-5 mb-1" />
                        <span className="text-[10px] text-gray-600">變更紀錄</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
