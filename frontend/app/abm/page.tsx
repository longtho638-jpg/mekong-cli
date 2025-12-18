'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface AccountItem {
    id: string
    name: string
    tier: 'tier_1' | 'tier_2' | 'tier_3'
    stage: 'identified' | 'engaged' | 'qualified' | 'opportunity'
    icpScore: number
    contacts: number
    industry: string
}

interface PlayItem {
    id: string
    name: string
    type: 'outreach' | 'nurture' | 'event' | 'content'
    touchpoints: number
    responses: number
    accounts: number
}

// Sample data
const ACCOUNTS: AccountItem[] = [
    { id: '1', name: 'Acme Corp', tier: 'tier_1', stage: 'opportunity', icpScore: 92, contacts: 8, industry: 'Technology' },
    { id: '2', name: 'GlobalTech', tier: 'tier_1', stage: 'engaged', icpScore: 88, contacts: 5, industry: 'SaaS' },
    { id: '3', name: 'StartupX', tier: 'tier_2', stage: 'qualified', icpScore: 75, contacts: 3, industry: 'Fintech' },
    { id: '4', name: 'Enterprise Inc', tier: 'tier_1', stage: 'identified', icpScore: 85, contacts: 0, industry: 'Enterprise' },
]

const PLAYS: PlayItem[] = [
    { id: '1', name: 'Q1 Executive Outreach', type: 'outreach', touchpoints: 25, responses: 8, accounts: 5 },
    { id: '2', name: 'Case Study Nurture', type: 'nurture', touchpoints: 45, responses: 12, accounts: 15 },
    { id: '3', name: 'Webinar Invite', type: 'event', touchpoints: 30, responses: 10, accounts: 10 },
]

const TIER_COLORS = {
    tier_1: '#ff5f56',
    tier_2: '#ffd700',
    tier_3: '#888',
}

const STAGE_COLORS = {
    identified: '#888',
    engaged: '#00bfff',
    qualified: '#ffd700',
    opportunity: '#00ff41',
}

const TYPE_COLORS = {
    outreach: '#00bfff',
    nurture: '#00ff41',
    event: '#ffd700',
    content: '#9b59b6',
}

export default function ABMDashboard() {
    const [accounts] = useState<AccountItem[]>(ACCOUNTS)
    const [plays] = useState<PlayItem[]>(PLAYS)

    const tier1 = accounts.filter(a => a.tier === 'tier_1').length
    const engaged = accounts.filter(a => a.stage !== 'identified').length
    const avgICP = accounts.reduce((sum, a) => sum + a.icpScore, 0) / accounts.length
    const totalResponses = plays.reduce((sum, p) => sum + p.responses, 0)

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
                        <span style={{ color: '#ff5f56' }}>🎯</span> ABM Command Center
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Account-Based Marketing</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Tier 1 Accounts', value: tier1, color: '#ff5f56' },
                        { label: 'Engaged', value: engaged, color: '#00bfff' },
                        { label: 'Avg ICP Score', value: `${avgICP.toFixed(0)}`, color: '#00ff41' },
                        { label: 'Responses', value: totalResponses, color: '#ffd700' },
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

                    {/* Accounts */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TARGET ACCOUNTS</h3>

                        {accounts.map((account, i) => (
                            <motion.div
                                key={account.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TIER_COLORS[account.tier]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{account.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TIER_COLORS[account.tier]}20`,
                                            color: TIER_COLORS[account.tier],
                                        }}>
                                            {account.tier.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STAGE_COLORS[account.stage]}20`,
                                        color: STAGE_COLORS[account.stage],
                                    }}>
                                        {account.stage}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>{account.industry}</span>
                                    <span style={{ color: '#00ff41' }}>ICP: {account.icpScore}</span>
                                    <span style={{ color: '#00bfff' }}>👥 {account.contacts}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Plays */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>ACTIVE PLAYS</h3>

                        {plays.map((play, i) => (
                            <motion.div
                                key={play.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[play.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{play.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[play.type]}20`,
                                            color: TYPE_COLORS[play.type],
                                        }}>
                                            {play.type}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>🎯 {play.accounts} accounts</span>
                                    <span style={{ color: '#00bfff' }}>📨 {play.touchpoints}</span>
                                    <span style={{ color: '#00ff41' }}>✅ {Math.round(play.responses / play.touchpoints * 100)}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
