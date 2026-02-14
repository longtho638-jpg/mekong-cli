"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CloudSun, TrendingUp, AlertTriangle } from "lucide-react"

const data = [
    { month: "T9", actual: 4000, predicted: 4200 },
    { month: "T10", actual: 3000, predicted: 3100 },
    { month: "T11", actual: 2000, predicted: 2400 },
    { month: "T12", actual: 2780, predicted: 2900 },
    { month: "T1", actual: 1890, predicted: 2100 },
    { month: "T2", actual: 2390, predicted: 2500 },
    { month: "T3", actual: 3490, predicted: 3200 },
]

export function YieldForecast() {
    return (
        <Card className="col-span-4 lg:col-span-3 border-stone-200 dark:border-stone-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CloudSun className="w-5 h-5 text-orange-500" />
                        Dự Báo Sản Lượng (AI)
                    </CardTitle>
                    <p className="text-xs text-stone-500 mt-1">Dựa trên dữ liệu thời tiết & lịch sử</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% so với cùng kỳ
                </Badge>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="month"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                            <Area
                                type="monotone"
                                dataKey="predicted"
                                name="Dự báo (AI)"
                                stroke="#f97316"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPredicted)"
                                strokeDasharray="5 5"
                            />
                            <Area
                                type="monotone"
                                dataKey="actual"
                                name="Thực tế"
                                stroke="#16a34a"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorActual)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-sm text-orange-800 dark:text-orange-200">Cảnh báo thời tiết</h4>
                        <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                            Dự báo có mưa lớn vào tuần sau. AI khuyến nghị thu hoạch sớm 20% sản lượng Cúc Mâm Xôi để tránh hư hại.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
