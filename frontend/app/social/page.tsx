'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface SocialAccount {
    id: string
    platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok'
    handle: string
    followers: number
    engagement: number
    status: 'active' | 'paused'
}

interface Post {
    id: string
    platform: string
    content: string
    status: 'scheduled' | 'published' | 'draft'
    engagement: { likes: number; shares: number; comments: number }
    scheduledFor: string
}

interface Campaign {
    id: string
    name: string
    platforms: string[]
    status: 'active' | 'completed' | 'planned'
    reach: number
    budget: number
    spent: number
}

// Sample data
const ACCOUNTS: SocialAccount[] = [
    { id: '1', platform: 'twitter', handle: '@agencyos', followers: 12500, engagement: 4.2, status: 'active' },
    { id: '2', platform: 'linkedin', handle: 'AgencyOS', followers: 8200, engagement: 6.8, status: 'active' },
    { id: '3', platform: 'facebook', handle: 'AgencyOSHQ', followers: 15000, engagement: 2.1, status: 'active' },
    { id: '4', platform: 'instagram', handle: '@agencyos.hq', followers: 9800, engagement: 5.5, status: 'paused' },
    { id: '5', platform: 'tiktok', handle: '@agencyos', followers: 3500, engagement: 8.2, status: 'active' },
]

const POSTS: Post[] = [
    { id: '1', platform: 'Twitter', content: '🏯 Introducing WIN-WIN-WIN Architecture...', status: 'published', engagement: { likes: 245, shares: 68, comments: 32 }, scheduledFor: 'Today 10:00' },
    { id: '2', platform: 'LinkedIn', content: 'How Binh Pháp Strategy Changed Our Startup...', status: 'scheduled', engagement: { likes: 0, shares: 0, comments: 0 }, scheduledFor: 'Tomorrow 09:00' },
    { id: '3', platform: 'Instagram', content: '✨ Behind the scenes at AgencyOS...', status: 'draft', engagement: { likes: 0, shares: 0, comments: 0 }, scheduledFor: 'TBD' },
]

const CAMPAIGNS: Campaign[] = [
    { id: '1', name: 'Q4 Product Launch', platforms: ['Twitter', 'LinkedIn'], status: 'active', reach: 125000, budget: 5000, spent: 3200 },
    { id: '2', name: 'Binh Pháp Series', platforms: ['All'], status: 'active', reach: 85000, budget: 2000, spent: 1800 },
    { id: '3', name: 'Community Growth', platforms: ['TikTok', 'Instagram'], status: 'planned', reach: 0, budget: 3000, spent: 0 },
]

const PLATFORM_COLORS: Record<string, string> = {
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
    facebook: '#4267B2',
    instagram: '#E4405F',
    tiktok: '#00f2ea',
}

const STATUS_COLORS: Record<string, string> = {
    active: '#00ff41',
    paused: '#ffd700',
    published: '#00ff41',
    scheduled: '#00bfff',
    draft: '#888',
    completed: '#8a2be2',
    planned: '#ffd700',
}

export default function SocialHubPage() {
    const [accounts] = useState(ACCOUNTS)
    const [posts] = useState(POSTS)
    const [campaigns] = useState(CAMPAIGNS)

    const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0)
    const avgEngagement = (accounts.reduce((sum, a) => sum + a.engagement, 0) / accounts.length).toFixed(1)
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0)
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '35%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(228,64,95,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#E4405F' }}>📱</span> Social Media Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Accounts • Posts • Campaigns</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Followers', value: `${(totalFollowers / 1000).toFixed(1)}K`, color: '#E4405F' },
                        { label: 'Avg Engagement', value: `${avgEngagement}%`, color: '#00ff41' },
                        { label: 'Campaign Reach', value: `${(totalReach / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Total Budget', value: `$${(totalBudget / 1000).toFixed(0)}K`, color: '#ffd700' },
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {accounts.map((account, i) => (
                        <motion.div
                            key={account.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${PLATFORM_COLORS[account.platform]}40`,
                                borderTop: `3px solid ${PLATFORM_COLORS[account.platform]}`,
                                borderRadius: '12px',
                                padding: '1rem',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: PLATFORM_COLORS[account.platform], marginBottom: '0.25rem' }}>
                                {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                            </p>
                            <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '0.5rem' }}>{account.handle}</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                                {(account.followers / 1000).toFixed(1)}K
                            </p>
                            <p style={{ color: '#00ff41', fontSize: '0.7rem' }}>{account.engagement}% eng</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(228,64,95,0.2)',
                        borderTop: '3px solid #E4405F',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#E4405F' }}>📝 Content Queue</h3>
                        {posts.map((post, i) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STATUS_COLORS[post.status]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{post.content.substring(0, 40)}...</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{post.platform} • {post.scheduledFor}</p>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[post.status]}20`,
                                        color: STATUS_COLORS[post.status],
                                    }}>
                                        {post.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>📊 Campaigns</h3>
                        {campaigns.map((campaign, i) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <p style={{ fontWeight: 600 }}>{campaign.name}</p>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${STATUS_COLORS[campaign.status]}20`,
                                        color: STATUS_COLORS[campaign.status],
                                    }}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(campaign.spent / campaign.budget) * 100}%`,
                                            height: '100%',
                                            background: campaign.spent / campaign.budget > 0.8 ? '#ff6347' : '#00ff41',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>${campaign.spent}/${campaign.budget}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Social Excellence
                </footer>
            </div>
        </div>
    )
}
