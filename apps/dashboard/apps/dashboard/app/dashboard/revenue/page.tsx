'use client'

import React, { useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { Download, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { AgencyCard } from '@/components/ui/agency-card'
import { MD3Button } from '@/components/md3/MD3Button'
import { StatusLine } from '@/components/CommandCenter'
import { RevenueOverview } from '@/components/dashboard/RevenueOverview'

// Mock Data
const DATA = [
    { month: 'Jan', revenue: 45000, mrr: 42000, churn: 1.2 },
    { month: 'Feb', revenue: 52000, mrr: 48000, churn: 1.5 },
    { month: 'Mar', revenue: 49000, mrr: 47000, churn: 2.1 },
    { month: 'Apr', revenue: 63000, mrr: 58000, churn: 1.8 },
    { month: 'May', revenue: 75000, mrr: 69000, churn: 1.4 },
    { month: 'Jun', revenue: 82000, mrr: 76000, churn: 1.1 },
    { month: 'Jul', revenue: 124500, mrr: 112000, churn: 2.4 },
]

export default function RevenueDashboard() {
    const [timeRange, setTimeRange] = useState('6m')

    const downloadCSV = () => {
        const headers = ['Month', 'Revenue', 'MRR', 'Churn Rate']
        const csvContent = [
            headers.join(','),
            ...DATA.map(row => `${row.month},${row.revenue},${row.mrr},${row.churn}%`)
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    // Determine churn alert status
    const currentChurn = DATA[DATA.length - 1].churn
    const churnStatus = currentChurn > 5 ? 'critical' : currentChurn > 2 ? 'warning' : 'good'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <StatusLine />
                <div className="flex gap-2">
                    <MD3Button variant="outlined" onClick={downloadCSV} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </MD3Button>
                </div>
            </div>

            <RevenueOverview />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue & MRR Chart */}
                <AgencyCard className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            Revenue & MRR Growth
                        </h3>
                        <div className="flex gap-2 text-xs">
                            <button
                                onClick={() => setTimeRange('6m')}
                                className={`px-2 py-1 rounded ${timeRange === '6m' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}
                            >
                                6M
                            </button>
                            <button
                                onClick={() => setTimeRange('1y')}
                                className={`px-2 py-1 rounded ${timeRange === '1y' ? 'bg-blue-500 text-white' : 'text-neutral-400'}`}
                            >
                                1Y
                            </button>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={DATA}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Total Revenue" />
                                <Area type="monotone" dataKey="mrr" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMRR)" strokeWidth={2} name="MRR" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </AgencyCard>

                {/* Churn Analysis */}
                <AgencyCard className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-rose-400" />
                            Churn Rate Analysis
                        </h3>
                        {churnStatus !== 'good' && (
                            <div className={`
                                px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5
                                ${churnStatus === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}
                            `}>
                                <AlertTriangle className="w-3 h-3" />
                                {churnStatus === 'critical' ? 'Critical Alert' : 'Warning'}
                            </div>
                        )}
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={DATA}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="churn"
                                    stroke={churnStatus === 'good' ? '#3b82f6' : '#f43f5e'}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#111', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                    name="Churn Rate"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </AgencyCard>
            </div>

            {/* MRR Calculator */}
            <AgencyCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-6">MRR Calculator</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Average Revenue Per User (ARPU)</label>
                        <div className="text-2xl font-bold text-white">$49.00</div>
                        <p className="text-xs text-neutral-500">Based on active subscriptions</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Total Active Customers</label>
                        <div className="text-2xl font-bold text-white">254</div>
                        <p className="text-xs text-green-500">+12 this month</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Projected MRR</label>
                        <div className="text-2xl font-bold text-blue-400">$12,446</div>
                        <p className="text-xs text-neutral-500">ARPU × Customers</p>
                    </div>
                </div>
            </AgencyCard>
        </div>
    )
}
