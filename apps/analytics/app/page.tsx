'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Activity, MousePointerClick } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { analyticsApi, DashboardMetrics, DailyMetric } from '@/lib/api'

// --- Components ---

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    icon: React.ElementType;
    delay?: number;
}

function MetricCard({ title, value, change, trend, icon: Icon, delay }: MetricCardProps) {
    const isPositive = trend === 'up'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group hover:bg-white/[0.07]"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                    <Icon className="w-5 h-5 text-neutral-400 group-hover:text-white" />
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
        </motion.div>
    )
}

function RevenueChart({ data }: { data: DailyMetric[] }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                        formatter={(value: number | undefined) => [`$${value ?? 0}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="metric_value"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

function UserGrowthChart({ data }: { data: DailyMetric[] }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
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
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="metric_value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// --- Main Page ---

export default function AnalyticsOverview() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
    const [revenueData, setRevenueData] = useState<DailyMetric[]>([])
    const [userData, setUserData] = useState<DailyMetric[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                // Parallel fetching
                const [overview, revenue, users] = await Promise.all([
                    analyticsApi.getOverview(),
                    analyticsApi.getDailyMetrics('mrr', 30),
                    analyticsApi.getDailyMetrics('new_users', 30)
                ])

                setMetrics(overview)
                setRevenueData(revenue)
                setUserData(users)
            } catch (error) {
                console.error("Failed to load analytics data", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Business Overview</h1>
                <p className="text-neutral-400">Real-time performance metrics and growth insights.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Monthly Recurring Revenue"
                    value={formatCurrency(metrics?.mrr?.metric_value || 0)}
                    change="+12.5%"
                    trend="up"
                    icon={DollarSign}
                    delay={0}
                />
                <MetricCard
                    title="Active Users"
                    value={metrics?.active_users?.metric_value?.toLocaleString() || '0'}
                    change="+5.2%"
                    trend="up"
                    icon={Users}
                    delay={0.1}
                />
                <MetricCard
                    title="New Users (Today)"
                    value={metrics?.new_users?.metric_value || '0'}
                    change="-2.4%"
                    trend="down"
                    icon={MousePointerClick}
                    delay={0.2}
                />
                <MetricCard
                    title="Churn Rate"
                    value={`${metrics?.churn_rate?.metric_value || 0}%`}
                    change="-0.5%"
                    trend="up"
                    icon={Activity}
                    delay={0.3}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Revenue Growth</h3>
                            <p className="text-sm text-neutral-400">30-day MRR trend</p>
                        </div>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors">
                            View Report
                        </button>
                    </div>
                    <RevenueChart data={revenueData} />
                </motion.div>

                {/* User Growth */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">User Acquisition</h3>
                            <p className="text-sm text-neutral-400">Daily new signups</p>
                        </div>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors">
                            View Details
                        </button>
                    </div>
                    <UserGrowthChart data={userData} />
                </motion.div>
            </div>
        </div>
    )
}
