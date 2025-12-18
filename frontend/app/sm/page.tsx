'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Rep {
    id: string
    name: string
    territory: string
    quota: number
    closed: number
    rank: number
}

interface ForecastData {
    month: string
    pipeline: number
    weighted: number
}

// Sample data
const REPS: Rep[] = [
    { id: '1', name: 'Nguyễn A', territory: 'South', quota: 50000, closed: 42000, rank: 1 },
    { id: '2', name: 'Lê C', territory: 'Central', quota: 45000, closed: 38000, rank: 2 },
    { id: '3', name: 'Trần B', territory: 'North', quota: 40000, closed: 28000, rank: 3 },
    { id: '4', name: 'Phạm D', territory: 'South', quota: 35000, closed: 22000, rank: 4 },
]

const FORECAST: ForecastData[] = [
    { month: 'Dec', pipeline: 40000, weighted: 23000 },
    { month: 'Jan', pipeline: 55000, weighted: 32000 },
    { month: 'Feb', pipeline: 48000, weighted: 28000 },
]

export default function SMDashboard() {
    const [reps] = useState<Rep[]>(REPS)
    const [forecast] = useState<ForecastData[]>(FORECAST)

    const totalQuota = reps.reduce((sum, r) => sum + r.quota, 0)
    const totalClosed = reps.reduce((sum, r) => sum + r.closed, 0)
    const attainment = (totalClosed / totalQuota * 100).toFixed(0)
    const onTrack = reps.filter(r => r.closed / r.quota >= 0.8).length

    const maxForecast = Math.max(...forecast.map(f => f.pipeline))

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
                        <span style={{ color: '#9b59b6' }}>📈</span> Sales Manager
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Forecast & Team Performance</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Team Quota', value: `$${(totalQuota / 1000).toFixed(0)}K`, color: '#fff' },
                        { label: 'Closed', value: `$${(totalClosed / 1000).toFixed(0)}K`, color: '#00ff41' },
                        { label: 'Attainment', value: `${attainment}%`, color: parseInt(attainment) >= 80 ? '#00ff41' : '#ffd700' },
                        { label: 'On Track', value: `${onTrack}/${reps.length}`, color: '#00bfff' },
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

                    {/* Forecast Chart */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>REVENUE FORECAST</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', height: 150 }}>
                            {forecast.map((f, i) => (
                                <div key={f.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: 120, marginBottom: '0.5rem' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(f.pipeline / maxForecast) * 100}%` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            style={{
                                                width: 20,
                                                background: 'rgba(155,89,182,0.3)',
                                                borderRadius: '4px 4px 0 0',
                                            }}
                                            title={`Pipeline: $${f.pipeline.toLocaleString()}`}
                                        />
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(f.weighted / maxForecast) * 100}%` }}
                                            transition={{ delay: i * 0.1 + 0.1, duration: 0.5 }}
                                            style={{
                                                width: 20,
                                                background: '#9b59b6',
                                                borderRadius: '4px 4px 0 0',
                                            }}
                                            title={`Weighted: $${f.weighted.toLocaleString()}`}
                                        />
                                    </div>
                                    <span style={{ color: '#888', fontSize: '0.75rem' }}>{f.month}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                                <span style={{ width: 12, height: 12, background: 'rgba(155,89,182,0.3)', borderRadius: 2 }} />
                                Pipeline
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                                <span style={{ width: 12, height: 12, background: '#9b59b6', borderRadius: 2 }} />
                                Weighted
                            </span>
                        </div>
                    </div>

                    {/* Team Leaderboard */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TEAM LEADERBOARD</h3>
                        {reps.map((rep, i) => {
                            const att = rep.closed / rep.quota * 100
                            return (
                                <motion.div
                                    key={rep.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{ marginBottom: '1rem' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{
                                                width: 24, height: 24,
                                                borderRadius: '50%',
                                                background: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#444',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', fontWeight: 'bold',
                                            }}>
                                                {rep.rank}
                                            </span>
                                            <span>{rep.name}</span>
                                            <span style={{ color: '#888', fontSize: '0.75rem' }}>({rep.territory})</span>
                                        </span>
                                        <span style={{ color: att >= 80 ? '#00ff41' : '#ffd700' }}>
                                            {att.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div style={{ height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(att, 100)}%` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            style={{
                                                height: '100%',
                                                background: att >= 80 ? '#00ff41' : att >= 60 ? '#ffd700' : '#ff5f56',
                                            }}
                                        />
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
