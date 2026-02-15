"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"

const data = [
    { name: "T2", total: 1500000 },
    { name: "T3", total: 2300000 },
    { name: "T4", total: 3200000 },
    { name: "T5", total: 2800000 },
    { name: "T6", total: 4500000 },
    { name: "T7", total: 5800000 },
    { name: "CN", total: 6200000 },
]

export function PartnerRevenueChart() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnerRevenueFormatter = (value: any): [string, string] => {
        const val = Array.isArray(value) ? value[0] : value;
        const numValue = Number(val || 0);
        return [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numValue), 'Doanh thu'];
    };

    return (
        <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={partnerRevenueFormatter}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#22c55e"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
