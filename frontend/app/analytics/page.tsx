'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Metric {
    id: string
    name: string
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
    period: string
}

interface TrafficSource {
    id: string
    source: string
    visitors: number
    percentage: number
    color: string
}

interface TopPage {
    id: string
    page: string
    views: number
    bounceRate: number
    avgTime: string
}

// Sample data
const METRICS: Metric[] = [
    { id: '1', name: 'Total Users', value: 12500, change: 15.2, trend: 'up', period: 'vs last month' },
    { id: '2', name: 'Page Views', value: 85000, change: 8.5, trend: 'up', period: 'vs last month' },
    { id: '3', name: 'Bounce Rate', value: 42.5, change: -5.2, trend: 'down', period: 'vs last month' },
    { id: '4', name: 'Avg Session', value: 4.25, change: 12.0, trend: 'up', period: 'minutes' },
    { id: '5', name: 'Conversion Rate', value: 3.8, change: 0.5, trend: 'up', period: 'vs last month' },
    { id: '6', name: 'Revenue', value: 125000, change: 22.5, trend: 'up', period: 'vs last month' },
]

const TRAFFIC_SOURCES: TrafficSource[] = [
    { id: '1', source: 'Organic Search', visitors: 5200, percentage: 42, color: '#00ff41' },
    { id: '2', source: 'Direct', visitors: 3100, percentage: 25, color: '#00bfff' },
    { id: '3', source: 'Social Media', visitors: 2500, percentage: 20, color: '#e4405f' },
    { id: '4', source: 'Referral', visitors: 1200, percentage: 10, color: '#ffd700' },
    { id: '5', source: 'Email', visitors: 500, percentage: 3, color: '#8a2be2' },
]

const TOP_PAGES: TopPage[] = [
    { id: '1', page: '/warroom', views: 15200, bounceRate: 25, avgTime: '5:32' },
    { id: '2', page: '/agentops', views: 12500, bounceRate: 30, avgTime: '4:15' },
    { id: '3', page: '/shield', views: 8900, bounceRate: 35, avgTime: '3:45' },
    { id: '4', page: '/sales', views: 7500, bounceRate: 28, avgTime: '4:00' },
    { id: '5', page: '/entrepreneur', views: 6200, bounceRate: 32, avgTime: '3:30' },
]

export default function AnalyticsHubPage() {
    const [metrics] = useState(METRICS)
    const [sources] = useState(TRAFFIC_SOURCES)
    const [pages] = useState(TOP_PAGES)

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
                right: '20%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(0,255,65,0.06) 0%, transparent 60%)',
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
                        <span style={{ color: '#00ff41' }}>📊</span> Analytics Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Metrics • Traffic • Insights</p>
                </header>

                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {metrics.map((metric, i) => (
                        <motion.div
                            key={metric.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1rem',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.65rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{metric.name}</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metric.trend === 'up' ? '#00ff41' : metric.trend === 'down' ? (metric.name === 'Bounce Rate' ? '#00ff41' : '#ff6347') : '#fff' }}>
                                {metric.name === 'Revenue' ? `$${(metric.value / 1000).toFixed(0)}K` : metric.name === 'Bounce Rate' || metric.name === 'Conversion Rate' ? `${metric.value}%` : metric.value.toLocaleString()}
                            </p>
                            <p style={{
                                fontSize: '0.7rem',
                                color: metric.change > 0 ? '#00ff41' : metric.change < 0 ? '#ff6347' : '#888',
                                marginTop: '0.25rem',
                            }}>
                                {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '→'} {Math.abs(metric.change)}%
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>

                    {/* Traffic Sources */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,255,65,0.2)',
                        borderTop: '3px solid #00ff41',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00ff41' }}>🌐 Traffic Sources</h3>

                        {sources.map((source, i) => (
                            <motion.div
                                key={source.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '1rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{source.source}</span>
                                    <span style={{ fontSize: '0.85rem', color: source.color }}>{source.percentage}%</span>
                                </div>
                                <div style={{
                                    height: 8,
                                    background: '#333',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${source.percentage}%`,
                                        height: '100%',
                                        background: source.color,
                                        borderRadius: 4,
                                    }} />
                                </div>
                                <p style={{ color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                                    {source.visitors.toLocaleString()} visitors
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Top Pages */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>📄 Top Pages</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>
                            <span>Page</span>
                            <span style={{ textAlign: 'right' }}>Views</span>
                            <span style={{ textAlign: 'right' }}>Bounce</span>
                            <span style={{ textAlign: 'right' }}>Avg Time</span>
                        </div>

                        {pages.map((page, i) => (
                            <motion.div
                                key={page.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                    gap: '0.5rem',
                                    padding: '0.75rem 0',
                                    borderBottom: i < pages.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <span style={{ color: '#00bfff' }}>{page.page}</span>
                                <span style={{ textAlign: 'right', color: '#00ff41' }}>{page.views.toLocaleString()}</span>
                                <span style={{ textAlign: 'right', color: page.bounceRate > 35 ? '#ff6347' : '#888' }}>{page.bounceRate}%</span>
                                <span style={{ textAlign: 'right', color: '#ffd700' }}>{page.avgTime}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Data-Driven Decisions
                </footer>
            </div>
        </div>
    )
}
