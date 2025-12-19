'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedBadgeProps {
    children: ReactNode
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium'
    size?: 'sm' | 'md' | 'lg'
    pulse?: boolean
    glow?: boolean
    className?: string
}

export default function AnimatedBadge({
    children,
    variant = 'default',
    size = 'md',
    pulse = false,
    glow = false,
    className = '',
}: AnimatedBadgeProps) {
    const variantClasses = {
        default: 'bg-white/5 text-white/80 border-white/10 backdrop-blur-md',
        success: 'bg-green-500/10 text-green-300 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)] backdrop-blur-md',
        warning: 'bg-orange-500/10 text-orange-300 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)] backdrop-blur-md',
        error: 'bg-red-500/10 text-red-300 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] backdrop-blur-md',
        info: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur-md',
        premium: 'bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 text-fuchsia-200 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)] backdrop-blur-xl animate-gradient-x',
    }

    const glowColors = {
        default: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]',
        success: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]',
        warning: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]',
        error: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]',
        info: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]',
        premium: 'shadow-[0_0_30px_rgba(236,72,153,0.6)]',
    }

    const sizes = {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-4 py-1.5 text-sm',
        lg: 'px-5 py-2 text-base',
    }

    return (
        <motion.span
            className={`
                relative inline-flex items-center gap-2
                rounded-full font-bold uppercase tracking-wider
                border transition-all duration-500
                ${variantClasses[variant]}
                ${sizes[size]}
                ${glow ? `hover:shadow-lg ${glowColors[variant]} hover:scale-105 hover:border-white/30` : ''}
                ${className}
            `}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={glow ? { textShadow: '0 0 8px currentColor' } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
            {/* Ambient Glow for Premium */}
            {variant === 'premium' && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-xl animate-pulse" />
            )}

            {pulse && (
                <span className="relative flex h-2.5 w-2.5">
                    <span
                        className={`
                            animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                            ${variant === 'success' ? 'bg-green-400' : ''}
                            ${variant === 'warning' ? 'bg-orange-400' : ''}
                            ${variant === 'error' ? 'bg-red-400' : ''}
                            ${variant === 'info' ? 'bg-cyan-400' : ''}
                            ${variant === 'default' ? 'bg-white' : ''}
                            ${variant === 'premium' ? 'bg-fuchsia-400' : ''}
                        `}
                    />
                    <span
                        className={`
                            relative inline-flex rounded-full h-2.5 w-2.5
                            ${variant === 'success' ? 'bg-green-400' : ''}
                            ${variant === 'warning' ? 'bg-orange-400' : ''}
                            ${variant === 'error' ? 'bg-red-400' : ''}
                            ${variant === 'info' ? 'bg-cyan-400' : ''}
                            ${variant === 'default' ? 'bg-white' : ''}
                            ${variant === 'premium' ? 'bg-fuchsia-400' : ''}
                        `}
                    />
                </span>
            )}
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </motion.span>
    )
}

// Status badge with icon
interface StatusBadgeProps {
    status: 'active' | 'pending' | 'completed' | 'failed' | 'draft'
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function StatusBadge({
    status,
    showLabel = true,
    size = 'md',
    className = '',
}: StatusBadgeProps) {
    const statusConfig = {
        active: { variant: 'success' as const, label: 'Active', icon: '●' },
        pending: { variant: 'warning' as const, label: 'Pending', icon: '○' },
        completed: { variant: 'info' as const, label: 'Completed', icon: '✓' },
        failed: { variant: 'error' as const, label: 'Failed', icon: '✕' },
        draft: { variant: 'default' as const, label: 'Draft', icon: '◐' },
    }

    const config = statusConfig[status]

    return (
        <AnimatedBadge
            variant={config.variant}
            size={size}
            pulse={status === 'active' || status === 'pending'}
            glow
            className={className}
        >
            <span>{config.icon}</span>
            {showLabel && <span>{config.label}</span>}
        </AnimatedBadge>
    )
}

// Notification count badge
interface CountBadgeProps {
    count: number
    max?: number
    className?: string
}

export function CountBadge({ count, max = 99, className = '' }: CountBadgeProps) {
    const displayCount = count > max ? `${max}+` : count

    return (
        <motion.span
            className={`
                inline-flex items-center justify-center
                min-w-[1.5rem] h-6 px-1.5
                text-xs font-black text-white
                bg-gradient-to-r from-red-500 to-pink-600
                rounded-full border border-red-400/50
                shadow-[0_0_10px_rgba(239,68,68,0.5)]
                ${className}
            `}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            key={count}
        >
            {displayCount}
        </motion.span>
    )
}
