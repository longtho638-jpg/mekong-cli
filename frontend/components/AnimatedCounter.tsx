'use client'
import { useRef, useEffect } from 'react'
import { motion, useTransform, useInView, useMotionValue, animate } from 'framer-motion'

interface AnimatedCounterProps {
    value: number
    duration?: number
    prefix?: string
    suffix?: string
    decimals?: number
    className?: string
    color?: 'cyan' | 'purple' | 'green' | 'orange' | 'white'
}

export default function AnimatedCounter({
    value,
    duration = 2,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = '',
    color = 'cyan',
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null)
    const inView = useInView(ref, { once: true, margin: "0px" })
    const motionValue = useMotionValue(0)
    const rounded = useTransform(motionValue, (latest: number) => {
        if (decimals > 0) return latest.toFixed(decimals)
        return Math.round(latest).toLocaleString()
    })

    useEffect(() => {
        if (inView) {
            animate(motionValue, value, { duration: duration })
        }
    }, [inView, value, duration, motionValue])

    const colorClasses = {
        cyan: 'text-cyan-400',
        purple: 'text-purple-400',
        green: 'text-green-400',
        orange: 'text-orange-400',
        white: 'text-white',
    }

    return (
        <span ref={ref} className={`font-black ${colorClasses[color]} ${className}`}>
            {prefix}
            <motion.span>{rounded}</motion.span>
            {suffix}
        </span>
    )
}



// Stat card with animated counter
interface StatCardProps {
    label: string
    value: number
    prefix?: string
    suffix?: string
    icon?: string
    trend?: { value: number; positive: boolean }
    color?: 'cyan' | 'purple' | 'green' | 'orange'
}

export function AnimatedStatCard({
    label,
    value,
    prefix = '',
    suffix = '',
    icon = '📊',
    trend,
    color = 'cyan',
}: StatCardProps) {
    const colorGradients = {
        cyan: 'from-cyan-400/20 via-cyan-500/10 to-transparent',
        purple: 'from-purple-400/20 via-purple-500/10 to-transparent',
        green: 'from-green-400/20 via-green-500/10 to-transparent',
        orange: 'from-orange-400/20 via-orange-500/10 to-transparent',
    }

    const textGradients = {
        cyan: 'bg-gradient-to-r from-cyan-300 via-cyan-100 to-white',
        purple: 'bg-gradient-to-r from-purple-300 via-purple-100 to-white',
        green: 'bg-gradient-to-r from-green-300 via-green-100 to-white',
        orange: 'bg-gradient-to-r from-orange-300 via-orange-100 to-white',
    }

    const glowColors = {
        cyan: 'neon-glow-cyan',
        purple: 'neon-glow-purple',
        green: 'neon-glow-cyan', // reusing clean glows
        orange: 'neon-glow-pink',
    }

    const borderColors = {
        cyan: 'group-hover:border-cyan-500/50',
        purple: 'group-hover:border-purple-500/50',
        green: 'group-hover:border-green-500/50',
        orange: 'group-hover:border-orange-500/50',
    }

    return (
        <motion.div
            className={`
                group relative overflow-hidden rounded-[2rem] p-8
                bg-white/5 backdrop-blur-2xl
                border border-white/10 ${borderColors[color]}
                hover:${glowColors[color]}
                transition-all duration-500
            `}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, scale: 1.02 }}
        >
            {/* Ambient Gradient Mesh */}
            <div className={`
                absolute inset-0 bg-gradient-to-br ${colorGradients[color]}
                opacity-0 group-hover:opacity-100 transition-opacity duration-700
            `} />

            {/* Shimmer Overlay */}
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner group-hover:bg-white/10 transition-colors duration-300">
                        <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                            {icon}
                        </span>
                    </div>

                    {trend && (
                        <motion.div
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                text-xs font-bold border
                                ${trend.positive
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }
                                backdrop-blur-md
                            `}
                            whileHover={{ scale: 1.05 }}
                        >
                            <span>{trend.positive ? '↑' : '↓'}</span>
                            <span>{trend.value}%</span>
                        </motion.div>
                    )}
                </div>

                {/* Main Value */}
                <div>
                    <div className={`text-5xl md:text-6xl font-black tracking-tight mb-2 ${textGradients[color]} bg-clip-text text-transparent filter drop-shadow-lg`}>
                        <AnimatedCounter
                            value={value}
                            prefix={prefix}
                            suffix={suffix}
                            color="white" // Handled by parent gradient text
                            className="text-transparent" // Important for gradient clip
                        />
                    </div>

                    <div className="text-sm font-bold uppercase tracking-widest text-white/40 group-hover:text-white/70 transition-colors duration-300">
                        {label}
                    </div>
                </div>
            </div>

            {/* Corner Decorative Element */}
            <div className={`
                absolute -top-10 -right-10 w-32 h-32 rounded-full
                bg-gradient-to-br from-white/10 to-transparent blur-2xl
                group-hover:opacity-75 opacity-20 transition-opacity duration-500
            `} />
        </motion.div>
    )
}
