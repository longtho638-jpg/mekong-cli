'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface MetricItem {
    id: string
    name: string
    value: number
    target: number
    trend: number
    unit: string
}

interface HeadcountPlan {
    id: string
    department: string
    current: number
    target: number
    filled: number
    status: 'draft' | 'approved' | 'in_progress' | 'completed'
    budget: number
}

// Sample data
const METRICS: MetricItem[] = [
    { id: '1', name: 'Headcount', value: 250, target: 270, trend: 5, unit: '' },
    { id: '2', name: 'Turnover Rate', value: 8.5, target: 10, trend: -2, unit: '%' },
    { id: '3', name: 'Avg Tenure', value: 2.5, target: 3, trend: 0.3, unit: 'yrs' },
    { id: '4', name: 'Engagement', value: 82, target: 85, trend: 3, unit: '%' },
]

const PLANS: HeadcountPlan[] = [
    { id: '1', department: 'Engineering', current: 150, target: 180, filled: 10, status: 'in_progress', budget: 900000 },
    { id: '2', department: 'Product', current: 50, target: 60, filled: 3, status: 'approved', budget: 300000 },
    { id: '3', department: 'Sales', current: 30, target: 35, filled: 5, status: 'completed', budget: 150000 },
    { id: '4', department: 'Marketing', current: 20, target: 25, filled: 0, status: 'draft', budget: 125000 },
]

const STATUS_COLORS = {
    draft: '#888',
    approved: '#ffd700',
    in_progress: '#00bfff',
    completed: '#00ff41',
}

export default function HRAnalyticsDashboard() {
    const [metrics] = useState<MetricItem[]>(METRICS)
    const [plans] = useState<HeadcountPlan[]>(PLANS)

    const totalOpen = plans.reduce((sum, p) => sum + (p.target - p.current - p.filled), 0)
    const totalBudget = plans.reduce((sum, p) => sum + p.budget, 0)
    const avgProgress = Math.round(plans.reduce((sum, p) => {
        const needed = p.target - p.current
        return sum + (needed > 0 ? (p.filled / needed) * 100 : 100)
    }, 0) / plans.length)

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
                        <span style={{ color: '#e74c3c' }}>📊</span> HR Analytics
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Workforce Metrics & Planning</p>
                </header>

                {/* Top Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {metrics.map((metric, i) => (
                        <motion.div
                            key={metric.id}
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
                                <p style={{ color: '#888', fontSize: '0.75rem' }}>{metric.name}</p>
                                <span style={{
                                    color: metric.trend >= 0 ? '#00ff41' : '#ff5f56',
                                    fontSize: '0.7rem',
                                }}>
                                    {metric.trend >= 0 ? '↑' : '↓'} {Math.abs(metric.trend)}{metric.unit}
                                </span>
                            </div>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: metric.value >= metric.target ? '#00ff41' : '#ffd700' }}>
                                {metric.value}{metric.unit}
                            </p>
                            <p style={{ color: '#888', fontSize: '0.7rem' }}>Target: {metric.target}{metric.unit}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Workforce Plans */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>HEADCOUNT PLANS - FY2025</h3>

                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[plan.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{plan.department}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[plan.status]}20`,
                                        color: STATUS_COLORS[plan.status],
                                    }}>
                                        {plan.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888' }}>{plan.current} → {plan.target}</span>
                                        <span style={{ color: '#00bfff' }}>+{plan.filled} filled</span>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(100, (plan.filled / (plan.target - plan.current)) * 100)}%`,
                                            background: '#00ff41',
                                            borderRadius: 2,
                                        }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                                    Budget: ${(plan.budget / 1000).toFixed(0)}K
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>PLANNING SUMMARY</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Open Positions', value: totalOpen, color: '#ff5f56' },
                                { label: 'Avg Progress', value: `${avgProgress}%`, color: '#00ff41' },
                                { label: 'Total Budget', value: `$${(totalBudget / 1000000).toFixed(1)}M`, color: '#ffd700' },
                                { label: 'Departments', value: plans.length, color: '#00bfff' },
                            ].map((stat, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    textAlign: 'center',
                                }}>
                                    <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '0.3rem' }}>{stat.label}</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Monthly Target */}
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            padding: '1rem',
                        }}>
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>MONTHLY HIRING TARGET</p>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00bfff' }}>
                                {Math.ceil(totalOpen / 12)}
                                <span style={{ fontSize: '0.9rem', color: '#888', marginLeft: '0.5rem' }}>hires/month</span>
                            </p>
                            <p style={{ color: '#888', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                                Based on {totalOpen} open positions over 12 months
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
