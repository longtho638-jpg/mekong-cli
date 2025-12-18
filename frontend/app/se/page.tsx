'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Demo {
    id: string
    company: string
    prospect: string
    type: string
    date: string
    se: string
    outcome: 'scheduled' | 'positive' | 'negative'
    value: number
}

interface POC {
    id: string
    company: string
    useCase: string
    stage: 'in_progress' | 'evaluation' | 'won' | 'lost'
    criteria: number
    met: number
    value: number
    daysLeft: number
}

// Sample data
const DEMOS: Demo[] = [
    { id: '1', company: 'TechCorp VN', prospect: 'Nguyễn A', type: 'technical', date: 'Dec 18', se: 'SE_001', outcome: 'scheduled', value: 5000 },
    { id: '2', company: 'StartupX', prospect: 'Trần B', type: 'discovery', date: 'Dec 17', se: 'SE_001', outcome: 'positive', value: 2000 },
    { id: '3', company: 'Agency Pro', prospect: 'Lê C', type: 'executive', date: 'Dec 20', se: 'SE_002', outcome: 'scheduled', value: 8000 },
    { id: '4', company: 'Digital VN', prospect: 'Phạm D', type: 'technical', date: 'Dec 15', se: 'SE_001', outcome: 'negative', value: 3000 },
]

const POCS: POC[] = [
    { id: '1', company: 'TechCorp VN', useCase: 'Marketing Automation', stage: 'in_progress', criteria: 4, met: 2, value: 10000, daysLeft: 8 },
    { id: '2', company: 'Enterprise Co', useCase: 'Sales Pipeline', stage: 'evaluation', criteria: 5, met: 5, value: 25000, daysLeft: 2 },
    { id: '3', company: 'RetailMax', useCase: 'Customer Support', stage: 'won', criteria: 3, met: 3, value: 15000, daysLeft: 0 },
]

const STAGE_COLORS = {
    in_progress: '#00bfff',
    evaluation: '#ffd700',
    won: '#00ff41',
    lost: '#ff5f56',
}

const OUTCOME_COLORS = {
    scheduled: '#888',
    positive: '#00ff41',
    negative: '#ff5f56',
}

export default function SEDashboard() {
    const [activeTab, setActiveTab] = useState<'demos' | 'pocs'>('demos')

    const metrics = {
        upcomingDemos: DEMOS.filter(d => d.outcome === 'scheduled').length,
        activePOCs: POCS.filter(p => p.stage === 'in_progress' || p.stage === 'evaluation').length,
        wonValue: POCS.filter(p => p.stage === 'won').reduce((sum, p) => sum + p.value, 0),
        winRate: '75%',
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#f39c12' }}>🔧</span> Sales Engineering
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Demos & POC Management</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Upcoming Demos', value: metrics.upcomingDemos, color: '#00bfff' },
                        { label: 'Active POCs', value: metrics.activePOCs, color: '#ffd700' },
                        { label: 'Won Value', value: `$${(metrics.wonValue / 1000).toFixed(0)}K`, color: '#00ff41' },
                        { label: 'Win Rate', value: metrics.winRate, color: '#fff' },
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
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    {['demos', 'pocs'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'demos' | 'pocs')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: activeTab === tab ? 'rgba(243,156,18,0.2)' : 'transparent',
                                border: `1px solid ${activeTab === tab ? '#f39c12' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '8px',
                                color: activeTab === tab ? '#f39c12' : '#888',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                fontFamily: 'inherit',
                            }}
                        >
                            {tab === 'demos' ? '🎬 Demos' : '🔬 POCs'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'demos' ? (
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255,255,255,0.03)',
                            fontSize: '0.75rem',
                            color: '#888',
                            textTransform: 'uppercase',
                        }}>
                            <span>Company</span>
                            <span>Prospect</span>
                            <span>Type</span>
                            <span>Date</span>
                            <span>SE</span>
                            <span>Value</span>
                            <span>Status</span>
                        </div>

                        {DEMOS.map((demo, i) => (
                            <motion.div
                                key={demo.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
                                    padding: '0.75rem 1rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{demo.company}</span>
                                <span style={{ color: '#888' }}>{demo.prospect}</span>
                                <span style={{ color: '#f39c12' }}>{demo.type}</span>
                                <span style={{ color: '#888' }}>{demo.date}</span>
                                <span style={{ color: '#888' }}>{demo.se}</span>
                                <span style={{ color: '#00ff41' }}>${demo.value.toLocaleString()}</span>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    background: `${OUTCOME_COLORS[demo.outcome]}20`,
                                    color: OUTCOME_COLORS[demo.outcome],
                                }}>
                                    {demo.outcome}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        {POCS.map((poc, i) => (
                            <motion.div
                                key={poc.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STAGE_COLORS[poc.stage]}30`,
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{poc.company}</h3>
                                        <p style={{ color: '#888', fontSize: '0.8rem' }}>{poc.useCase}</p>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        background: `${STAGE_COLORS[poc.stage]}20`,
                                        color: STAGE_COLORS[poc.stage],
                                        height: 'fit-content',
                                    }}>
                                        {poc.stage.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Criteria Progress */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#888' }}>Success Criteria</span>
                                        <span style={{ color: '#00ff41' }}>{poc.met}/{poc.criteria}</span>
                                    </div>
                                    <div style={{ height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(poc.met / poc.criteria) * 100}%`,
                                            height: '100%',
                                            background: '#00ff41',
                                        }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#00ff41' }}>${poc.value.toLocaleString()}</span>
                                    {poc.daysLeft > 0 && (
                                        <span style={{ color: '#888' }}>{poc.daysLeft} days left</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
