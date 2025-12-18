'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Campaign {
    id: string
    name: string
    platform: string
    status: 'active' | 'paused' | 'completed'
    reach: number
    engagement: number
    spend: number
}

interface SocialAccount {
    id: string
    platform: string
    handle: string
    followers: number
    growth: number
}

interface ContentItem {
    id: string
    title: string
    type: 'post' | 'video' | 'story'
    scheduled: string
    status: 'draft' | 'scheduled' | 'published'
}

// Sample data
const CAMPAIGNS: Campaign[] = [
    { id: '1', name: 'Tết 2025 Launch', platform: 'Facebook', status: 'active', reach: 125000, engagement: 8.5, spend: 2500 },
    { id: '2', name: 'Product Discovery', platform: 'TikTok', status: 'active', reach: 85000, engagement: 12.3, spend: 1800 },
    { id: '3', name: 'Brand Awareness', platform: 'Instagram', status: 'completed', reach: 200000, engagement: 6.2, spend: 3500 },
]

const ACCOUNTS: SocialAccount[] = [
    { id: '1', platform: 'Facebook', handle: '@agencyos', followers: 15200, growth: 12.5 },
    { id: '2', platform: 'Instagram', handle: '@agencyos.network', followers: 8500, growth: 18.2 },
    { id: '3', platform: 'TikTok', handle: '@agencyos', followers: 22000, growth: 45.0 },
    { id: '4', platform: 'LinkedIn', handle: 'AgencyOS', followers: 3200, growth: 8.5 },
]

const CONTENT_QUEUE: ContentItem[] = [
    { id: '1', title: 'How to Deploy Agency in 15 Minutes', type: 'video', scheduled: 'Today 3PM', status: 'scheduled' },
    { id: '2', title: 'WIN-WIN-WIN Framework Explained', type: 'post', scheduled: 'Tomorrow 9AM', status: 'scheduled' },
    { id: '3', title: 'Behind the Scenes: Building AgencyOS', type: 'story', scheduled: 'Draft', status: 'draft' },
]

const PLATFORM_COLORS: Record<string, string> = {
    Facebook: '#1877f2',
    Instagram: '#e4405f',
    TikTok: '#00f2ea',
    LinkedIn: '#0077b5',
}

export default function MarketingHubPage() {
    const [campaigns] = useState(CAMPAIGNS)
    const [accounts] = useState(ACCOUNTS)
    const [content] = useState(CONTENT_QUEUE)

    // Metrics
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0)
    const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0)
    const avgEngagement = campaigns.reduce((sum, c) => sum + c.engagement, 0) / campaigns.length
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)

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
                left: '40%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(228,64,95,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#e4405f' }}>📢</span> Marketing Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Campaigns • Social • Content</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Reach', value: `${(totalReach / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Followers', value: `${(totalFollowers / 1000).toFixed(1)}K`, color: '#e4405f' },
                        { label: 'Avg Engagement', value: `${avgEngagement.toFixed(1)}%`, color: '#00ff41' },
                        { label: 'Ad Spend', value: `$${totalSpend.toLocaleString()}`, color: '#ffd700' },
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
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Campaigns */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(228,64,95,0.2)',
                        borderTop: '3px solid #e4405f',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#e4405f' }}>📊 Active Campaigns</h3>

                        {campaigns.map((campaign, i) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${PLATFORM_COLORS[campaign.platform]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{campaign.name}</p>
                                        <p style={{ color: PLATFORM_COLORS[campaign.platform], fontSize: '0.75rem' }}>{campaign.platform}</p>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: campaign.status === 'active' ? 'rgba(0,255,65,0.1)' : 'rgba(136,136,136,0.1)',
                                        color: campaign.status === 'active' ? '#00ff41' : '#888',
                                    }}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
                                    <span><span style={{ color: '#00bfff' }}>{(campaign.reach / 1000).toFixed(0)}K</span> reach</span>
                                    <span><span style={{ color: '#00ff41' }}>{campaign.engagement}%</span> eng</span>
                                    <span><span style={{ color: '#ffd700' }}>${campaign.spend}</span> spend</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Social + Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Social Accounts */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,191,255,0.2)',
                            borderTop: '3px solid #00bfff',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00bfff' }}>📱 Social Accounts</h3>

                            {accounts.map((acc, i) => (
                                <div
                                    key={acc.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < accounts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: PLATFORM_COLORS[acc.platform],
                                        }} />
                                        <span style={{ fontSize: '0.85rem' }}>{acc.handle}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.85rem' }}>{(acc.followers / 1000).toFixed(1)}K</p>
                                        <p style={{ color: '#00ff41', fontSize: '0.7rem' }}>+{acc.growth}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Content Queue */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>📝 Content Queue</h3>

                            {content.map((item, i) => (
                                <div
                                    key={item.id}
                                    style={{
                                        padding: '0.5rem 0',
                                        borderBottom: i < content.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ fontSize: '0.85rem' }}>{item.title.slice(0, 30)}...</p>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: item.status === 'scheduled' ? 'rgba(0,255,65,0.1)' : 'rgba(255,215,0,0.1)',
                                            color: item.status === 'scheduled' ? '#00ff41' : '#ffd700',
                                        }}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p style={{ color: '#888', fontSize: '0.7rem' }}>{item.type} • {item.scheduled}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Growth Marketing
                </footer>
            </div>
        </div>
    )
}
