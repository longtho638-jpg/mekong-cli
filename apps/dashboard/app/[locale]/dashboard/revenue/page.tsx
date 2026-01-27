'use client'

import React from 'react'
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Users, Activity } from 'lucide-react'
import { RevenueMetricCard } from '@/components/revenue/RevenueMetricCard'
import { RevenueTrendChart } from '@/components/revenue/RevenueTrendChart'
import { RecentTransactions } from '@/components/revenue/RecentTransactions'
import { useRevenueStats, useRevenueTrend, useRecentTransactions } from '@/lib/hooks/use-revenue'
import { formatCurrency } from '@/lib/format'

export default function RevenuePage() {
    const { stats, isLoading: statsLoading } = useRevenueStats()
    const { trend, isLoading: trendLoading } = useRevenueTrend()
    const { transactions, isLoading: txLoading } = useRecentTransactions()

    // Calculate trends (mock logic for now as API returns current snapshot)
    // In a real scenario, we'd compare with previous period stats
    const mrrTrend = stats?.mrr > 0 ? 'up' : 'neutral'
    const churnTrend = stats?.customer_churn_rate > 0.05 ? 'down' : 'neutral' // 'down' is bad for churn? Actually high churn is bad.
    // Let's interpret 'trend' prop: 'up' is green, 'down' is red.
    // For churn, we want it to go down (green). If it goes up, it's red.
    // Since we don't have historical comparison in `stats` object yet, we'll omit change text or assume neutral for MVP.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Revenue Engine</h2>
                    <p className="text-neutral-400">Financial performance and forecasting</p>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors">
                    Export Report
                </button>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RevenueMetricCard
                    title="Monthly Recurring"
                    value={stats ? formatCurrency(stats.mrr) : '$0.00'}
                    icon={DollarSign}
                    variant="neon"
                    trend="up"
                    change={stats ? `${stats.active_subscribers} active subs` : undefined}
                />
                <RevenueMetricCard
                    title="Annual Run Rate"
                    value={stats ? formatCurrency(stats.arr) : '$0.00'}
                    icon={Activity}
                    iconColor="text-blue-400"
                    trend="neutral"
                />
                <RevenueMetricCard
                    title="Lifetime Value"
                    value={stats ? formatCurrency(stats.avg_ltv) : '$0.00'}
                    icon={Wallet}
                    iconColor="text-purple-400"
                />
                <RevenueMetricCard
                    title="Churn Rate"
                    value={stats ? `${(stats.customer_churn_rate * 100).toFixed(1)}%` : '0.0%'}
                    icon={Users}
                    iconColor={stats?.customer_churn_rate > 0.05 ? "text-red-400" : "text-emerald-400"}
                    trend={stats?.customer_churn_rate > 0.05 ? 'down' : 'up'} // Visual indicator
                    variant={stats?.customer_churn_rate > 0.05 ? 'glass' : 'glass-pro'}
                />
            </div>

            {/* Charts & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueTrendChart data={trend} loading={trendLoading} />
                <RecentTransactions transactions={transactions} loading={txLoading} />
            </div>
        </div>
    )
}
