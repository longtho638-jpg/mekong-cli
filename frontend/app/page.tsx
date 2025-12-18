'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './globals.css'

// Data
const agents = [
    { name: 'Scout', role: 'Intelligence', status: 'ready', icon: '🔍' },
    { name: 'Editor', role: 'Content', status: 'ready', icon: '✏️' },
    { name: 'Director', role: 'Video', status: 'running', icon: '🎬' },
    { name: 'Community', role: 'Social', status: 'ready', icon: '🤝' },
    { name: 'Analyst', role: 'Market', status: 'ready', icon: '📊' },
    { name: 'Zalo', role: 'OA', status: 'ready', icon: '💬' },
    { name: 'Writer', role: 'Local', status: 'ready', icon: '🎤' },
]

const commands = [
    { cmd: '/nong-san', desc: 'Giá nông sản' },
    { cmd: '/ban-hang', desc: 'Sales funnel' },
    { cmd: '/tiep-thi', desc: 'Marketing' },
    { cmd: '/y-tuong', desc: '50 ideas' },
]

export default function Dashboard() {
    const [input, setInput] = useState('')
    const [logs, setLogs] = useState([
        '🌊 Mekong-CLI v1.0.0',
        '✅ 7 agents ready',
        '✅ Hybrid Router: 70% savings',
        '✅ Vibe: Miền Tây',
    ])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        setLogs(prev => [...prev, `❯ ${input}`, `Processing...`])
        setInput('')
        setTimeout(() => setLogs(prev => [...prev, '✅ Done']), 500)
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f0f 100%)',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            {/* Ambient Glow */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(0,255,65,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#00ff41' }}>🌊</span>
                            <span style={{ background: 'linear-gradient(90deg, #00ff41, #00cc33)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Mekong-CLI
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(0,255,65,0.1)', padding: '4px 12px', borderRadius: '20px', color: '#00ff41', border: '1px solid rgba(0,255,65,0.3)' }}>
                                v1.0.0
                            </span>
                        </h1>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>
                            Deploy Your Agency in <span style={{ color: '#fff' }}>15 Minutes</span>
                        </p>
                    </div>
                    <button style={{
                        background: '#00ff41',
                        color: '#000',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}>
                        + New Hub
                    </button>
                </motion.header>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Agents', value: '7', sub: 'Active' },
                        { label: 'Savings', value: '70%', sub: '$420' },
                        { label: 'Vibe', value: '🇻🇳', sub: 'Miền Tây' },
                        { label: 'Quota', value: '85%', sub: 'Daily' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{stat.label}</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#00ff41' }}>{stat.value}</span>
                                <span style={{ fontSize: '0.7rem', color: '#888' }}>{stat.sub}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Left: Terminal + Commands */}
                    <div>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 10px #00ff41' }} />
                            Mission Control
                        </h3>

                        {/* Terminal */}
                        <div style={{
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            marginBottom: '1rem',
                        }}>
                            {/* Terminal Header */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
                                <span style={{ marginLeft: 'auto', color: '#888', fontSize: '0.75rem' }}>mission-control</span>
                            </div>

                            {/* Terminal Body */}
                            <div style={{ padding: '1rem', height: 200, overflowY: 'auto', fontSize: '0.85rem' }}>
                                {logs.map((log, i) => (
                                    <div key={i} style={{ marginBottom: 4, color: log.startsWith('❯') ? '#00ff41' : '#ccc' }}>{log}</div>
                                ))}

                                {/* Input */}
                                <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <span style={{ color: '#ffd700' }}>❯</span>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Enter command..."
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            fontFamily: 'inherit',
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                        }}
                                    />
                                    <motion.span
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.6 }}
                                        style={{ width: 8, height: 16, background: '#00ff41' }}
                                    />
                                </form>
                            </div>
                        </div>

                        {/* Quick Commands */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                            {commands.map((cmd, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setInput(cmd.cmd)}
                                    style={{
                                        background: 'rgba(0,255,65,0.05)',
                                        border: '1px solid rgba(0,255,65,0.2)',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <code style={{ color: '#00ff41', fontSize: '0.8rem', display: 'block' }}>{cmd.cmd}</code>
                                    <span style={{ color: '#888', fontSize: '0.7rem' }}>{cmd.desc}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Agents */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Agents</h3>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(0,255,65,0.1)', color: '#00ff41', padding: '4px 8px', borderRadius: '12px' }}>
                                All Go
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {agents.map((agent, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ x: 4, background: 'rgba(255,255,255,0.05)' }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>{agent.icon}</span>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{agent.name}</p>
                                            <p style={{ color: '#888', fontSize: '0.7rem' }}>{agent.role}</p>
                                        </div>
                                    </div>
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: agent.status === 'running' ? '#ffbd2e' : '#00ff41',
                                        boxShadow: agent.status === 'running' ? '0 0 8px #ffbd2e' : '0 0 8px #00ff41',
                                    }} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
