'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    CheckCircle2,
    AlertCircle,
    Zap,
    Activity,
    Wifi
} from 'lucide-react'

interface StatusLineProps {
    bridges?: {
        gemini: boolean
        git: boolean
        python: boolean
    }
    rateLimit?: {
        used: number
        max: number
    }
}

/**
 * StatusLine
 * 
 * Visual status bar showing bridge connections and rate limits
 * Replaces CLI statusline.sh with beautiful UI
 */
export function StatusLine({
    bridges = { gemini: true, git: true, python: true },
    rateLimit = { used: 0, max: 15 }
}: StatusLineProps) {
    const allConnected = bridges.gemini && bridges.git && bridges.python
    const rateLimitPercentage = (rateLimit.used / rateLimit.max) * 100

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-2 rounded-xl bg-neutral-900/80 border border-white/10 backdrop-blur-sm"
        >
            {/* Connection Status */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {allConnected ? (
                        <Wifi className="w-4 h-4 text-green-400" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-xs text-neutral-400">
                        {allConnected ? 'All Connected' : 'Some Offline'}
                    </span>
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Bridge Indicators */}
                <div className="flex items-center gap-3">
                    <BridgeIndicator name="Gemini" connected={bridges.gemini} />
                    <BridgeIndicator name="Git" connected={bridges.git} />
                    <BridgeIndicator name="Python" connected={bridges.python} />
                </div>
            </div>

            {/* Rate Limit */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neutral-500" />
                    <span className="text-xs text-neutral-400">Rate:</span>
                    <span className="text-xs font-mono text-white">
                        {rateLimit.used}/{rateLimit.max}
                    </span>
                </div>

                <div className="w-16 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rateLimitPercentage}%` }}
                        className={`h-full rounded-full ${rateLimitPercentage > 80
                                ? 'bg-red-500'
                                : rateLimitPercentage > 50
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                            }`}
                    />
                </div>

                {/* AgencyOS Badge */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-300">AgencyOS</span>
                </div>
            </div>
        </motion.div>
    )
}

function BridgeIndicator({ name, connected }: { name: string; connected: boolean }) {
    return (
        <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`text-[10px] ${connected ? 'text-neutral-400' : 'text-red-400'}`}>
                {name}
            </span>
        </div>
    )
}

export default StatusLine
