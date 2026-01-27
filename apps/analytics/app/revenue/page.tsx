'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts'
import { analyticsApi, DailyMetric } from '@/lib/api'

// --- Components ---

function MetricCard({ title, value, change, trend, icon: Icon }: any) {
    const isPositive = trend === 'up'
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-5 h-5 text-neutral-400" />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {change}
                    </div>
                )}
            </div>
            <h3 className="text-sm font-medium text-neutral-400 mb-1">{title}</h3>
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        </div>
    )
}

// --- Page ---

export default function RevenuePage() {
    const [mrrData, setMrrData] = useState<DailyMetric[]>([])
    const [churnData, setChurnData] = useState<DailyMetric[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const [mrr, churn] = await Promise.all([
                    analyticsApi.getDailyMetrics('mrr', 90),
                    analyticsApi.getDailyMetrics('churn_rate', 90)
                ])
                setMrrData(mrr)
                setChurnData(churn)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) return <div className="p-8 text-center text-neutral-500">Loading Revenue Data...</div>

    const currentMrr = mrrData.length > 0 ? mrrData[0].metric_value : 0
    // Mock ARR based on MRR
    const currentArr = currentMrr * 12

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Revenue Analytics</h1>
                <p className="text-neutral-400">Deep dive into financial performance and subscription health.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Monthly Recurring Revenue"
                    value={formatCurrency(currentMrr)}
                    change="+8.2% vs last month"
                    trend="up"
                    icon={DollarSign}
                />
                <MetricCard
                    title="Annual Run Rate (ARR)"
                    value={formatCurrency(currentArr)}
                    change="+12.5% YoY"
                    trend="up"
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Average Revenue Per User (ARPU)"
                    value="$48.50"
                    change="+2.1%"
                    trend="up"
                    icon={CreditCard}
                />
            </div>

            {/* Main MRR Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white">MRR Growth</h3>
                    <p className="text-sm text-neutral-400">90-day trajectory</p>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[...mrrData].reverse()}>
                            <defs>
                                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#666"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.split('-').slice(1).join('/')}
                            />
                            <YAxis
                                stroke="#666"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [formatCurrency(value), 'MRR']}
                            />
                            <Area
                                type="monotone"
                                dataKey="metric_value"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorMrr)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Churn Chart */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white">Churn Rate</h3>
                        <p className="text-sm text-neutral-400">Daily churn percentage</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...churnData].reverse()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                />
                                <Bar dataKey="metric_value" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Churn %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Plan Distribution (Mock) */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white">Revenue by Plan</h3>
                        <p className="text-sm text-neutral-400">Distribution across tiers</p>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center text-neutral-500">
                        {/* Placeholder for Pie Chart */}
                        <div className="w-full space-y-4">
                            {[
                                { name: 'Pro Plan', value: 65, color: 'bg-purple-500' },
                                { name: 'Starter Plan', value: 25, color: 'bg-blue-500' },
                                { name: 'Enterprise', value: 10, color: 'bg-emerald-500' }
                            ].map((item) => (
                                <div key={item.name} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white">{item.name}</span>
                                        <span className="text-neutral-400">{item.value}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
