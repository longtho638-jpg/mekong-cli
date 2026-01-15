'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Terminal,
    Zap,
    GitBranch,
    Sparkles,
    Cpu,
    Play,
    Rocket,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Clock,
    Activity
} from 'lucide-react'

interface AgentStatus {
    name: string
    status: 'ready' | 'running' | 'error' | 'idle'
    lastRun?: string
    icon: React.ReactNode
    color: string
}

interface CommandAction {
    id: string
    label: string
    command: string
    icon: React.ReactNode
    color: string
    description: string
}

/**
 * CommandCenter
 * 
 * Mission Control for AgencyOS - Visual agent status and one-click actions
 * "Dễ như ăn kẹo!" - Easy as candy!
 */
export function CommandCenter() {
    const [agents, setAgents] = useState<AgentStatus[]>([
        { name: 'Gemini Bridge', status: 'ready', icon: <Sparkles className="w-4 h-4" />, color: 'purple' },
        { name: 'Git Worktree', status: 'ready', icon: <GitBranch className="w-4 h-4" />, color: 'green' },
        { name: 'Python Core', status: 'ready', icon: <Cpu className="w-4 h-4" />, color: 'blue' },
        { name: 'Revenue Engine', status: 'idle', icon: <Zap className="w-4 h-4" />, color: 'yellow' },
    ])

    const [logs, setLogs] = useState<string[]>([
        '[15:58:01] 🏯 AgencyOS Unified Bridge v1.0.0 ready',
        '[15:58:02] ✅ All bridges connected',
        '[15:58:03] 📊 Rate limit: 15/15 remaining'
    ])

    const [isRefreshing, setIsRefreshing] = useState(false)
    const [activeCommand, setActiveCommand] = useState<string | null>(null)

    const commands: CommandAction[] = [
        {
            id: 'code',
            label: '/code',
            command: 'Start coding session',
            icon: <Terminal className="w-5 h-5" />,
            color: 'purple',
            description: 'Auto-generate code'
        },
        {
            id: 'cook',
            label: '/cook',
            command: 'npm run dev',
            icon: <Play className="w-5 h-5" />,
            color: 'green',
            description: 'Start dev server'
        },
        {
            id: 'ship',
            label: '/ship',
            command: 'Deploy to production',
            icon: <Rocket className="w-5 h-5" />,
            color: 'orange',
            description: 'Deploy pipeline'
        },
    ]

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔄 Status refreshed`])
        setIsRefreshing(false)
    }

    const handleCommand = async (cmd: CommandAction) => {
        setActiveCommand(cmd.id)
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🚀 Running ${cmd.label}...`])

        // Copy to clipboard
        const fullCommand = cmd.command
        navigator.clipboard.writeText(fullCommand)

        await new Promise(resolve => setTimeout(resolve, 1500))
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ ${cmd.label} command copied!`])
        setActiveCommand(null)
    }

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30">
                        <Terminal className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Command Center</h2>
                        <p className="text-sm text-neutral-400">🍬 Dễ như ăn kẹo!</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all"
                >
                    <RefreshCw className={`w-4 h-4 text-neutral-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm text-neutral-300">Refresh</span>
                </motion.button>
            </div>

            {/* One-Click Actions */}
            <div className="grid grid-cols-3 gap-4">
                {commands.map((cmd) => (
                    <CommandButton
                        key={cmd.id}
                        command={cmd}
                        isActive={activeCommand === cmd.id}
                        onClick={() => handleCommand(cmd)}
                    />
                ))}
            </div>

            {/* Agent Status Grid */}
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

            {/* Live Logs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-neutral-900/80 border border-white/10"
            >
                <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Live Logs
                </h3>

                <div className="bg-black/50 rounded-xl p-4 font-mono text-xs h-32 overflow-y-auto">
                    <AnimatePresence>
                        {logs.map((log, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-neutral-300 py-0.5"
                            >
                                {log}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}

interface CommandButtonProps {
    command: CommandAction
    isActive: boolean
    onClick: () => void
}

function CommandButton({ command, isActive, onClick }: CommandButtonProps) {
    const colorClasses: Record<string, string> = {
        purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500/50',
        green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50',
        orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-500/50',
    }

    const iconColors: Record<string, string> = {
        purple: 'text-purple-400',
        green: 'text-green-400',
        orange: 'text-orange-400',
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            disabled={isActive}
            className={`relative p-6 rounded-2xl bg-gradient-to-br ${colorClasses[command.color]} border backdrop-blur-sm transition-all overflow-hidden group`}
        >
            {isActive && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5 }}
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/50 to-white/20"
                />
            )}

            <div className="flex flex-col items-center gap-3">
                <div className={`p-3 rounded-xl bg-black/20 ${iconColors[command.color]} group-hover:scale-110 transition-transform`}>
                    {command.icon}
                </div>
                <span className="text-lg font-bold text-white">{command.label}</span>
                <span className="text-xs text-neutral-400">{command.description}</span>
            </div>
        </motion.button>
    )
}

export default CommandCenter
