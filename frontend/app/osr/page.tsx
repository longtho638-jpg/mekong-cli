'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Visit {
    id: string
    customer: string
    company: string
    address: string
    type: string
    time: string
    status: 'scheduled' | 'completed' | 'in_progress'
}

interface Territory {
    id: string
    name: string
    rep: string
    customers: number
    coverage: number
    revenue: number
    target: number
}

// Sample data
const VISITS: Visit[] = [
    { id: '1', customer: 'Nguyễn A', company: 'TechCorp VN', address: '123 Nguyễn Huệ, Q1', type: 'demo', time: '09:00', status: 'completed' },
    { id: '2', customer: 'Trần B', company: 'StartupX', address: '456 Lê Lợi, Q1', type: 'follow_up', time: '11:00', status: 'in_progress' },
    { id: '3', customer: 'Lê C', company: 'Agency Pro', address: '789 Đồng Khởi, Q1', type: 'closing', time: '14:00', status: 'scheduled' },
    { id: '4', customer: 'Phạm D', company: 'Digital VN', address: '321 Hai Bà Trưng, Q3', type: 'first_meeting', time: '16:00', status: 'scheduled' },
]

const TERRITORIES: Territory[] = [
    { id: '1', name: 'HCM South', rep: 'Rep A', customers: 45, coverage: 85, revenue: 42000, target: 50000 },
    { id: '2', name: 'HCM North', rep: 'Rep B', customers: 38, coverage: 72, revenue: 35000, target: 40000 },
    { id: '3', name: 'Hanoi', rep: 'Rep C', customers: 30, coverage: 65, revenue: 28000, target: 35000 },
]

const STATUS_COLORS = {
    scheduled: '#888',
    in_progress: '#ffd700',
    completed: '#00ff41',
}

export default function OSRDashboard() {
    const [visits] = useState<Visit[]>(VISITS)
    const [territories] = useState<Territory[]>(TERRITORIES)

    const todayVisits = visits.length
    const completed = visits.filter(v => v.status === 'completed').length
    const totalRevenue = territories.reduce((sum, t) => sum + t.revenue, 0)
    const avgCoverage = (territories.reduce((sum, t) => sum + t.coverage, 0) / territories.length).toFixed(0)

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
                        <span style={{ color: '#e67e22' }}>🚗</span> Outside Sales Dashboard
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Field Visits & Territory Management</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: "Today's Visits", value: todayVisits, color: '#fff' },
                        { label: 'Completed', value: completed, color: '#00ff41' },
                        { label: 'Territory Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, color: '#ffd700' },
                        { label: 'Avg Coverage', value: `${avgCoverage}%`, color: '#00bfff' },
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

                    {/* Today's Route */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#888' }}>TODAY'S ROUTE</h3>
                        </div>

                        {visits.map((visit, i) => (
                            <motion.div
                                key={visit.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{
                                    width: 32, height: 32,
                                    borderRadius: '50%',
                                    background: `${STATUS_COLORS[visit.status]}20`,
                                    border: `2px solid ${STATUS_COLORS[visit.status]}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    color: STATUS_COLORS[visit.status],
                                }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {visit.time} - {visit.company}
                                    </p>
                                    <p style={{ color: '#888', fontSize: '0.75rem' }}>
                                        📍 {visit.address} • {visit.type}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.65rem',
                                    background: `${STATUS_COLORS[visit.status]}20`,
                                    color: STATUS_COLORS[visit.status],
                                }}>
                                    {visit.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Territory Performance */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TERRITORY PERFORMANCE</h3>

                        {territories.map((territory, i) => {
                            const attainment = (territory.revenue / territory.target * 100)
                            return (
                                <motion.div
                                    key={territory.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{ marginBottom: '1.25rem' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>
                                            <strong>{territory.name}</strong>
                                            <span style={{ color: '#888', fontSize: '0.8rem' }}> ({territory.rep})</span>
                                        </span>
                                        <span style={{ display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: '#888', fontSize: '0.8rem' }}>{territory.customers} customers</span>
                                            <span style={{ color: attainment >= 80 ? '#00ff41' : '#ffd700' }}>{attainment.toFixed(0)}%</span>
                                        </span>
                                    </div>
                                    <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(attainment, 100)}%` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            style={{
                                                height: '100%',
                                                background: attainment >= 80 ? '#00ff41' : attainment >= 60 ? '#ffd700' : '#ff5f56',
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: '#888' }}>
                                        <span>Coverage: {territory.coverage}%</span>
                                        <span>${territory.revenue.toLocaleString()} / ${territory.target.toLocaleString()}</span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
