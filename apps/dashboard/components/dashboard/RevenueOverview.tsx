'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Users, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react'
import { AgencyCard } from '@/components/ui/agency-card'
import { Skeleton } from '@/components/ui/skeleton'

interface RevenueMetric {
    label: string
    value: string
    change: string
    trend: 'up' | 'down' | 'neutral'
    icon: LucideIcon
    color: string
}

const DEFAULT_METRICS: RevenueMetric[] = [
    {
        label: 'Total Revenue',
        value: '$124,500',
        change: '+12.5%',
        trend: 'up',
        icon: DollarSign,
        color: 'from-emerald-500 to-teal-500'
    },
    {
        label: 'Active Subscriptions',
        value: '142',
        change: '+8',
        trend: 'up',
        icon: Users,
        color: 'from-blue-500 to-indigo-500'
    },
    {
        label: 'Monthly Recurring (MRR)',
        value: '$12,450',
        change: '+5.2%',
        trend: 'up',
        icon: TrendingUp,
        color: 'from-purple-500 to-pink-500'
    },
    {
        label: 'Churn Rate',
        value: '2.4%',
        change: '-0.5%',
        trend: 'up', // 'up' is good for churn reduction
        icon: Activity,
        color: 'from-orange-500 to-red-500'
    }
]

export function RevenueOverview({ loading = false }: { loading?: boolean }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <AgencyCard key={i} className="h-32">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                        </div>
                    </AgencyCard>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEFAULT_METRICS.map((metric, idx) => (
                <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                >
                    <AgencyCard variant="glass-pro" className="relative overflow-hidden group hover-lift h-full">
                        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                            <metric.icon className="w-12 h-12 text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-3 shadow-lg`}>
                                <metric.icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-neutral-400 text-xs font-medium">{metric.label}</p>
                            <div className="flex items-end gap-2 mt-1">
                                <h3 className="text-xl font-bold text-white">{metric.value}</h3>
                                <span className={`text-xs font-medium mb-0.5 ${metric.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'} flex items-center`}>
                                    {metric.change}
                                    {metric.trend === 'up' ? (
                                        <ArrowUpRight className="w-3 h-3 ml-0.5" />
                                    ) : (
                                        <ArrowDownRight className="w-3 h-3 ml-0.5" />
                                    )}
                                </span>
                            </div>
                        </div>
                    </AgencyCard>
                </motion.div>
            ))}
        </div>
    )
}
