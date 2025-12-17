'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Demo commands for Agency OS
const DEMO_COMMANDS = [
    { cmd: 'agency-os init my-agency', delay: 100 },
    { output: '🏯 Initializing Agency OS...', delay: 500 },
    { output: '✅ Created: my-agency/', delay: 300 },
    { output: '✅ Backend: FastAPI ready', delay: 200 },
    { output: '✅ i18n: en, vi, ja, ko loaded', delay: 200 },
    { cmd: 'agency-os setup --region vietnam', delay: 800 },
    { output: '🇻🇳 Configuring Vietnam region...', delay: 400 },
    { output: '✅ Currency: VND + USD', delay: 300 },
    { output: '✅ Provinces: 20 loaded', delay: 200 },
    { cmd: 'agency-os franchise --join', delay: 800 },
    { output: '🌍 Connecting to Franchise Network...', delay: 500 },
    { output: '✅ Territory: Available', delay: 400 },
    { output: '✅ HQ Connected: agencyos.network', delay: 300 },
    { output: '', delay: 200 },
    { output: '🎉 Welcome to Agency OS! (2 minutes)', delay: 500 },
]

// Stats for display
const STATS = [
    { label: 'Languages', value: '4', icon: '🌐' },
    { label: 'Regions', value: '4', icon: '🗺️' },
    { label: 'Population', value: '368M', icon: '👥' },
    { label: 'API Endpoints', value: '23', icon: '📡' },
]

// Regions for franchise
const REGIONS = [
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND' },
    { code: 'US', name: 'USA', flag: '🇺🇸', currency: 'USD' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
    { code: 'KR', name: 'Korea', flag: '🇰🇷', currency: 'KRW' },
]

export default function LandingPage() {
    const [lines, setLines] = useState<{ text: string, isCmd: boolean }[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [typing, setTyping] = useState('')
    const [showCTA, setShowCTA] = useState(false)
    const terminalRef = useRef<HTMLDivElement>(null)

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [lines, typing])

    // Typing animation
    useEffect(() => {
        if (currentIndex >= DEMO_COMMANDS.length) {
            setTimeout(() => setShowCTA(true), 500)
            return
        }

        const item = DEMO_COMMANDS[currentIndex]

        if (item.cmd) {
            let i = 0
            const typeInterval = setInterval(() => {
                if (i <= item.cmd.length) {
                    setTyping(item.cmd.slice(0, i))
                    i++
                } else {
                    clearInterval(typeInterval)
                    setLines(prev => [...prev, { text: item.cmd, isCmd: true }])
                    setTyping('')
                    setTimeout(() => setCurrentIndex(prev => prev + 1), item.delay)
                }
            }, 50)
            return () => clearInterval(typeInterval)
        } else {
            setTimeout(() => {
                setLines(prev => [...prev, { text: item.output, isCmd: false }])
                setCurrentIndex(prev => prev + 1)
            }, item.delay)
        }
    }, [currentIndex])

    const restartDemo = () => {
        setLines([])
        setCurrentIndex(0)
        setTyping('')
        setShowCTA(false)
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
            color: '#fff',
            fontFamily: "'Inter', 'SF Pro Display', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '30%',
                width: '50%',
                height: '50%',
                background: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '20%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '2rem', zIndex: 1 }}
            >
                <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                    <span style={{ fontSize: '4rem' }}>🏯</span>{' '}
                    <span style={{
                        background: 'linear-gradient(90deg, #9333ea, #ec4899, #f97316)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Agency OS
                    </span>
                </h1>
                <p style={{ color: '#a1a1aa', fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 300 }}>
                    The One-Person Unicorn Operating System
                </p>
                <p style={{
                    color: '#9333ea',
                    fontSize: '1.1rem',
                    fontStyle: 'italic'
                }}>
                    "Không đánh mà thắng" — Win Without Fighting
                </p>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    display: 'flex',
                    gap: '2rem',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    zIndex: 1,
                }}
            >
                {STATS.map((stat, i) => (
                    <div key={i} style={{
                        textAlign: 'center',
                        padding: '1rem 1.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8rem', color: '#71717a' }}>{stat.label}</div>
                    </div>
                ))}
            </motion.div>

            {/* Terminal Demo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: 700,
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 60px rgba(147,51,234,0.15)',
                    zIndex: 1,
                }}
            >
                {/* Terminal Header */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
                    <span style={{ marginLeft: 'auto', color: '#888', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        agency-os — zsh
                    </span>
                </div>

                {/* Terminal Body */}
                <div
                    ref={terminalRef}
                    style={{
                        padding: '1rem',
                        height: 280,
                        overflowY: 'auto',
                        fontSize: '0.9rem',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                >
                    {lines.map((line, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                marginBottom: 4,
                                color: line.isCmd ? '#9333ea' : '#d4d4d8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            {line.isCmd && <span style={{ color: '#ec4899' }}>❯</span>}
                            {line.text}
                        </motion.div>
                    ))}

                    {typing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#ec4899' }}>❯</span>
                            <span style={{ color: '#9333ea' }}>{typing}</span>
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                                style={{ width: 8, height: 16, background: '#9333ea' }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* CTA Buttons */}
            <AnimatePresence>
                {showCTA && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            marginTop: '2rem',
                            zIndex: 1,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={restartDemo}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                padding: '14px 28px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                            }}
                        >
                            ↻ Replay
                        </motion.button>
                        <motion.a
                            href="https://github.com/agencyos-network"
                            target="_blank"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(147,51,234,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                background: 'linear-gradient(90deg, #9333ea, #ec4899)',
                                color: '#fff',
                                padding: '14px 36px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '1rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            🚀 Join Franchise
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Regions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '3rem',
                    zIndex: 1,
                }}
            >
                {REGIONS.map((region, i) => (
                    <div key={i} style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        <span>{region.flag}</span>
                        <span style={{ color: '#a1a1aa' }}>{region.name}</span>
                    </div>
                ))}
            </motion.div>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                    color: '#52525b',
                    fontSize: '0.85rem',
                    marginTop: '3rem',
                    zIndex: 1,
                    textAlign: 'center',
                }}
            >
                🌐 <a href="https://agencyos.network" style={{ color: '#9333ea', textDecoration: 'none' }}>agencyos.network</a>
                {' '} — Agency OS v1.0.0
            </motion.p>
        </div>
    )
}
