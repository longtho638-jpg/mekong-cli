'use client'

import { motion } from 'framer-motion'

interface StatCardProps {
    label: string
    value: string | number
    color: string
    delay?: number
    icon?: string
}

export function StatCard({ label, value, color, delay = 0, icon }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="glass-card-pro rounded-2xl relative overflow-hidden group border border-white/5 hover:border-white/10 bg-white/[0.02]"
            style={{ padding: '24px' }}
        >
            <div
                className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl pointer-events-none"
                style={{ background: color }}
            />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 font-bold uppercase tracking-widest" style={{ fontSize: '11px' }}>{label}</p>
                    {icon && <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>}
                </div>
                <p className="font-black tracking-tight font-mono truncate" style={{ color, fontSize: '28px' }}>{value}</p>
            </div>
        </motion.div>
    )
}

interface StatGridProps {
    stats: Array<{
        label: string
        value: string | number
        color: string
        icon?: string
    }>
}

export function StatGrid({ stats }: StatGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
                <StatCard
                    key={stat.label}
                    {...stat}
                    delay={i * 0.1}
                />
            ))}
        </div>
    )
}
