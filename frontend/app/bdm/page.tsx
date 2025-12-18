'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Partner {
    id: string
    name: string
    company: string
    type: 'referral' | 'reseller' | 'technology' | 'strategic'
    status: 'active' | 'prospect'
    revenueShare: number
    referrals: number
    revenue: number
}

interface Opportunity {
    id: string
    name: string
    company: string
    stage: string
    value: number
    probability: number
}

// Sample data
const PARTNERS: Partner[] = [
    { id: '1', name: 'GDG Vietnam', company: 'Google Developer Groups', type: 'strategic', status: 'active', revenueShare: 20, referrals: 12, revenue: 15000 },
    { id: '2', name: 'TechAgency', company: 'Tech Consulting', type: 'reseller', status: 'active', revenueShare: 25, referrals: 8, revenue: 8500 },
    { id: '3', name: 'StartupHub', company: 'Accelerator VN', type: 'referral', status: 'active', revenueShare: 15, referrals: 5, revenue: 3200 },
]

const OPPORTUNITIES: Opportunity[] = [
    { id: '1', name: 'Enterprise Deal', company: 'BigCorp', stage: 'proposal', value: 50000, probability: 50 },
    { id: '2', name: 'Partner Integration', company: 'TechCo', stage: 'negotiation', value: 25000, probability: 75 },
    { id: '3', name: 'Expansion Deal', company: 'Existing Client', stage: 'qualified', value: 15000, probability: 25 },
]

const TYPE_COLORS = {
    referral: '#00bfff',
    reseller: '#9b59b6',
    technology: '#1abc9c',
    strategic: '#ffd700',
}

const STAGE_ORDER = ['identified', 'qualified', 'proposal', 'negotiation']
const STAGE_COLORS: Record<string, string> = {
    identified: '#888',
    qualified: '#00bfff',
    proposal: '#ffd700',
    negotiation: '#00ff41',
}

export default function BDMDashboard() {
    const [partners] = useState<Partner[]>(PARTNERS)
    const [opportunities] = useState<Opportunity[]>(OPPORTUNITIES)

    const totalRevenue = partners.reduce((sum, p) => sum + p.revenue, 0)
    const totalPayouts = partners.reduce((sum, p) => sum + p.revenue * p.revenueShare / 100, 0)
    const pipelineValue = opportunities.reduce((sum, o) => sum + o.value, 0)
    const weightedValue = opportunities.reduce((sum, o) => sum + o.value * o.probability / 100, 0)

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
                        <span style={{ color: '#e74c3c' }}>🤝</span> Business Development
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Partnerships & Strategic Opportunities</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Partner Revenue', value: `$${(totalRevenue / 1000).toFixed(1)}K`, color: '#00ff41' },
                        { label: 'Partner Payouts', value: `$${(totalPayouts / 1000).toFixed(1)}K`, color: '#ffd700' },
                        { label: 'Pipeline Value', value: `$${(pipelineValue / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Weighted Value', value: `$${(weightedValue / 1000).toFixed(0)}K`, color: '#fff' },
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

                    {/* Partners */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>PARTNER DIRECTORY</h3>

                        {partners.map((partner, i) => (
                            <motion.div
                                key={partner.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
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
                                        <span style={{ fontWeight: 600 }}>{partner.company}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.65rem',
                                            background: `${TYPE_COLORS[partner.type]}20`,
                                            color: TYPE_COLORS[partner.type],
                                        }}>
                                            {partner.type}
                                        </span>
                                    </div>
                                    <span style={{ color: '#00ff41' }}>{partner.revenueShare}%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                                    <span>{partner.referrals} referrals</span>
                                    <span>${partner.revenue.toLocaleString()} revenue</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Opportunity Pipeline */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>OPPORTUNITY PIPELINE</h3>

                        {opportunities.map((opp, i) => (
                            <motion.div
                                key={opp.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STAGE_COLORS[opp.stage]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{opp.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{opp.company}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        background: `${STAGE_COLORS[opp.stage]}20`,
                                        color: STAGE_COLORS[opp.stage],
                                    }}>
                                        {opp.stage}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#00ff41' }}>${opp.value.toLocaleString()}</span>
                                    <span style={{ color: '#888' }}>{opp.probability}% probability</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
