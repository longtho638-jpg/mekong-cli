'use client'
import { useState, useCallback, ReactNode, MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Ripple {
    id: number
    x: number
    y: number
    size: number
}

interface RippleButtonProps {
    children: ReactNode
    onClick?: () => void
    className?: string
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    icon?: ReactNode
}

export default function RippleButton({
    children,
    onClick,
    className = '',
    variant = 'primary',
    size = 'md',
    disabled = false,
    icon,
}: RippleButtonProps) {
    const [ripples, setRipples] = useState<Ripple[]>([])

    const createRipple = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const size = Math.max(rect.width, rect.height) * 2

        const newRipple: Ripple = {
            id: Date.now(),
            x,
            y,
            size,
        }

        setRipples((prev) => [...prev, newRipple])

        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
        }, 600)
    }, [])

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
            createRipple(e)
            onClick?.()
        }
    }

    const variantClasses = {
        primary: `
            bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500
            hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400
            text-white font-bold tracking-wide
            shadow-[0_0_20px_rgba(6,182,212,0.4)]
            hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
            border border-white/10
        `,
        secondary: `
            bg-white/5 hover:bg-white/10
            backdrop-blur-xl
            text-white border border-white/10
            hover:border-white/30
            shadow-[0_4px_20px_rgba(0,0,0,0.2)]
            hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]
        `,
        ghost: `
            bg-transparent hover:bg-white/5
            text-white/70 hover:text-white
            border border-transparent hover:border-white/10
        `,
        danger: `
            bg-gradient-to-r from-red-500 via-pink-600 to-red-500
            hover:from-red-400 hover:via-pink-500 hover:to-red-400
            text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]
            hover:shadow-[0_0_30px_rgba(236,72,153,0.6)]
            border border-white/10
        `,
    }

    const sizeClasses = {
        sm: 'px-4 py-2 text-sm rounded-xl',
        md: 'px-6 py-3 text-base rounded-2xl',
        lg: 'px-8 py-4 text-lg rounded-2xl',
    }

    return (
        <motion.button
            onClick={handleClick}
            disabled={disabled}
            className={`
                relative overflow-hidden font-medium
                transition-all duration-300 transform
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
                ${className}
            `}
            whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
        >
            {/* Ripple effects */}
            <AnimatePresence>
                {ripples.map((ripple) => (
                    <motion.span
                        key={ripple.id}
                        className="absolute bg-white/20 rounded-full pointer-events-none"
                        style={{
                            left: ripple.x - ripple.size / 2,
                            top: ripple.y - ripple.size / 2,
                            width: ripple.size,
                            height: ripple.size,
                        }}
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                ))}
            </AnimatePresence>

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2.5">
                {icon && <span className="text-xl filter drop-shadow-md">{icon}</span>}
                <span className="filter drop-shadow-sm">{children}</span>
            </span>
        </motion.button>
    )
}
