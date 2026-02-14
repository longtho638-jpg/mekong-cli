"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, DollarSign, Users, Activity, CreditCard, Loader2 } from "lucide-react"
import { useRealtimeMetrics } from "@/hooks/useRealtimeMetrics"

export function LiveMetrics() {
    const {
        totalRevenue,
        totalOrders,
        activeFarmers,
        activeCustomers,
        isLoading,
        lastUpdate,
        error
    } = useRealtimeMetrics();

    // Calculate derived metrics
    const totalActiveUsers = activeFarmers + activeCustomers;
    const conversionRate = totalOrders > 0 && totalActiveUsers > 0
        ? Math.min(((totalOrders / totalActiveUsers) * 100), 100).toFixed(1)
        : "0.0";

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    const formatTime = (date: Date | null) =>
        date ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

    return (
        <div className="space-y-4">
            {/* Live Status Indicator */}
            <div className="flex items-center justify-end gap-2 text-xs text-stone-500">
                {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
                <span className="font-mono">
                    {error ? `[Error: ${error}]` : `LIVE • Updated ${formatTime(lastUpdate)}`}
                </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-stone-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng Doanh Thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-stone-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : formatCurrency(totalRevenue)}
                        </div>
                        <p className="text-xs text-stone-500 flex items-center">
                            <span className="text-emerald-500 flex items-center mr-1">
                                LIVE <ArrowUpRight className="h-3 w-3" />
                            </span>
                            từ Supabase
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đơn Hàng</CardTitle>
                        <CreditCard className="h-4 w-4 text-stone-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : totalOrders}
                        </div>
                        <p className="text-xs text-stone-500 flex items-center">
                            <span className="text-emerald-500 flex items-center mr-1">
                                LIVE <ArrowUpRight className="h-3 w-3" />
                            </span>
                            real-time
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Users Hoạt Động</CardTitle>
                        <Activity className="h-4 w-4 text-stone-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : totalActiveUsers}
                        </div>
                        <p className="text-xs text-stone-500">
                            {activeFarmers} farmers + {activeCustomers} customers
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-stone-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Users className="h-4 w-4 text-stone-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : `${conversionRate}%`}
                        </div>
                        <p className="text-xs text-stone-500">
                            orders / active users
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
