'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CampaignItem {
    id: string
    name: string
    activeChannels: string[]
    budget: number
    spend: number
    progress: number
    status: 'active' | 'planning' | 'completed'
}

interface ChannelData {
    name: string
    spend: number
    revenue: number
    roas: number
    color: string
}

// Sample data
const CAMPAIGNS: CampaignItem[] = [
    { id: '1', name: 'Q4 Holiday Sale', activeChannels: ['Email', 'Social', 'Search'], budget: 50000, spend: 32500, progress: 65, status: 'active' },
    { id: '2', name: 'Spring Launch', activeChannels: ['Social', 'Influencer'], budget: 25000, spend: 0, progress: 10, status: 'planning' },
    { id: '3', name: 'Webinar Series', activeChannels: ['Email', 'Content'], budget: 15000, spend: 14800, progress: 100, status: 'completed' },
]

const CHANNELS: ChannelData[] = [
    { name: 'Email', spend: 5000, revenue: 125000, roas: 25.0, color: '#00ff41' },
    { name: 'Search', spend: 15000, revenue: 60000, roas: 4.0, color: '#00bfff' },
    { name: 'Social', spend: 20000, revenue: 50000, roas: 2.5, color: '#e4405f' },
    { name: 'Display', spend: 8000, revenue: 12000, roas: 1.5, color: '#ffd700' },
]

const STATUS_COLORS = {
    active: '#00ff41',
    planning: '#00bfff',
    completed: '#888',
}

export default function DigitalMarketingDashboard() {
    const [campaigns] = useState<CampaignItem[]>(CAMPAIGNS)
    const [channels] = useState<ChannelData[]>(CHANNELS)

    const totalSpend = channels.reduce((sum, c) => sum + c.spend, 0)
    const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0)
    const totalROAS = totalRevenue / totalSpend
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length

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
                        <span style={{ color: '#00bfff' }}>📈</span> Digital Marketing
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Campaign Orchestration & Analytics</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(1)}K`, color: '#00ff41' },
                        { label: 'Total Spend', value: `$${(totalSpend / 1000).toFixed(1)}K`, color: '#ff5f56' },
                        { label: 'Aggregated ROAS', value: `${totalROAS.toFixed(2)}x`, color: '#00bfff' },
                        { label: 'Active Campaigns', value: activeCampaigns, color: '#ffd700' },
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

                    {/* Channel Performance */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CHANNEL PERFORMANCE (ROAS)</h3>

                        {channels.sort((a, b) => b.roas - a.roas).map((channel, i) => (
                            <motion.div
                                key={channel.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '1rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                    <span>{channel.name}</span>
                                    <span style={{ color: channel.color }}>{channel.roas.toFixed(1)}x</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(channel.roas / 25) * 100}%` }}
                                        style={{ height: '100%', background: channel.color }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: '#888' }}>
                                    <span>Spend: ${channel.spend.toLocaleString()}</span>
                                    <span>Rev: ${channel.revenue.toLocaleString()}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Campaigns */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CAMPAIGN TIMELINE</h3>

                        {campaigns.map((camp, i) => (
                            <motion.div
                                key={camp.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[camp.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{camp.name}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[camp.status]}20`,
                                        color: STATUS_COLORS[camp.status],
                                    }}>
                                        {camp.status.toUpperCase()}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    {camp.activeChannels.map(ch => (
                                        <span key={ch} style={{ fontSize: '0.6rem', color: '#888', border: '1px solid #333', padding: '1px 4px', borderRadius: '3px' }}>
                                            {ch}
                                        </span>
                                    ))}
                                </div>

                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem', color: '#888' }}>
                                        <span>Progress</span>
                                        <span>{camp.progress}%</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${camp.progress}%`, height: '100%', background: STATUS_COLORS[camp.status] }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>Budget: ${camp.budget.toLocaleString()}</span>
                                    <span style={{ color: camp.spend > camp.budget ? '#ff5f56' : '#00ff41' }}>
                                        Spend: ${camp.spend.toLocaleString()}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
