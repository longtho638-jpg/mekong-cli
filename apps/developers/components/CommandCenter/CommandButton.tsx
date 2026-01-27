'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface CommandAction {
    id: string
    label: string
    command: string
    icon: React.ReactNode
    color: string
    description: string
}

interface CommandButtonProps {
    command: CommandAction
    isActive: boolean
    onClick: () => void
}

export function CommandButton({ command, isActive, onClick }: CommandButtonProps) {
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
