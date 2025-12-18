'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Deal {
    id: string
    name: string
    company: string
    value: number
    stage: string
    priority: 'high' | 'medium' | 'low'
    probability: number
}

interface Account {
    id: string
    company: string
    tier: 'enterprise' | 'mid_market' | 'smb'
    arr: number
    health: 'healthy' | 'at_risk' | 'critical'
    daysToRenewal: number
    upsell: number
}

// Sample data
const DEALS: Deal[] = [
    { id: '1', name: 'Enterprise License', company: 'BigCorp', value: 50000, stage: 'proposal', priority: 'high', probability: 50 },
    { id: '2', name: 'Startup Package', company: 'StartupX', value: 15000, stage: 'negotiation', priority: 'medium', probability: 75 },
    { id: '3', name: 'Team Plan', company: 'AgencyPro', value: 8000, stage: 'demo', priority: 'low', probability: 25 },
    { id: '4', name: 'Scale Plan', company: 'GrowthCo', value: 25000, stage: 'verbal_commit', priority: 'high', probability: 90 },
]

const ACCOUNTS: Account[] = [
    { id: '1', company: 'BigCorp Inc', tier: 'enterprise', arr: 75000, health: 'healthy', daysToRenewal: 45, upsell: 25000 },
    { id: '2', company: 'MidSize Corp', tier: 'mid_market', arr: 25000, health: 'at_risk', daysToRenewal: 30, upsell: 10000 },
    { id: '3', company: 'StartupX Ltd', tier: 'smb', arr: 8000, health: 'healthy', daysToRenewal: 120, upsell: 5000 },
]

const STAGE_COLORS: Record<string, string> = {
    discovery: '#888',
    demo: '#00bfff',
    proposal: '#ffd700',
    negotiation: '#ff9500',
    verbal_commit: '#00ff41',
}

const HEALTH_COLORS = {
    healthy: '#00ff41',
    at_risk: '#ffd700',
    critical: '#ff5f56',
}

const TIER_COLORS = {
    enterprise: '#9b59b6',
    mid_market: '#3498db',
    smb: '#1abc9c',
}

export default function AEDashboard() {
    const [deals] = useState<Deal[]>(DEALS)
    const [accounts] = useState<Account[]>(ACCOUNTS)

    const pipelineValue = deals.reduce((sum, d) => sum + d.value, 0)
    const weightedValue = deals.reduce((sum, d) => sum + d.value * d.probability / 100, 0)
    const totalARR = accounts.reduce((sum, a) => sum + a.arr, 0)
    const upsellPipeline = accounts.reduce((sum, a) => sum + a.upsell, 0)

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
                        <span style={{ color: '#9b59b6' }}>💼</span> Account Executive
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Deals & Account Portfolio</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Pipeline Value', value: `$${(pipelineValue / 1000).toFixed(0)}K`, color: '#fff' },
                        { label: 'Weighted', value: `$${(weightedValue / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Total ARR', value: `$${(totalARR / 1000).toFixed(0)}K`, color: '#00ff41' },
                        { label: 'Upsell Pipeline', value: `$${(upsellPipeline / 1000).toFixed(0)}K`, color: '#ffd700' },
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

                    {/* Deals Pipeline */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>DEAL PIPELINE</h3>

                        {deals.map((deal, i) => (
                            <motion.div
                                key={deal.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STAGE_COLORS[deal.stage]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{deal.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{deal.company}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${STAGE_COLORS[deal.stage]}20`,
                                        color: STAGE_COLORS[deal.stage],
                                    }}>
                                        {deal.stage.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#00ff41' }}>${deal.value.toLocaleString()}</span>
                                    <span style={{ color: '#888' }}>{deal.probability}% prob</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Account Portfolio */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>ACCOUNT PORTFOLIO</h3>

                        {accounts.map((account, i) => (
                            <motion.div
                                key={account.id}
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>{account.company}</span>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TIER_COLORS[account.tier]}20`,
                                            color: TIER_COLORS[account.tier],
                                        }}>
                                            {account.tier.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div style={{
                                        width: 8, height: 8,
                                        borderRadius: '50%',
                                        background: HEALTH_COLORS[account.health],
                                    }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    <div>
                                        <p style={{ color: '#888' }}>ARR</p>
                                        <p style={{ color: '#00ff41' }}>${(account.arr / 1000).toFixed(0)}K</p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#888' }}>Upsell</p>
                                        <p style={{ color: '#ffd700' }}>${(account.upsell / 1000).toFixed(0)}K</p>
                                    </div>
                                    <div>
                                        <p style={{ color: '#888' }}>Renewal</p>
                                        <p style={{ color: account.daysToRenewal <= 60 ? '#ff5f56' : '#888' }}>{account.daysToRenewal}d</p>
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
