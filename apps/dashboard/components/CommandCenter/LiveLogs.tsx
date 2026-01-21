'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal } from 'lucide-react'

interface LiveLogsProps {
    logs: string[]
}

export function LiveLogs({ logs }: LiveLogsProps) {
    return (
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
    )
}
