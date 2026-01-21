'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

export interface AgentStatus {
    name: string
    status: 'ready' | 'running' | 'error' | 'idle'
    lastRun?: string
    icon: React.ReactNode
    color: string
}

interface AgentStatusGridProps {
    agents: AgentStatus[]
}

export function AgentStatusGrid({ agents }: AgentStatusGridProps) {
    const getStatusColor = (status: AgentStatus['status']) => {
        switch (status) {
            case 'ready': return 'text-green-400'
            case 'running': return 'text-blue-400 animate-pulse'
            case 'error': return 'text-red-400'
            case 'idle': return 'text-neutral-500'
        }
    }

    const getStatusIcon = (status: AgentStatus['status']) => {
        switch (status) {
            case 'ready': return <CheckCircle2 className="w-3 h-3 text-green-400" />
            case 'running': return <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
            case 'error': return <AlertCircle className="w-3 h-3 text-red-400" />
            case 'idle': return <Clock className="w-3 h-3 text-neutral-500" />
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-white/10 backdrop-blur-xl"
        >
            <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Agent Status
            </h3>

            <div className="grid grid-cols-2 gap-3">
                {agents.map((agent, index) => (
                    <motion.div
                        key={agent.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-neutral-900/50 border border-white/5 hover:border-white/10 transition-all"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-${agent.color}-400`}>{agent.icon}</span>
                                <span className="text-sm font-medium text-white">{agent.name}</span>
                            </div>
                            {getStatusIcon(agent.status)}
                        </div>
                        <span className={`text-xs capitalize ${getStatusColor(agent.status)}`}>
                            {agent.status}
                        </span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
