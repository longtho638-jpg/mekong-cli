'use client'
import { motion, useSpring, useTransform, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

interface AnimatedProgressRingProps {
    progress: number // 0-100
    size?: number
    strokeWidth?: number
    color?: 'cyan' | 'purple' | 'green' | 'orange' | 'gradient'
    showValue?: boolean
    label?: string
    className?: string
}

export default function AnimatedProgressRing({
    progress,
    size = 120,
    strokeWidth = 10,
    color = 'gradient',
    showValue = true,
    label,
    className = '',
}: AnimatedProgressRingProps) {
    const ref = useRef<SVGSVGElement>(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })
    const [hasAnimated, setHasAnimated] = useState(false)

    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI

    const spring = useSpring(0, {
        duration: 2000,
        bounce: 0,
        stiffness: 50
    })

    const strokeDashoffset = useTransform(spring, (value) => {
        return circumference - (value / 100) * circumference
    })

    useEffect(() => {
        if (isInView && !hasAnimated) {
            spring.set(Math.min(100, Math.max(0, progress)))
            setHasAnimated(true)
        }
    }, [isInView, progress, spring, hasAnimated])

    const colorStrokes = {
        cyan: '#22d3ee',
        purple: '#a855f7',
        green: '#22c55e',
        orange: '#f97316',
        gradient: 'url(#progressGradient)',
    }

    // Interactive glow effect based on color
    const glowFilter = {
        cyan: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.6)) drop-shadow(0 0 20px rgba(34, 211, 238, 0.3))',
        purple: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.3))',
        green: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6)) drop-shadow(0 0 20px rgba(34, 197, 94, 0.3))',
        orange: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.6)) drop-shadow(0 0 20px rgba(249, 115, 22, 0.3))',
        gradient: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.5)) drop-shadow(0 0 30px rgba(6, 182, 212, 0.3))',
    }

    return (
        <div className={`relative inline-flex items-center justify-center group ${className}`}>
            {/* Ambient Glow Background */}
            <div className={`
                absolute inset-0 rounded-full
                bg-gradient-to-tr from-cyan-500/20 to-purple-500/20
                blur-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-700
            `} />

            <svg
                ref={ref}
                width={size}
                height={size}
                className="transform -rotate-90 relative z-10"
                style={{ filter: glowFilter[color] }}
            >
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>

                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={strokeWidth}
                    className="backdrop-blur-sm"
                />

                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colorStrokes[color]}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset }}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 1 }}
                />
            </svg>

            {/* Center content */}
            {showValue && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        <span className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 filter drop-shadow-md">
                            {Math.round(progress)}%
                        </span>
                    </motion.div>

                    {label && (
                        <motion.span
                            className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/60 mt-1"
                            initial={{ opacity: 0, y: 5 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ delay: 0.4 }}
                        >
                            {label}
                        </motion.span>
                    )}
                </div>
            )}
        </div>
    )
}
