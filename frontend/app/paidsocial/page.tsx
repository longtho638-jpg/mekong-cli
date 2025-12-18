'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CampaignItem {
    id: string
    name: string
    platform: 'meta' | 'linkedin' | 'twitter' | 'tiktok'
    status: 'active' | 'paused'
    spend: number
    conversions: number
    roas: number
}

interface ABTestItem {
    id: string
    name: string
    status: 'running' | 'completed'
    variants: number
    winner: string
    confidence: number
}

// Sample data
const CAMPAIGNS: CampaignItem[] = [
    { id: '1', name: 'Q1 Brand Awareness', platform: 'meta', status: 'active', spend: 4500, conversions: 85, roas: 3.2 },
    { id: '2', name: 'LinkedIn Lead Gen', platform: 'linkedin', status: 'active', spend: 3200, conversions: 45, roas: 4.5 },
    { id: '3', name: 'Twitter Engagement', platform: 'twitter', status: 'paused', spend: 1800, conversions: 22, roas: 2.1 },
]

const ABTESTS: ABTestItem[] = [
    { id: '1', name: 'Headline Test', status: 'completed', variants: 3, winner: 'New Headline A', confidence: 95 },
    { id: '2', name: 'Creative Test', status: 'running', variants: 2, winner: '', confidence: 0 },
    { id: '3', name: 'CTA Test', status: 'completed', variants: 4, winner: 'Get Started Free', confidence: 92 },
]

const PLATFORM_COLORS = {
    meta: '#0082fb',
    linkedin: '#0077b5',
    twitter: '#1da1f2',
    tiktok: '#ff0050',
}

const STATUS_COLORS = {
    active: '#00ff41',
    paused: '#ffd700',
    running: '#00bfff',
    completed: '#00ff41',
}

export default function PaidSocialDashboard() {
    const [campaigns] = useState<CampaignItem[]>(CAMPAIGNS)
    const [tests] = useState<ABTestItem[]>(ABTESTS)

    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
    const avgROAS = campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length
    const completedTests = tests.filter(t => t.status === 'completed').length

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
                        <span style={{ color: '#0082fb' }}>📱</span> Paid Social
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Ads & Optimization</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Spend', value: `$${(totalSpend / 1000).toFixed(1)}K`, color: '#ff5f56' },
                        { label: 'Conversions', value: totalConversions, color: '#00ff41' },
                        { label: 'Avg ROAS', value: `${avgROAS.toFixed(1)}x`, color: '#00bfff' },
                        { label: 'Tests Won', value: completedTests, color: '#ffd700' },
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

                    {/* Campaigns */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CAMPAIGNS</h3>

                        {campaigns.map((campaign, i) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${PLATFORM_COLORS[campaign.platform]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{campaign.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${PLATFORM_COLORS[campaign.platform]}20`,
                                            color: PLATFORM_COLORS[campaign.platform],
                                        }}>
                                            {campaign.platform}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[campaign.status]}20`,
                                        color: STATUS_COLORS[campaign.status],
                                    }}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#ff5f56' }}>💰 ${campaign.spend.toLocaleString()}</span>
                                    <span style={{ color: '#00ff41' }}>✅ {campaign.conversions}</span>
                                    <span style={{ color: '#00bfff' }}>📈 {campaign.roas}x</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* A/B Tests */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>A/B TESTS</h3>

                        {tests.map((test, i) => (
                            <motion.div
                                key={test.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[test.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{test.name}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[test.status]}20`,
                                        color: STATUS_COLORS[test.status],
                                    }}>
                                        {test.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>🔀 {test.variants} variants</span>
                                    {test.winner && (
                                        <>
                                            <span style={{ color: '#00ff41' }}>🏆 {test.winner}</span>
                                            <span style={{ color: '#ffd700' }}>{test.confidence}%</span>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
