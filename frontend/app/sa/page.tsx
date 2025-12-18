'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface KPI {
    name: string
    value: number
    target: number
    unit: string
    change: number
}

interface FunnelStage {
    name: string
    count: number
    value: number
}

interface Insight {
    id: string
    title: string
    description: string
    type: 'trend' | 'anomaly' | 'opportunity'
    priority: 'high' | 'medium' | 'low'
}

// Sample data
const KPIS: KPI[] = [
    { name: 'Revenue', value: 125000, target: 150000, unit: '$', change: 12 },
    { name: 'Deals Closed', value: 28, target: 35, unit: '', change: 8 },
    { name: 'Win Rate', value: 42, target: 40, unit: '%', change: 5 },
    { name: 'Avg Deal Size', value: 4500, target: 5000, unit: '$', change: -3 },
]

const FUNNEL: FunnelStage[] = [
    { name: 'Leads', count: 500, value: 250000 },
    { name: 'MQLs', count: 150, value: 150000 },
    { name: 'SQLs', count: 75, value: 112500 },
    { name: 'Opportunities', count: 40, value: 80000 },
    { name: 'Closed Won', count: 15, value: 45000 },
]

const INSIGHTS: Insight[] = [
    { id: '1', title: 'Revenue shows upward trend', description: 'Monthly revenue increased by 25% over Q4.', type: 'trend', priority: 'high' },
    { id: '2', title: 'Lead volume anomaly detected', description: 'Daily leads 55% below baseline.', type: 'anomaly', priority: 'high' },
    { id: '3', title: 'Enterprise segment opportunity', description: '40% coverage gap in enterprise.', type: 'opportunity', priority: 'medium' },
]

const PRIORITY_COLORS = {
    high: '#ff5f56',
    medium: '#ffd700',
    low: '#888',
}

const TYPE_ICONS = {
    trend: '📈',
    anomaly: '⚠️',
    opportunity: '💡',
}

export default function SADashboard() {
    const [kpis] = useState<KPI[]>(KPIS)
    const [funnel] = useState<FunnelStage[]>(FUNNEL)
    const [insights] = useState<Insight[]>(INSIGHTS)

    const maxFunnel = Math.max(...funnel.map(f => f.count))

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
                        <span style={{ color: '#3498db' }}>📊</span> Sales Analytics
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>KPIs, Funnels & Insights</p>
                </header>

                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {kpis.map((kpi, i) => {
                        const attainment = (kpi.value / kpi.target * 100)
                        const color = attainment >= 100 ? '#00ff41' : attainment >= 80 ? '#ffd700' : '#ff5f56'

                        return (
                            <motion.div
                                key={kpi.name}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <p style={{ color: '#888', fontSize: '0.75rem' }}>{kpi.name}</p>
                                    <span style={{ fontSize: '0.75rem', color: kpi.change >= 0 ? '#00ff41' : '#ff5f56' }}>
                                        {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%
                                    </span>
                                </div>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {kpi.unit === '$' && '$'}{kpi.value.toLocaleString()}{kpi.unit === '%' && '%'}
                                </p>
                                <div style={{ height: 4, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(attainment, 100)}%`, height: '100%', background: color }} />
                                </div>
                                <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.25rem' }}>
                                    {attainment.toFixed(0)}% of {kpi.unit === '$' && '$'}{kpi.target.toLocaleString()}{kpi.unit === '%' && '%'}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Funnel */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>SALES FUNNEL</h3>

                        {funnel.map((stage, i) => {
                            const width = (stage.count / maxFunnel * 100)
                            const convRate = i > 0 ? ((stage.count / funnel[i - 1].count) * 100).toFixed(0) : '100'

                            return (
                                <motion.div
                                    key={stage.name}
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    transition={{ delay: i * 0.15, duration: 0.4 }}
                                    style={{ marginBottom: '1rem', transformOrigin: 'left' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                                        <span>{stage.name}</span>
                                        <span style={{ color: '#888' }}>{stage.count} ({i > 0 ? convRate + '% conv' : 'top'})</span>
                                    </div>
                                    <div style={{
                                        width: `${width}%`,
                                        height: 24,
                                        background: `linear-gradient(90deg, rgba(52,152,219,0.8), rgba(52,152,219,0.4))`,
                                        borderRadius: '4px 12px 12px 4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingLeft: '0.5rem',
                                    }}>
                                        <span style={{ fontSize: '0.7rem', color: '#fff' }}>${(stage.value / 1000).toFixed(0)}K</span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Insights */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>INSIGHTS</h3>

                        {insights.map((insight, i) => (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${PRIORITY_COLORS[insight.priority]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>{TYPE_ICONS[insight.type]}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{insight.title}</span>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '12px',
                                                fontSize: '0.6rem',
                                                background: `${PRIORITY_COLORS[insight.priority]}20`,
                                                color: PRIORITY_COLORS[insight.priority],
                                            }}>
                                                {insight.priority}
                                            </span>
                                        </div>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{insight.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
