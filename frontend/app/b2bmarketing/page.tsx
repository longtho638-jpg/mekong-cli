'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CampaignItem {
    id: string
    name: string
    channel: 'webinar' | 'content' | 'paid_ads' | 'events'
    leads: number
    mqls: number
    cost: number
    costPerMql: number
}

interface NurtureItem {
    id: string
    name: string
    segment: string
    enrolled: number
    completed: number
    converted: number
    status: 'active' | 'paused'
}

// Sample data
const CAMPAIGNS: CampaignItem[] = [
    { id: '1', name: 'Q1 Webinar Series', channel: 'webinar', leads: 450, mqls: 180, cost: 5000, costPerMql: 28 },
    { id: '2', name: 'Content Syndication', channel: 'content', leads: 320, mqls: 95, cost: 8000, costPerMql: 84 },
    { id: '3', name: 'LinkedIn Ads', channel: 'paid_ads', leads: 280, mqls: 85, cost: 6500, costPerMql: 76 },
]

const NURTURES: NurtureItem[] = [
    { id: '1', name: 'MQL Welcome Series', segment: 'New MQLs', enrolled: 500, completed: 320, converted: 48, status: 'active' },
    { id: '2', name: 'Re-engagement', segment: 'Cold Leads', enrolled: 250, completed: 85, converted: 12, status: 'active' },
    { id: '3', name: 'Product Education', segment: 'Trial Users', enrolled: 180, completed: 145, converted: 35, status: 'paused' },
]

const CHANNEL_COLORS = {
    webinar: '#00bfff',
    content: '#00ff41',
    paid_ads: '#ffd700',
    events: '#9b59b6',
}

const STATUS_COLORS = {
    active: '#00ff41',
    paused: '#888',
}

export default function B2BMarketingDashboard() {
    const [campaigns] = useState<CampaignItem[]>(CAMPAIGNS)
    const [nurtures] = useState<NurtureItem[]>(NURTURES)

    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0)
    const totalMQLs = campaigns.reduce((sum, c) => sum + c.mqls, 0)
    const totalEnrolled = nurtures.reduce((sum, n) => sum + n.enrolled, 0)
    const totalConverted = nurtures.reduce((sum, n) => sum + n.converted, 0)

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
                        <span style={{ color: '#00ff41' }}>🎯</span> B2B Marketing
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Demand Gen & Lead Nurturing</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Leads', value: totalLeads.toLocaleString(), color: '#00bfff' },
                        { label: 'MQLs', value: totalMQLs, color: '#00ff41' },
                        { label: 'Nurture Enrolled', value: totalEnrolled, color: '#ffd700' },
                        { label: 'Converted', value: totalConverted, color: '#9b59b6' },
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

                    {/* Demand Gen Campaigns */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>DEMAND GEN</h3>

                        {campaigns.map((campaign, i) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${CHANNEL_COLORS[campaign.channel]}30`,
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
                                            background: `${CHANNEL_COLORS[campaign.channel]}20`,
                                            color: CHANNEL_COLORS[campaign.channel],
                                        }}>
                                            {campaign.channel}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>👤 {campaign.leads} leads</span>
                                    <span style={{ color: '#00ff41' }}>🎯 {campaign.mqls} MQLs</span>
                                    <span style={{ color: '#ffd700' }}>${campaign.costPerMql}/MQL</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Nurture Sequences */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>NURTURING</h3>

                        {nurtures.map((nurture, i) => (
                            <motion.div
                                key={nurture.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[nurture.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{nurture.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{nurture.segment}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[nurture.status]}20`,
                                        color: STATUS_COLORS[nurture.status],
                                    }}>
                                        {nurture.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>📧 {nurture.enrolled} enrolled</span>
                                    <span style={{ color: '#00bfff' }}>✅ {nurture.completed}</span>
                                    <span style={{ color: '#00ff41' }}>🎯 {nurture.converted} conv</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
