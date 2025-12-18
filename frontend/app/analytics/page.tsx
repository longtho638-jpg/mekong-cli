'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface MetricItem {
    name: string
    value: string
    change: number
    trend: 'up' | 'down' | 'flat'
    category: 'acquisition' | 'engagement' | 'conversion' | 'revenue'
}

interface InsightItem {
    id: string
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    action: string
}

// Sample data
const METRICS: MetricItem[] = [
    { name: 'Sessions', value: '52,340', change: 11.2, trend: 'up', category: 'acquisition' },
    { name: 'Users', value: '36,120', change: 8.5, trend: 'up', category: 'acquisition' },
    { name: 'Bounce Rate', value: '42.5%', change: -5.5, trend: 'up', category: 'engagement' },
    { name: 'Conversion Rate', value: '3.5%', change: 9.4, trend: 'up', category: 'conversion' },
    { name: 'Revenue', value: '$125,420', change: 27.5, trend: 'up', category: 'revenue' },
    { name: 'ROAS', value: '4.2x', change: 10.5, trend: 'up', category: 'revenue' },
]

const INSIGHTS: InsightItem[] = [
    { id: '1', title: 'Revenue Surge', description: 'Revenue increased by 27% compared to previous period', impact: 'high', action: 'Scale top campaigns' },
    { id: '2', title: 'Email Performance', description: 'Email channel shows highest ROAS at 8.5x', impact: 'high', action: 'Increase email budget' },
    { id: '3', title: 'Mobile Traffic', description: 'Mobile traffic now accounts for 65% of sessions', impact: 'medium', action: 'Optimize mobile UX' },
]

const CATEGORY_COLORS = {
    acquisition: '#00bfff',
    engagement: '#ffd700',
    conversion: '#00ff41',
    revenue: '#e4405f',
}

const IMPACT_COLORS = {
    high: '#ff5f56',
    medium: '#ffd700',
    low: '#888',
}

export default function AnalyticsDashboard() {
    const [metrics] = useState<MetricItem[]>(METRICS)
    const [insights] = useState<InsightItem[]>(INSIGHTS)

    const positiveMetrics = metrics.filter(m => m.trend === 'up').length
    const highImpactInsights = insights.filter(i => i.impact === 'high').length

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
                        <span style={{ color: '#00bfff' }}>📊</span> Marketing Analytics
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>KPIs, Trends & Insights</p>
                </header>

                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Metrics', value: metrics.length, color: '#00bfff' },
                        { label: 'Positive Trends', value: positiveMetrics, color: '#00ff41' },
                        { label: 'High-Impact Insights', value: highImpactInsights, color: '#ff5f56' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* KPI Scorecard */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>KPI SCORECARD</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {metrics.map((metric, i) => (
                                <motion.div
                                    key={metric.name}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${CATEGORY_COLORS[metric.category]}30`,
                                        borderRadius: '8px',
                                        padding: '1rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#888', fontSize: '0.75rem' }}>{metric.name}</span>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: `${CATEGORY_COLORS[metric.category]}20`,
                                            color: CATEGORY_COLORS[metric.category],
                                        }}>
                                            {metric.category}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metric.value}</span>
                                        <span style={{
                                            color: metric.change > 0 ? '#00ff41' : '#ff5f56',
                                            fontSize: '0.8rem'
                                        }}>
                                            {metric.trend === 'up' ? '↑' : '↓'} {Math.abs(metric.change).toFixed(1)}%
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Insights */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>💡 INSIGHTS</h3>

                        {insights.map((insight, i) => (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    borderLeft: `3px solid ${IMPACT_COLORS[insight.impact]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{insight.title}</span>
                                    <span style={{
                                        fontSize: '0.6rem',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: `${IMPACT_COLORS[insight.impact]}20`,
                                        color: IMPACT_COLORS[insight.impact],
                                    }}>
                                        {insight.impact}
                                    </span>
                                </div>
                                <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{insight.description}</p>
                                <p style={{ color: '#00ff41', fontSize: '0.7rem' }}>→ {insight.action}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
