'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Venture {
    id: string
    name: string
    tagline: string
    stage: 'idea' | 'validation' | 'growth' | 'scale'
    revenue: number
    users: number
    leads: string[]
}

interface OKR {
    id: string
    objective: string
    progress: number
    key_results: string[]
}

interface Initiative {
    id: string
    name: string
    status: 'planning' | 'in_progress' | 'completed'
    impact: 'high' | 'medium' | 'low'
}

// Sample data
const VENTURES: Venture[] = [
    { id: '1', name: 'AgencyOS', tagline: 'Deploy Your Agency in 15 Minutes', stage: 'growth', revenue: 50000, users: 120, leads: ['Anh', 'Tuan'] },
    { id: '2', name: 'Mekong Market', tagline: 'ĐBSCL Agricultural Platform', stage: 'validation', revenue: 5000, users: 25, leads: ['Linh'] },
    { id: '3', name: 'Bee 3.0', tagline: 'MLM Commission Engine', stage: 'growth', revenue: 30000, users: 80, leads: ['Team'] },
]

const OKRS: OKR[] = [
    { id: '1', objective: 'Achieve $100K MRR by Q2', progress: 55, key_results: ['Revenue: $55K', 'Customers: 150', 'Churn: <5%'] },
    { id: '2', objective: 'Launch 3 new ventures', progress: 67, key_results: ['AgencyOS: ✓', 'Mekong: ✓', 'TBA: Planning'] },
]

const INITIATIVES: Initiative[] = [
    { id: '1', name: 'VC Fundraising Round', status: 'in_progress', impact: 'high' },
    { id: '2', name: 'Team Expansion', status: 'planning', impact: 'medium' },
    { id: '3', name: 'Product Hunt Launch', status: 'completed', impact: 'high' },
]

const STAGE_COLORS: Record<string, string> = {
    idea: '#888',
    validation: '#ffd700',
    growth: '#00ff41',
    scale: '#00bfff',
}

export default function EntrepreneurHubPage() {
    const [ventures] = useState(VENTURES)
    const [okrs] = useState(OKRS)
    const [initiatives] = useState(INITIATIVES)

    // Metrics
    const totalRevenue = ventures.reduce((sum, v) => sum + v.revenue, 0)
    const totalUsers = ventures.reduce((sum, v) => sum + v.users, 0)
    const avgProgress = okrs.reduce((sum, o) => sum + o.progress, 0) / okrs.length

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            {/* Ambient */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                right: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#8a2be2' }}>🚀</span> Entrepreneur Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Ventures • OKRs • Strategy</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, color: '#00ff41' },
                        { label: 'Active Users', value: totalUsers, color: '#00bfff' },
                        { label: 'Ventures', value: ventures.length, color: '#8a2be2' },
                        { label: 'OKR Progress', value: `${avgProgress.toFixed(0)}%`, color: '#ffd700' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Ventures */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(138,43,226,0.2)',
                        borderTop: '3px solid #8a2be2',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#8a2be2' }}>🚀 Active Ventures</h3>

                        {ventures.map((venture, i) => (
                            <motion.div
                                key={venture.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{venture.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{venture.tagline}</p>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        background: `${STAGE_COLORS[venture.stage]}20`,
                                        color: STAGE_COLORS[venture.stage],
                                    }}>
                                        {venture.stage}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
                                    <span><span style={{ color: '#00ff41' }}>${venture.revenue.toLocaleString()}</span> MRR</span>
                                    <span><span style={{ color: '#00bfff' }}>{venture.users}</span> users</span>
                                    <span style={{ color: '#888' }}>Lead: {venture.leads.join(', ')}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* OKRs + Initiatives */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* OKRs */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>🎯 OKRs</h3>

                            {okrs.map((okr, i) => (
                                <div
                                    key={okr.id}
                                    style={{
                                        marginBottom: i < okrs.length - 1 ? '1rem' : 0,
                                        paddingBottom: i < okrs.length - 1 ? '1rem' : 0,
                                        borderBottom: i < okrs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>{okr.objective}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div style={{
                                            flex: 1,
                                            height: 6,
                                            background: '#333',
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                width: `${okr.progress}%`,
                                                height: '100%',
                                                background: okr.progress >= 70 ? '#00ff41' : '#ffd700',
                                            }} />
                                        </div>
                                        <span style={{ color: okr.progress >= 70 ? '#00ff41' : '#ffd700', fontSize: '0.75rem' }}>{okr.progress}%</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                        {okr.key_results.map((kr, j) => (
                                            <span key={j} style={{ fontSize: '0.65rem', color: '#888' }}>{kr}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Initiatives */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,255,65,0.2)',
                            borderTop: '3px solid #00ff41',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00ff41' }}>⚡ Initiatives</h3>

                            {initiatives.map((init, i) => (
                                <div
                                    key={init.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < initiatives.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{init.name}</p>
                                        <span style={{
                                            padding: '1px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: init.impact === 'high' ? 'rgba(255,0,0,0.1)' : 'rgba(255,215,0,0.1)',
                                            color: init.impact === 'high' ? '#ff6347' : '#ffd700',
                                        }}>
                                            {init.impact} impact
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '8px',
                                        fontSize: '0.6rem',
                                        background: init.status === 'completed' ? 'rgba(0,255,65,0.1)' : 'rgba(0,191,255,0.1)',
                                        color: init.status === 'completed' ? '#00ff41' : '#00bfff',
                                    }}>
                                        {init.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - WIN-WIN-WIN Ventures
                </footer>
            </div>
        </div>
    )
}
