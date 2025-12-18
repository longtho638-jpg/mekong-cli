'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface TeamMemberItem {
    id: string
    name: string
    role: string
    utilization: number
    tasksCompleted: number
}

interface BudgetItem {
    id: string
    name: string
    category: 'paid_ads' | 'content' | 'events' | 'tools'
    allocated: number
    spent: number
    roi: number
}

// Sample data
const TEAM: TeamMemberItem[] = [
    { id: '1', name: 'Nguyen A', role: 'Content Lead', utilization: 85, tasksCompleted: 12 },
    { id: '2', name: 'Tran B', role: 'SEO Specialist', utilization: 70, tasksCompleted: 8 },
    { id: '3', name: 'Le C', role: 'Email Marketer', utilization: 60, tasksCompleted: 15 },
    { id: '4', name: 'Pham D', role: 'Paid Ads', utilization: 90, tasksCompleted: 10 },
]

const BUDGET: BudgetItem[] = [
    { id: '1', name: 'Google Ads', category: 'paid_ads', allocated: 50000, spent: 25000, roi: 200 },
    { id: '2', name: 'Blog Production', category: 'content', allocated: 20000, spent: 12000, roi: 50 },
    { id: '3', name: 'Q1 Webinars', category: 'events', allocated: 15000, spent: 8000, roi: 50 },
    { id: '4', name: 'MarTech Stack', category: 'tools', allocated: 10000, spent: 10000, roi: 0 },
]

const CATEGORY_COLORS = {
    paid_ads: '#00bfff',
    content: '#00ff41',
    events: '#ffd700',
    tools: '#9b59b6',
}

export default function MarketingManagerDashboard() {
    const [team] = useState<TeamMemberItem[]>(TEAM)
    const [budget] = useState<BudgetItem[]>(BUDGET)

    const avgUtilization = team.reduce((sum, m) => sum + m.utilization, 0) / team.length
    const totalAllocated = budget.reduce((sum, b) => sum + b.allocated, 0)
    const totalSpent = budget.reduce((sum, b) => sum + b.spent, 0)
    const avgROI = budget.filter(b => b.roi > 0).reduce((sum, b) => sum + b.roi, 0) / budget.filter(b => b.roi > 0).length || 0

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
                        <span style={{ color: '#ffd700' }}>👔</span> Marketing Manager
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Team & Budget Overview</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Team Size', value: team.length, color: '#00bfff' },
                        { label: 'Avg Utilization', value: `${avgUtilization.toFixed(0)}%`, color: '#00ff41' },
                        { label: 'Budget Spent', value: `$${(totalSpent / 1000).toFixed(0)}K`, color: '#ff5f56' },
                        { label: 'Avg ROI', value: `${avgROI.toFixed(0)}%`, color: '#ffd700' },
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

                    {/* Team */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TEAM OVERVIEW</h3>

                        {team.map((member, i) => (
                            <motion.div
                                key={member.id}
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
                                        <span style={{ fontWeight: 600 }}>{member.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{member.role}</span>
                                    </div>
                                    <span style={{ color: '#00ff41', fontSize: '0.75rem' }}>✅ {member.tasksCompleted}</span>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888' }}>Utilization</span>
                                        <span style={{ color: member.utilization > 80 ? '#ff5f56' : '#00ff41' }}>{member.utilization}%</span>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${member.utilization}%`,
                                            background: member.utilization > 80 ? '#ff5f56' : '#00ff41',
                                            borderRadius: 2,
                                        }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Budget */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>BUDGET ALLOCATION</h3>

                        {budget.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${CATEGORY_COLORS[item.category]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${CATEGORY_COLORS[item.category]}20`,
                                            color: CATEGORY_COLORS[item.category],
                                        }}>
                                            {item.category.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span style={{
                                        color: item.roi > 0 ? '#00ff41' : '#888',
                                        fontWeight: 600
                                    }}>
                                        {item.roi > 0 ? `+${item.roi}%` : '−'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>💰 ${item.spent.toLocaleString()} / ${item.allocated.toLocaleString()}</span>
                                    <span style={{
                                        color: item.spent / item.allocated > 0.9 ? '#ff5f56' : '#00bfff'
                                    }}>
                                        {Math.round(item.spent / item.allocated * 100)}%
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
