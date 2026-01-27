'use client'

import React from 'react'
import { Activity, FileText, UserPlus, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { AgencyCard } from '@/components/ui/agency-card'

const ACTIVITIES = [
    {
        id: 1,
        type: 'revenue',
        title: 'New Subscription',
        desc: 'Tech Corp upgraded to Pro Plan',
        time: '2m ago',
        amount: '+$499',
        icon: DollarSign,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
    },
    {
        id: 2,
        type: 'client',
        title: 'New Lead',
        desc: 'Startup Inc. requested a demo',
        time: '15m ago',
        icon: UserPlus,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 3,
        type: 'contract',
        title: 'Contract Signed',
        desc: 'Global Systems signed MSA',
        time: '1h ago',
        icon: FileText,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10'
    },
    {
        id: 4,
        type: 'system',
        title: 'Deployment Success',
        desc: 'v2.4.0 deployed to production',
        time: '3h ago',
        icon: CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-500/10'
    },
    {
        id: 5,
        type: 'alert',
        title: 'High Usage Alert',
        desc: 'API rate limit nearing 80%',
        time: '5h ago',
        icon: AlertCircle,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10'
    }
]

export function RecentActivity() {
    return (
        <AgencyCard variant="glass" className="h-full">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Recent Activity
                </h3>
                <button className="text-xs text-neutral-400 hover:text-white transition-colors">
                    View All
                </button>
            </div>
            <div className="p-2">
                {ACTIVITIES.map((activity) => (
                    <div
                        key={activity.id}
                        className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <div className={`p-2 rounded-lg shrink-0 ${activity.bg}`}>
                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                                    {activity.title}
                                </h4>
                                <span className="text-[10px] text-neutral-500">{activity.time}</span>
                            </div>
                            <p className="text-xs text-neutral-400 truncate">{activity.desc}</p>
                        </div>
                        {activity.amount && (
                            <div className="text-xs font-bold text-emerald-400 mt-1">
                                {activity.amount}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </AgencyCard>
    )
}
