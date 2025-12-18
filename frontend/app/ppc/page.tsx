'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CampaignItem {
    id: string
    name: string
    type: 'search' | 'display' | 'video'
    budget: number
    cost: number
    conv: number
    cpa: number
    roas: number
    status: 'enabled' | 'learning' | 'limited'
}

interface AuctionInsight {
    domain: string
    share: number
    top: number
    color: string
}

// Sample data
const CAMPAIGNS: CampaignItem[] = [
    { id: '1', name: 'SaaS Search Q1', type: 'search', budget: 150, cost: 950, conv: 28, cpa: 33.92, roas: 3.8, status: 'enabled' },
    { id: '2', name: 'Retargeting Display', type: 'display', budget: 50, cost: 320, conv: 12, cpa: 26.66, roas: 2.1, status: 'learning' },
    { id: '3', name: 'Brand Video', type: 'video', budget: 75, cost: 580, conv: 5, cpa: 116.00, roas: 1.2, status: 'limited' },
]

const AUCTION_INSIGHTS: AuctionInsight[] = [
    { domain: 'mekong.io (You)', share: 42.5, top: 85.0, color: '#00ff41' },
    { domain: 'competitor-a.com', share: 28.3, top: 45.2, color: '#ff5f56' },
    { domain: 'big-rival.net', share: 15.8, top: 32.1, color: '#e4405f' },
    { domain: 'niche-player.io', share: 8.4, top: 12.5, color: '#888' },
]

const TYPE_COLORS = {
    search: '#00bfff',
    display: '#ffd700',
    video: '#e4405f',
}

const STATUS_COLORS = {
    enabled: '#00ff41',
    learning: '#00bfff',
    limited: '#ffd700',
}

export default function PPCDashboard() {
    const [campaigns] = useState<CampaignItem[]>(CAMPAIGNS)
    const [insights] = useState<AuctionInsight[]>(AUCTION_INSIGHTS)

    const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0)
    const totalConv = campaigns.reduce((sum, c) => sum + c.conv, 0)
    const avgCPA = totalCost / totalConv
    const avgROAS = campaigns.reduce((sum, c) => sum + c.roas * c.cost, 0) / totalCost

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
                        <span style={{ color: '#00bfff' }}>🎯</span> PPC Management
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Google Ads & Smart Bidding</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Cost', value: `$${totalCost.toLocaleString()}`, color: '#00bfff' },
                        { label: 'Conversions', value: totalConv, color: '#00ff41' },
                        { label: 'Avg CPA', value: `$${avgCPA.toFixed(2)}`, color: '#ffd700' },
                        { label: 'ROAS', value: `${avgROAS.toFixed(1)}x`, color: '#e4405f' },
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

                        {campaigns.map((camp, i) => (
                            <motion.div
                                key={camp.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[camp.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{camp.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[camp.type]}20`,
                                            color: TYPE_COLORS[camp.type],
                                        }}>
                                            {camp.type}
                                        </span>
                                    </div>
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
                                    <span style={{ color: '#888' }}>💸 ${camp.cost}</span>
                                    <span style={{ color: '#00ff41' }}>🎯 {camp.conv} (CPA ${camp.cpa.toFixed(0)})</span>
                                    <span style={{ color: '#e4405f' }}>📈 {camp.roas}x</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Auction Insights */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>AUCTION INSIGHTS</h3>

                        {insights.map((competitor, i) => (
                            <motion.div
                                key={competitor.domain}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '1rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                    <span>{competitor.domain}</span>
                                    <span style={{ color: competitor.color }}>{competitor.share}% Share</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${competitor.share}%` }}
                                        style={{ height: '100%', background: competitor.color }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem', fontSize: '0.7rem', color: '#888' }}>
                                    <span>Top of page: {competitor.top}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
