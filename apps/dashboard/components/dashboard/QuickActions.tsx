'use client'

import React from 'react'
import { Plus, BarChart2, CreditCard, Settings, FileText, Zap } from 'lucide-react'
import { AgencyCard } from '@/components/ui/agency-card'
import { useRouter } from 'next/navigation'

const QUICK_ACTIONS = [
    {
        label: 'New Client',
        icon: Plus,
        action: '/dashboard/crm/new',
        color: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
    },
    {
        label: 'View Analytics',
        icon: BarChart2,
        action: '/dashboard/revenue',
        color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
    },
    {
        label: 'Billing',
        icon: CreditCard,
        action: '/dashboard/billing',
        color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
    },
    {
        label: 'New Contract',
        icon: FileText,
        action: '/dashboard/contracts/new',
        color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
    },
    {
        label: 'Deploy Agent',
        icon: Zap,
        action: '/dashboard/agents/new',
        color: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
    },
    {
        label: 'Settings',
        icon: Settings,
        action: '/dashboard/settings',
        color: 'bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20'
    }
]

export function QuickActions() {
    const router = useRouter()

    return (
        <AgencyCard variant="glass" className="p-4">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => router.push(action.action)}
                        className={`
                            flex flex-col items-center justify-center gap-2 p-3 rounded-xl
                            transition-all duration-200 hover:scale-105 active:scale-95
                            border border-transparent hover:border-white/5
                            ${action.color}
                        `}
                    >
                        <action.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{action.label}</span>
                    </button>
                ))}
            </div>
        </AgencyCard>
    )
}
