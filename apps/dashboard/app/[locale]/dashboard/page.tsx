'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, Target, ArrowUpRight, DollarSign, Activity } from 'lucide-react'
import { CommandCenter, StatusLine } from '@/components/CommandCenter'
import { UnifiedBridgeWidget } from '@/components/antigravity'
import { AgencyCard } from '@/components/ui/agency-card'

const METRICS = [
    {
        label: 'Revenue (ARR)',
        value: '$124,500',
        change: '+12.5%',
        trend: 'up',
        icon: DollarSign,
        color: 'from-emerald-500 to-teal-500'
    },
    {
        label: 'Active Leads',
        value: '42',
        change: '+5',
        trend: 'up',
        icon: Users,
        color: 'from-blue-500 to-indigo-500'
    },
    {
        label: 'Win Rate',
        value: '68%',
        change: '+2.1%',
        trend: 'up',
        icon: Target,
        color: 'from-purple-500 to-pink-500'
    },
    {
        label: 'System Health',
        value: '98.9%',
        change: 'Stable',
        trend: 'neutral',
        icon: Activity,
        color: 'from-orange-500 to-red-500'
    },
]

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Status Line */}
            <StatusLine />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {METRICS.map((metric, idx) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <AgencyCard variant="glass-pro" className="relative overflow-hidden group hover-lift">
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
                                    <span className={`text-xs font-medium mb-0.5 ${metric.trend === 'up' ? 'text-emerald-400' : 'text-neutral-400'} flex items-center`}>
                                        {metric.change}
                                        {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3 ml-0.5" />}
                                    </span>
                                </div>
                            </div>
                        </AgencyCard>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Command Center - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <CommandCenter />
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Unified Bridge Widget */}
                    <UnifiedBridgeWidget />

                    {/* Strategic Alerts */}
                    <AgencyCard variant="glass" className="p-5">
                        <h3 className="text-sm font-bold text-white mb-4">Strategic Alerts</h3>
                        <div className="space-y-3">
                            {[
                                { title: 'New Lead', desc: 'Tech Corp high intent', time: '2m ago' },
                                { title: 'Pipeline Update', desc: 'Contract sent', time: '1h ago' },
                                { title: 'System Status', desc: 'All nominal', time: '3h ago' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-500 shrink-0 group-hover:scale-125 transition-transform" />
                                    <div>
                                        <h4 className="text-xs font-medium text-white group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                                        <p className="text-[10px] text-neutral-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AgencyCard>
                </div>
            </div>
        </div>
    )
}