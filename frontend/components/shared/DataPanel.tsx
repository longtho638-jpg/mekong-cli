'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface DataPanelProps {
    title: string
    icon: string
    color: string
    children: ReactNode
    className?: string
}

export function DataPanel({ title, icon, color, children, className = '' }: DataPanelProps) {
    return (
        <div
            className={`rounded-xl bg-black/40 border border-white/5 relative overflow-hidden backdrop-blur-xl ${className}`}
            style={{ padding: '24px' }}
        >
            <div
                className="absolute top-0 left-0 w-full h-[2px]"
                style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
            />

            <div className="flex items-center gap-3 mb-5 relative z-10">
                <div
                    className="w-7 h-7 rounded flex items-center justify-center text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/5"
                    style={{ background: `${color}10`, color }}
                >
                    {icon}
                </div>
                <h3 className="font-bold text-white tracking-wide uppercase font-mono" style={{ fontSize: '15px' }}>
                    {title}
                </h3>
            </div>

            <div className="space-y-2 relative z-10">
                {children}
            </div>
        </div>
    )
}

interface DataItemProps {
    children: ReactNode
    borderColor?: string
    delay?: number
}

export function DataItem({ children, borderColor, delay = 0 }: DataItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 rounded-lg border border-white/[0.05] group"
            style={{
                borderLeft: borderColor ? `3px solid ${borderColor}` : undefined,
                padding: '16px'
            }}
        >
            {children}
        </motion.div>
    )
}

interface DataGridProps {
    columns?: 2 | 3 | 4
    children: ReactNode
}

export function DataGrid({ columns = 3, children }: DataGridProps) {
    const gridCols = {
        2: 'grid-cols-1 lg:grid-cols-2',
        3: 'grid-cols-1 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
    }

    return (
        <div className={`grid ${gridCols[columns]} gap-6`}>
            {children}
        </div>
    )
}

interface StatusBadgeProps {
    status: string
    color: string
}

export function StatusBadge({ status, color }: StatusBadgeProps) {
    return (
        <span
            className="rounded text-[10px] font-bold uppercase tracking-wider"
            style={{
                background: `${color}15`,
                color,
                border: `1px solid ${color}30`,
                padding: '4px 10px'
            }}
        >
            {status}
        </span>
    )
}
