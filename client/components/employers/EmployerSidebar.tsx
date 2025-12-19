import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmployerSidebarProps {
    completeness: number;
    missingItems: string[];
    impacts: {
        title: string;
        description: string;
        level: 'error' | 'warning' | 'info';
    }[];
}

export function EmployerSidebar({ completeness, missingItems, impacts }: EmployerSidebarProps) {
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
                    <div className="bg-gray-100 rounded p-4 text-center">
                        <p className="text-xs text-gray-400">尚未完成必填項</p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>缺漏影響分析</span>
                </div>

                {impacts.map((impact, index) => (
                    <div key={index} className={cn(
                        "p-3 rounded-lg border flex gap-3",
                        impact.level === 'error' ? "bg-red-50 border-red-100" :
                            impact.level === 'warning' ? "bg-amber-50 border-amber-100" :
                                "bg-blue-50 border-blue-100"
                    )}>
                        <div className="mt-0.5">
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
                                impact.level === 'error' ? "text-red-700" :
                                    impact.level === 'warning' ? "text-amber-700" :
                                        "text-blue-700"
                            )}>{impact.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t space-y-4">
                <p className="text-xs font-medium text-gray-500 px-2">常用工具</p>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer text-blue-600">
                        <CheckCircle2 className="h-5 w-5 mb-1" />
                        <span className="text-xs text-gray-600">上傳證件</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer text-purple-600">
                        <AlertCircle className="h-5 w-5 mb-1" />
                        <span className="text-xs text-gray-600">變更紀錄</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
