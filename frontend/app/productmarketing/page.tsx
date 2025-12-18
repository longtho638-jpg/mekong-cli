'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface LaunchItem {
    id: string
    name: string
    product: string
    type: 'major' | 'minor' | 'feature'
    status: 'planning' | 'pre_launch' | 'launched'
    progress: number
    launchDate: string
}

interface PositioningItem {
    id: string
    product: string
    category: string
    headline: string
    pillars: number
    differentiators: number
}

// Sample data
const LAUNCHES: LaunchItem[] = [
    { id: '1', name: 'Product X 2.0', product: 'Product X', type: 'major', status: 'launched', progress: 100, launchDate: 'Dec 15' },
    { id: '2', name: 'Feature Y', product: 'Product X', type: 'feature', status: 'pre_launch', progress: 75, launchDate: 'Jan 10' },
    { id: '3', name: 'Product Z', product: 'Product Z', type: 'major', status: 'planning', progress: 25, launchDate: 'Feb 28' },
]

const POSITIONINGS: PositioningItem[] = [
    { id: '1', product: 'Product X', category: 'Marketing Automation', headline: 'Marketing that scales with you', pillars: 3, differentiators: 4 },
    { id: '2', product: 'Product Z', category: 'Sales Enablement', headline: 'Close deals faster', pillars: 2, differentiators: 3 },
]

const TYPE_COLORS = {
    major: '#ff5f56',
    minor: '#ffd700',
    feature: '#00bfff',
}

const STATUS_COLORS = {
    planning: '#888',
    pre_launch: '#ffd700',
    launched: '#00ff41',
}

export default function ProductMarketingDashboard() {
    const [launches] = useState<LaunchItem[]>(LAUNCHES)
    const [positionings] = useState<PositioningItem[]>(POSITIONINGS)

    const launched = launches.filter(l => l.status === 'launched').length
    const avgProgress = launches.reduce((sum, l) => sum + l.progress, 0) / launches.length
    const totalPillars = positionings.reduce((sum, p) => sum + p.pillars, 0)
    const totalDiffs = positionings.reduce((sum, p) => sum + p.differentiators, 0)

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
                        <span style={{ color: '#ff5f56' }}>🚀</span> Product Marketing
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Launches & Positioning</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Launched', value: launched, color: '#00ff41' },
                        { label: 'Avg Progress', value: `${avgProgress.toFixed(0)}%`, color: '#00bfff' },
                        { label: 'Pillars', value: totalPillars, color: '#ffd700' },
                        { label: 'Differentiators', value: totalDiffs, color: '#9b59b6' },
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

                    {/* Launches */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>LAUNCH PIPELINE</h3>

                        {launches.map((launch, i) => (
                            <motion.div
                                key={launch.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[launch.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{launch.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[launch.type]}20`,
                                            color: TYPE_COLORS[launch.type],
                                        }}>
                                            {launch.type}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[launch.status]}20`,
                                        color: STATUS_COLORS[launch.status],
                                    }}>
                                        {launch.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888' }}>Progress</span>
                                        <span style={{ color: '#00bfff' }}>{launch.progress}%</span>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${launch.progress}%`,
                                            background: launch.status === 'launched' ? '#00ff41' : '#ffd700',
                                            borderRadius: 2,
                                        }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>📅 {launch.launchDate}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Positioning */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>POSITIONING</h3>

                        {positionings.map((pos, i) => (
                            <motion.div
                                key={pos.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{pos.product}</span>
                                    <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{pos.category}</span>
                                </div>
                                <p style={{
                                    fontSize: '0.85rem',
                                    color: '#00bfff',
                                    marginBottom: '0.5rem',
                                    fontStyle: 'italic'
                                }}>
                                    "{pos.headline}"
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>🎯 {pos.pillars} pillars</span>
                                    <span style={{ color: '#00ff41' }}>⚡ {pos.differentiators} diffs</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
