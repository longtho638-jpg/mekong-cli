'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion'

interface LiveMetricProps {
    icon: string
    label: string
    value: number
    unit?: string
    prefix?: string
    change: number
    trend: 'up' | 'down' | 'stable'
    color?: string
    updateInterval?: number
}

// Animated number ticker
function AnimatedNumber({ value, prefix = '', unit = '' }: { value: number; prefix?: string; unit?: string }) {
    const spring = useSpring(value, { stiffness: 100, damping: 30 })
    const display = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString()}${unit}`)
    const [displayValue, setDisplayValue] = useState(`${prefix}${value.toLocaleString()}${unit}`)

    useEffect(() => {
        spring.set(value)
        const unsubscribe = display.on('change', (v) => setDisplayValue(v))
        return unsubscribe
    }, [value, spring, display])

    return <span>{displayValue}</span>
}

// Simple sparkline chart
function Sparkline({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((v - min) / range) * 100
        return `${x},${y}`
    }).join(' ')

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 30, marginTop: 8 }}>
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
                </linearGradient>
            </defs>
            <polygon
                points={`0,100 ${points} 100,100`}
                fill={`url(#grad-${color.replace('#', '')})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

// Status pulse indicator
function StatusPulse({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
    const colors = {
        healthy: '#00ff41',
        warning: '#ffd700',
        critical: '#ff0000',
    }

    return (
        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
            style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colors[status],
                boxShadow: `0 0 8px ${colors[status]}`,
            }}
        />
    )
}

export default function LiveMetricCard({
    icon,
    label,
    value,
    unit = '',
    prefix = '',
    change,
    trend,
    color = '#00bfff',
    updateInterval = 3000,
}: LiveMetricProps) {
    const [currentValue, setCurrentValue] = useState(value)
    const [history, setHistory] = useState<number[]>([value, value, value, value, value, value, value, value])
    const [isLive, setIsLive] = useState(true)

    // Simulate real-time updates
    useEffect(() => {
        if (!isLive) return

        const interval = setInterval(() => {
            setCurrentValue(prev => {
                // Random fluctuation ±5%
                const fluctuation = prev * (0.95 + Math.random() * 0.1)
                const newValue = Math.round(fluctuation)
                setHistory(h => [...h.slice(-7), newValue])
                return newValue
            })
        }, updateInterval)

        return () => clearInterval(interval)
    }, [isLive, updateInterval])

    const status = useMemo(() => {
        if (change >= 5) return 'healthy'
        if (change < 0) return 'critical'
        return 'warning'
    }, [change])

    const trendColor = trend === 'up' ? '#00ff41' : trend === 'down' ? '#ff6347' : '#888'
    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            style={{
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${color}30`,
                borderRadius: '16px',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Glow effect */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                opacity: 0.6,
            }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusPulse status={status} />
                    <span style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase' }}>LIVE</span>
                </div>
            </div>

            {/* Value */}
            <motion.p
                style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: color,
                    marginBottom: '0.25rem',
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                <AnimatedNumber value={currentValue} prefix={prefix} unit={unit} />
            </motion.p>

            {/* Label */}
            <p style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {label}
            </p>

            {/* Sparkline */}
            <Sparkline data={history} color={color} />

            {/* Change indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={change}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        style={{
                            fontSize: '0.8rem',
                            color: trendColor,
                            fontWeight: 'bold',
                        }}
                    >
                        {trendIcon} {Math.abs(change).toFixed(1)}%
                    </motion.span>
                </AnimatePresence>
                <button
                    onClick={() => setIsLive(!isLive)}
                    style={{
                        background: isLive ? 'rgba(0,255,65,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isLive ? '#00ff41' : '#333'}`,
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '0.6rem',
                        color: isLive ? '#00ff41' : '#888',
                        cursor: 'pointer',
                    }}
                >
                    {isLive ? '● LIVE' : '○ PAUSED'}
                </button>
            </div>
        </motion.div>
    )
}
