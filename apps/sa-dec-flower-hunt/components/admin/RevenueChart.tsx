"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DailyRevenue } from "@/lib/api/admin";
import { format } from "date-fns";

interface RevenueChartProps {
    data?: DailyRevenue[];
}

export function RevenueChart({ data = [] }: RevenueChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(item => ({
            name: format(new Date(item.date), 'dd/MM'),
            revenue: Number(item.revenue),
            orders: Number(item.order_count)
        }));
    }, [data]);

    // Don't render chart if no data or empty
    if (!chartData || chartData.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center">
                <p className="text-stone-500 text-sm">Đang tải dữ liệu biểu đồ...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[300px] h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#666"
                        style={{ fontSize: '0.75rem' }}
                    />
                    <YAxis
                        stroke="#666"
                        style={{ fontSize: '0.75rem' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1c1c1c',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value: number, name: string) => {
                            if (name === 'revenue') {
                                return [`${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}`, 'Doanh thu'];
                            }
                            return [value, 'Đơn hàng'];
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
