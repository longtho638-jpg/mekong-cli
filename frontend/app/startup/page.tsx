'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Startup {
    id: string
    name: string
    stage: 'ideation' | 'validation' | 'mvp' | 'growth' | 'scale'
    equity: number
    valuation: number
    runway: number
    status: 'active' | 'paused' | 'exited'
}

interface Milestone {
    id: string
    startup: string
    name: string
    status: 'completed' | 'in_progress' | 'upcoming'
    date: string
}

interface Investment {
    id: string
    startup: string
    amount: number
    type: 'equity' | 'convertible' | 'safe'
    date: string
}

// Sample data
const STARTUPS: Startup[] = [
    { id: '1', name: 'AgencyOS Core', stage: 'growth', equity: 85, valuation: 5000000, runway: 18, status: 'active' },
    { id: '2', name: 'Mekong AgriTech', stage: 'mvp', equity: 100, valuation: 500000, runway: 12, status: 'active' },
    { id: '3', name: 'Binh Pháp Academy', stage: 'validation', equity: 100, valuation: 150000, runway: 24, status: 'active' },
    { id: '4', name: 'Delta Logistics', stage: 'ideation', equity: 100, valuation: 50000, runway: 6, status: 'paused' },
]

const MILESTONES: Milestone[] = [
    { id: '1', startup: 'AgencyOS Core', name: 'Series A Close', status: 'in_progress', date: 'Q1 2025' },
    { id: '2', startup: 'Mekong AgriTech', name: 'First 100 Users', status: 'completed', date: 'Dec 2024' },
    { id: '3', startup: 'Binh Pháp Academy', name: 'Course Launch', status: 'upcoming', date: 'Jan 2025' },
    { id: '4', startup: 'AgencyOS Core', name: '$100K MRR', status: 'in_progress', date: 'Mar 2025' },
]

const INVESTMENTS: Investment[] = [
    { id: '1', startup: 'AgencyOS Core', amount: 500000, type: 'equity', date: 'Jun 2024' },
    { id: '2', startup: 'Mekong AgriTech', amount: 100000, type: 'safe', date: 'Oct 2024' },
    { id: '3', startup: 'Binh Pháp Academy', amount: 25000, type: 'convertible', date: 'Nov 2024' },
]

const STAGE_COLORS: Record<string, string> = {
    ideation: '#888',
    validation: '#ffd700',
    mvp: '#00bfff',
    growth: '#00ff41',
    scale: '#8a2be2',
}

const STATUS_COLORS: Record<string, string> = {
    active: '#00ff41',
    paused: '#ffd700',
    exited: '#8a2be2',
    completed: '#00ff41',
    in_progress: '#00bfff',
    upcoming: '#888',
}

export default function StartupHubPage() {
    const [startups] = useState(STARTUPS)
    const [milestones] = useState(MILESTONES)
    const [investments] = useState(INVESTMENTS)

    const totalValuation = startups.reduce((sum, s) => sum + s.valuation, 0)
    const activeStartups = startups.filter(s => s.status === 'active').length
    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0)
    const avgRunway = (startups.reduce((sum, s) => sum + s.runway, 0) / startups.length).toFixed(0)

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{
                position: 'fixed',
                top: '-20%',
                right: '25%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#8a2be2' }}>🦄</span> Startup Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Ventures • Milestones • Investments</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Portfolio Value', value: `$${(totalValuation / 1000000).toFixed(1)}M`, color: '#8a2be2' },
                        { label: 'Active Startups', value: activeStartups, color: '#00ff41' },
                        { label: 'Total Invested', value: `$${(totalInvested / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Avg Runway', value: `${avgRunway}mo`, color: '#ffd700' },
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {startups.map((startup, i) => (
                        <motion.div
                            key={startup.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${STAGE_COLORS[startup.stage]}40`,
                                borderTop: `3px solid ${STAGE_COLORS[startup.stage]}`,
                                borderRadius: '12px',
                                padding: '1.25rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <p style={{ fontWeight: 600 }}>{startup.name}</p>
                                <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    fontSize: '0.6rem',
                                    background: `${STATUS_COLORS[startup.status]}20`,
                                    color: STATUS_COLORS[startup.status],
                                }}>
                                    {startup.status}
                                </span>
                            </div>
                            <p style={{ color: STAGE_COLORS[startup.stage], fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                {startup.stage}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span>${(startup.valuation / 1000000).toFixed(1)}M</span>
                                <span style={{ color: '#888' }}>{startup.runway}mo runway</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>🎯 Milestones</h3>
                        {milestones.map((milestone, i) => (
                            <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STATUS_COLORS[milestone.status]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{milestone.name}</p>
                                    <p style={{ color: '#888', fontSize: '0.7rem' }}>{milestone.startup} • {milestone.date}</p>
                                </div>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.65rem',
                                    background: `${STATUS_COLORS[milestone.status]}20`,
                                    color: STATUS_COLORS[milestone.status],
                                }}>
                                    {milestone.status.replace('_', ' ')}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        borderTop: '3px solid #ffd700',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ffd700' }}>💰 Investments</h3>
                        {investments.map((inv, i) => (
                            <div
                                key={inv.id}
                                style={{
                                    padding: '0.75rem 0',
                                    borderBottom: i < investments.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{inv.startup}</p>
                                    <p style={{ color: '#00ff41', fontSize: '0.9rem' }}>${(inv.amount / 1000).toFixed(0)}K</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{
                                        padding: '1px 4px',
                                        borderRadius: '4px',
                                        fontSize: '0.55rem',
                                        background: 'rgba(255,215,0,0.2)',
                                        color: '#ffd700',
                                    }}>
                                        {inv.type}
                                    </span>
                                    <span style={{ color: '#888', fontSize: '0.7rem' }}>{inv.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Venture Excellence
                </footer>
            </div>
        </div>
    )
}
