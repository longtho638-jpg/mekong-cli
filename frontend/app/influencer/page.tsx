'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface InfluencerItem {
    id: string
    name: string
    handle: string
    platform: 'instagram' | 'tiktok' | 'youtube'
    tier: 'nano' | 'micro' | 'mid' | 'macro'
    followers: number
    engagement: number
    verified: boolean
}

interface CampaignItem {
    id: string
    name: string
    influencers: number
    deliverables: number
    reach: number
    roi: number
    status: 'active' | 'completed'
}

// Sample data
const INFLUENCERS: InfluencerItem[] = [
    { id: '1', name: 'Tech Sarah', handle: '@techsarah', platform: 'instagram', tier: 'mid', followers: 250000, engagement: 4.5, verified: true },
    { id: '2', name: 'DevMike', handle: '@devmike', platform: 'youtube', tier: 'macro', followers: 800000, engagement: 3.2, verified: true },
    { id: '3', name: 'StartupJane', handle: '@startupjane', platform: 'tiktok', tier: 'micro', followers: 45000, engagement: 6.8, verified: false },
    { id: '4', name: 'CodeMax', handle: '@codemax', platform: 'instagram', tier: 'mid', followers: 180000, engagement: 5.1, verified: true },
]

const CAMPAIGNS: CampaignItem[] = [
    { id: '1', name: 'Summer Launch', influencers: 5, deliverables: 12, reach: 850000, roi: 285, status: 'completed' },
    { id: '2', name: 'Product Update', influencers: 3, deliverables: 6, reach: 320000, roi: 0, status: 'active' },
    { id: '3', name: 'Holiday Promo', influencers: 8, deliverables: 20, reach: 1200000, roi: 420, status: 'completed' },
]

const PLATFORM_COLORS = {
    instagram: '#e4405f',
    tiktok: '#ff0050',
    youtube: '#ff0000',
}

const TIER_COLORS = {
    nano: '#888',
    micro: '#00bfff',
    mid: '#ffd700',
    macro: '#00ff41',
}

const STATUS_COLORS = {
    active: '#00bfff',
    completed: '#00ff41',
}

export default function InfluencerDashboard() {
    const [influencers] = useState<InfluencerItem[]>(INFLUENCERS)
    const [campaigns] = useState<CampaignItem[]>(CAMPAIGNS)

    const verified = influencers.filter(i => i.verified).length
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0)
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length
    const avgROI = campaigns.filter(c => c.roi > 0).reduce((sum, c) => sum + c.roi, 0) / completedCampaigns

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
                        <span style={{ color: '#e4405f' }}>🌟</span> Influencer Marketing
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Discovery & Campaigns</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Verified Influencers', value: verified, color: '#00ff41' },
                        { label: 'Total Reach', value: (totalReach / 1000000).toFixed(1) + 'M', color: '#00bfff' },
                        { label: 'Campaigns', value: completedCampaigns, color: '#ffd700' },
                        { label: 'Avg ROI', value: `${avgROI.toFixed(0)}%`, color: '#e4405f' },
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

                    {/* Influencers */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>INFLUENCER ROSTER</h3>

                        {influencers.map((inf, i) => (
                            <motion.div
                                key={inf.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${PLATFORM_COLORS[inf.platform]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{inf.name}</span>
                                        {inf.verified && <span style={{ marginLeft: '0.25rem' }}>✓</span>}
                                        <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{inf.handle}</span>
                                    </div>
                                    <div>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${PLATFORM_COLORS[inf.platform]}20`,
                                            color: PLATFORM_COLORS[inf.platform],
                                            marginRight: '0.25rem',
                                        }}>
                                            {inf.platform}
                                        </span>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TIER_COLORS[inf.tier]}20`,
                                            color: TIER_COLORS[inf.tier],
                                        }}>
                                            {inf.tier}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>👥 {(inf.followers / 1000).toFixed(0)}K</span>
                                    <span style={{ color: '#00ff41' }}>⚡ {inf.engagement}%</span>
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
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CAMPAIGNS</h3>

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
                                        {camp.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>🌟 {camp.influencers} creators</span>
                                    <span style={{ color: '#00bfff' }}>📊 {(camp.reach / 1000).toFixed(0)}K</span>
                                    {camp.roi > 0 && <span style={{ color: '#00ff41' }}>💰 {camp.roi}%</span>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
