'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, RefreshCw, Sparkles, GitBranch, Cpu, Zap, Play, Rocket } from 'lucide-react'
import { CommandButton, CommandAction } from './CommandButton'
import { AgentStatusGrid, AgentStatus } from './AgentStatusGrid'
import { LiveLogs } from './LiveLogs'

/**
 * CommandCenter
 *
 * Mission Control for AgencyOS - Visual agent status and one-click actions
 * "Dễ như ăn kẹo!" - Easy as candy!
 */
export function CommandCenter() {
    const [agents] = useState<AgentStatus[]>([
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
        { id: 'code', label: '/code', command: 'Start coding session', icon: <Terminal className="w-5 h-5" />, color: 'purple', description: 'Auto-generate code' },
        { id: 'cook', label: '/cook', command: 'npm run dev', icon: <Play className="w-5 h-5" />, color: 'green', description: 'Start dev server' },
        { id: 'ship', label: '/ship', command: 'Deploy to production', icon: <Rocket className="w-5 h-5" />, color: 'orange', description: 'Deploy pipeline' },
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
        navigator.clipboard.writeText(cmd.command)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ ${cmd.label} command copied!`])
        setActiveCommand(null)
    }

    return (
        <div className="space-y-6">
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

            <div className="grid grid-cols-3 gap-4">
                {commands.map((cmd) => (
                    <CommandButton key={cmd.id} command={cmd} isActive={activeCommand === cmd.id} onClick={() => handleCommand(cmd)} />
                ))}
            </div>

            <AgentStatusGrid agents={agents} />
            <LiveLogs logs={logs} />
        </div>
    )
}

export default CommandCenter
