'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CampaignItem {
    id: string
    name: string
    subject: string
    status: 'draft' | 'sent'
    sent: number
    openRate: number
    clickRate: number
}

interface AutomationItem {
    id: string
    name: string
    trigger: 'signup' | 'purchase' | 'abandoned_cart'
    status: 'active' | 'paused'
    enrolled: number
    completed: number
    steps: number
}

// Sample data
const CAMPAIGNS: CampaignItem[] = [
    { id: '1', name: 'December Newsletter', subject: '🎄 Holiday Special Inside!', status: 'sent', sent: 9500, openRate: 28.5, clickRate: 4.2 },
    { id: '2', name: 'Product Launch', subject: 'Introducing our new feature', status: 'sent', sent: 8200, openRate: 32.1, clickRate: 6.8 },
    { id: '3', name: 'Weekly Digest', subject: 'This week at Company', status: 'draft', sent: 0, openRate: 0, clickRate: 0 },
]

const AUTOMATIONS: AutomationItem[] = [
    { id: '1', name: 'Welcome Series', trigger: 'signup', status: 'active', enrolled: 500, completed: 320, steps: 4 },
    { id: '2', name: 'Abandoned Cart', trigger: 'abandoned_cart', status: 'active', enrolled: 250, completed: 45, steps: 3 },
    { id: '3', name: 'Post-Purchase', trigger: 'purchase', status: 'paused', enrolled: 180, completed: 140, steps: 2 },
]

const STATUS_COLORS = {
    draft: '#888',
    sent: '#00ff41',
    active: '#00ff41',
    paused: '#ffd700',
}

const TRIGGER_COLORS = {
    signup: '#00bfff',
    purchase: '#00ff41',
    abandoned_cart: '#ff5f56',
}

export default function EmailDashboard() {
    const [campaigns] = useState<CampaignItem[]>(CAMPAIGNS)
    const [automations] = useState<AutomationItem[]>(AUTOMATIONS)

    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const avgOpenRate = campaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + c.openRate, 0) / campaigns.filter(c => c.status === 'sent').length || 0
    const activeAutomations = automations.filter(a => a.status === 'active').length
    const totalEnrolled = automations.reduce((sum, a) => sum + a.enrolled, 0)

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
                        <span style={{ color: '#00bfff' }}>📧</span> Email Marketing
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Campaigns & Automations</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Emails Sent', value: totalSent.toLocaleString(), color: '#00ff41' },
                        { label: 'Avg Open Rate', value: `${avgOpenRate.toFixed(1)}%`, color: '#00bfff' },
                        { label: 'Active Automations', value: activeAutomations, color: '#ffd700' },
                        { label: 'Enrolled', value: totalEnrolled, color: '#9b59b6' },
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
                                    border: `1px solid ${STATUS_COLORS[campaign.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{campaign.name}</span>
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
                                <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem' }}>{campaign.subject}</p>
                                {campaign.status === 'sent' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#888' }}>📤 {campaign.sent.toLocaleString()}</span>
                                        <span style={{ color: '#00bfff' }}>👁️ {campaign.openRate}%</span>
                                        <span style={{ color: '#00ff41' }}>🖱️ {campaign.clickRate}%</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Automations */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>AUTOMATIONS</h3>

                        {automations.map((auto, i) => (
                            <motion.div
                                key={auto.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TRIGGER_COLORS[auto.trigger]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{auto.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TRIGGER_COLORS[auto.trigger]}20`,
                                            color: TRIGGER_COLORS[auto.trigger],
                                        }}>
                                            {auto.trigger.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[auto.status]}20`,
                                        color: STATUS_COLORS[auto.status],
                                    }}>
                                        {auto.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>📧 {auto.steps} steps</span>
                                    <span style={{ color: '#00bfff' }}>👥 {auto.enrolled} enrolled</span>
                                    <span style={{ color: '#00ff41' }}>✅ {Math.round(auto.completed / auto.enrolled * 100)}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
