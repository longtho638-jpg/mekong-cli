'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface PatentItem {
    id: string
    title: string
    appNumber: string
    type: 'utility' | 'design' | 'provisional'
    status: 'filed' | 'pending' | 'granted'
    claims: number
    inventors: string[]
}

interface TrademarkItem {
    id: string
    name: string
    regNumber: string
    classes: string[]
    status: 'filed' | 'registered'
    territories: string[]
    daysToExpiry: number
}

// Sample data
const PATENTS: PatentItem[] = [
    { id: '1', title: 'AI-Powered Sales Agent', appNumber: 'VN202412345', type: 'utility', status: 'granted', claims: 15, inventors: ['Nguyen A', 'Tran B'] },
    { id: '2', title: 'Dashboard UI Design', appNumber: 'VN202467890', type: 'design', status: 'pending', claims: 1, inventors: ['Le C'] },
    { id: '3', title: 'Agentic Workflow System', appNumber: 'VN202411111', type: 'utility', status: 'filed', claims: 22, inventors: ['Nguyen A'] },
]

const TRADEMARKS: TrademarkItem[] = [
    { id: '1', name: 'Mekong-CLI', regNumber: 'TM202455555', classes: ['Class 9', 'Class 42'], status: 'registered', territories: ['VN', 'US', 'EU'], daysToExpiry: 3200 },
    { id: '2', name: 'AgenticOps', regNumber: 'TM202466666', classes: ['Class 42'], status: 'filed', territories: ['VN'], daysToExpiry: 0 },
    { id: '3', name: 'Mekong', regNumber: 'TM202477777', classes: ['Class 35', 'Class 42'], status: 'registered', territories: ['VN', 'SG'], daysToExpiry: 180 },
]

const STATUS_COLORS = {
    filed: '#ffd700',
    pending: '#00bfff',
    granted: '#00ff41',
    registered: '#00ff41',
}

const TYPE_COLORS = {
    utility: '#9b59b6',
    design: '#00bfff',
    provisional: '#ffd700',
}

export default function IPDashboard() {
    const [patents] = useState<PatentItem[]>(PATENTS)
    const [trademarks] = useState<TrademarkItem[]>(TRADEMARKS)

    const grantedPatents = patents.filter(p => p.status === 'granted').length
    const totalClaims = patents.reduce((sum, p) => sum + p.claims, 0)
    const registeredTMs = trademarks.filter(t => t.status === 'registered').length
    const territories = new Set(trademarks.flatMap(t => t.territories)).size

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
                        <span style={{ color: '#e67e22' }}>🔐</span> Intellectual Property
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Patents & Trademarks</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Granted Patents', value: grantedPatents, color: '#00ff41' },
                        { label: 'Total Claims', value: totalClaims, color: '#9b59b6' },
                        { label: 'Registered TMs', value: registeredTMs, color: '#00bfff' },
                        { label: 'Territories', value: territories, color: '#ffd700' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Patents */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>PATENT PORTFOLIO</h3>

                        {patents.map((patent, i) => (
                            <motion.div
                                key={patent.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[patent.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{patent.title}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.6rem',
                                                background: `${TYPE_COLORS[patent.type]}20`,
                                                color: TYPE_COLORS[patent.type],
                                            }}>
                                                {patent.type}
                                            </span>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.6rem',
                                                background: `${STATUS_COLORS[patent.status]}20`,
                                                color: STATUS_COLORS[patent.status],
                                            }}>
                                                {patent.status}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>{patent.claims} claims</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                    <span>{patent.appNumber}</span>
                                    <span style={{ marginLeft: '1rem' }}>👤 {patent.inventors.join(', ')}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Trademarks */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TRADEMARK PORTFOLIO</h3>

                        {trademarks.map((tm, i) => (
                            <motion.div
                                key={tm.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>™️ {tm.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[tm.status]}20`,
                                            color: STATUS_COLORS[tm.status],
                                        }}>
                                            {tm.status}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem' }}>
                                    {tm.classes.join(' | ')}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#00bfff' }}>🌍 {tm.territories.join(', ')}</span>
                                    {tm.status === 'registered' && (
                                        <span style={{ color: tm.daysToExpiry <= 365 ? '#ff5f56' : '#888' }}>
                                            Expires: {tm.daysToExpiry}d
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
