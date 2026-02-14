"use client";

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";

interface RevenueData {
    date: string;
    revenue: number;
    order_count: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
    // Format data for chart
    const chartData = data.map(item => ({
        date: new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        revenue: item.revenue,
        orders: item.order_count
    }));

    return (
        <motion.div
            className="bg-stone-950 border border-stone-800 rounded-sm p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Revenue Trend</h3>
                <p className="text-sm text-stone-500">Last 7 days performance</p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                        dataKey="date"
                        stroke="#71717a"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#71717a"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '4px',
                            color: '#fff'
                        }}
                        formatter={(value: any) => [`${value.toLocaleString()} VNĐ`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
