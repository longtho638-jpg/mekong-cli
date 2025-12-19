'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// @ts-ignore
const MotionDiv = motion.div


// Types
interface CostData {
    actual: number
    baseline: number
    savings: number
    savingsPercent: number
}

interface ProviderData {
    name: string
    requests: number
    cost: number
    percent: number
    color: string
}

interface Budget {
    name: string
    limit: number
    spent: number
    percent: number
}

// Sample data
const COST_DATA: CostData = {
    actual: 42.50,
    baseline: 156.80,
    savings: 114.30,
    savingsPercent: 72.9,
}

const PROVIDERS: ProviderData[] = [
    { name: 'Llama 3.1', requests: 1247, cost: 8.20, percent: 72, color: '#00ff41' },
    { name: 'Gemini Flash', requests: 234, cost: 12.50, percent: 14, color: '#ffd700' },
    { name: 'Gemini Pro', requests: 89, cost: 15.80, percent: 8, color: '#00bfff' },
    { name: 'Claude Sonnet', requests: 45, cost: 6.00, percent: 6, color: '#9b59b6' },
]

const BUDGETS: Budget[] = [
    { name: 'AI Costs', limit: 100, spent: 42.50, percent: 42.5 },
    { name: 'Marketing', limit: 50, spent: 35, percent: 70 },
]

const DAILY_TREND = [
    { day: 'Mon', cost: 5.2 },
    { day: 'Tue', cost: 7.8 },
    { day: 'Wed', cost: 4.1 },
    { day: 'Thu', cost: 9.2 },
    { day: 'Fri', cost: 6.5 },
    { day: 'Sat', cost: 3.2 },
    { day: 'Sun', cost: 6.5 },
]

export default function CostsDashboard() {
    const [costs] = useState<CostData>(COST_DATA)
    const [providers] = useState<ProviderData[]>(PROVIDERS)
    const [budgets] = useState<Budget[]>(BUDGETS)

    const maxCost = Math.max(...DAILY_TREND.map(d => d.cost))

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
                background: 'radial-gradient(circle, rgba(0,255,65,0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#00ff41' }}>📊</span> FinOps Dashboard
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>AI Cost Optimization via Hybrid Router</p>
                </header>

                {/* Savings Hero */}
                <MotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,255,65,0.1) 0%, rgba(0,255,65,0.02) 100%)',
                        border: '1px solid rgba(0,255,65,0.2)',
                        borderRadius: '16px',
                        padding: '2rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>You're Saving</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#00ff41' }}>
                                ${costs.savings.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '1.25rem', color: '#00ff41' }}>
                                ({costs.savingsPercent}%)
                            </span>
                        </div>
                        <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                            vs ${costs.baseline.toFixed(2)} baseline (all Claude)
                        </p>
                    </div>

                    {/* Donut Chart */}
                    <div style={{ position: 'relative', width: 140, height: 140 }}>
                        <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#333" strokeWidth="3" />
                            <circle
                                cx="18" cy="18" r="15.9" fill="none"
                                stroke="#00ff41" strokeWidth="3"
                                strokeDasharray={`${costs.savingsPercent} ${100 - costs.savingsPercent}`}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{costs.savingsPercent}%</span>
                            <span style={{ fontSize: '0.7rem', color: '#888' }}>saved</span>
                        </div>
                    </div>
                </MotionDiv>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Provider Breakdown */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#888' }}>PROVIDER BREAKDOWN</h3>
                        {providers.map((provider, i) => (
                            <MotionDiv
                                key={provider.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '1rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: provider.color }} />
                                        {provider.name}
                                    </span>
                                    <span style={{ color: '#888' }}>${provider.cost.toFixed(2)} ({provider.percent}%)</span>
                                </div>
                                <div style={{ height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
                                    <MotionDiv
                                        initial={{ width: 0 }}
                                        animate={{ width: `${provider.percent}%` }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        style={{ height: '100%', background: provider.color }}
                                    />
                                </div>
                            </MotionDiv>
                        ))}
                    </div>

                    {/* Budget Progress */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#888' }}>BUDGET PROGRESS</h3>
                        {budgets.map((budget, i) => (
                            <MotionDiv
                                key={budget.name}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '1.5rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>{budget.name}</span>
                                    <span style={{ color: budget.percent >= 80 ? '#ff5f56' : '#888' }}>
                                        ${budget.spent} / ${budget.limit}
                                    </span>
                                </div>
                                <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                                    <MotionDiv
                                        initial={{ width: 0 }}
                                        animate={{ width: `${budget.percent}%` }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        style={{
                                            height: '100%',
                                            background: budget.percent >= 80 ? '#ff5f56' : budget.percent >= 50 ? '#ffd700' : '#00ff41',
                                        }}
                                    />
                                </div>
                            </MotionDiv>
                        ))}

                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'rgba(0,255,65,0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(0,255,65,0.1)',
                        }}>
                            <p style={{ color: '#00ff41', fontSize: '0.85rem' }}>
                                💡 Hybrid Router is routing 72% of requests to Llama 3.1 for maximum savings
                            </p>
                        </div>
                    </div>

                    {/* Daily Trend */}
                    <div style={{
                        gridColumn: '1 / -1',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#888' }}>DAILY COST TREND</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: 120 }}>
                            {DAILY_TREND.map((day, i) => (
                                <MotionDiv
                                    key={day.day}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(day.cost / maxCost) * 100}%` }}
                                    transition={{ delay: i * 0.05, duration: 0.5 }}
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(to top, #00ff41, rgba(0,255,65,0.3))',
                                        borderRadius: '4px 4px 0 0',
                                        position: 'relative',
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        bottom: -25,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '0.7rem',
                                        color: '#888',
                                    }}>
                                        {day.day}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        top: -20,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '0.7rem',
                                        color: '#00ff41',
                                    }}>
                                        ${day.cost}
                                    </div>
                                </MotionDiv>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
