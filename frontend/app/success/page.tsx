'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface User {
    id: string
    name: string
    email: string
    plan: string
    healthScore: number
    onboardingProgress: number
    risk: 'healthy' | 'at_risk' | 'critical'
    lastActive: string
}

// Sample data
const USERS: User[] = [
    { id: '1', name: 'Nguyễn Văn A', email: 'a@email.com', plan: 'pro', healthScore: 85, onboardingProgress: 100, risk: 'healthy', lastActive: '2h ago' },
    { id: '2', name: 'Trần B', email: 'b@email.com', plan: 'starter', healthScore: 45, onboardingProgress: 60, risk: 'at_risk', lastActive: '5d ago' },
    { id: '3', name: 'Lê C', email: 'c@email.com', plan: 'pro', healthScore: 72, onboardingProgress: 80, risk: 'healthy', lastActive: '1d ago' },
    { id: '4', name: 'Phạm D', email: 'd@email.com', plan: 'enterprise', healthScore: 25, onboardingProgress: 40, risk: 'critical', lastActive: '14d ago' },
    { id: '5', name: 'Hoàng E', email: 'e@email.com', plan: 'pro', healthScore: 90, onboardingProgress: 100, risk: 'healthy', lastActive: '3h ago' },
]

const RISK_COLORS = {
    healthy: '#00ff41',
    at_risk: '#ffd700',
    critical: '#ff5f56',
}

export default function SuccessDashboard() {
    const [users] = useState<User[]>(USERS)

    const metrics = {
        total: users.length,
        avgHealth: Math.round(users.reduce((sum, u) => sum + u.healthScore, 0) / users.length),
        atRisk: users.filter(u => u.risk !== 'healthy').length,
        activated: users.filter(u => u.onboardingProgress >= 50).length,
    }

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
                        <span style={{ color: '#00ff41' }}>🎯</span> Customer Success
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Health Scores & Retention</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Users', value: metrics.total, color: '#fff' },
                        { label: 'Avg Health', value: `${metrics.avgHealth}%`, color: '#00bfff' },
                        { label: 'At Risk', value: metrics.atRisk, color: '#ff5f56' },
                        { label: 'Activated', value: `${metrics.activated}/${metrics.total}`, color: '#00ff41' },
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

                {/* Health Formula */}
                <div style={{
                    background: 'rgba(0,255,65,0.05)',
                    border: '1px solid rgba(0,255,65,0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2rem',
                }}>
                    <span style={{ color: '#888' }}>Health Score = </span>
                    <span><span style={{ color: '#00bfff' }}>Usage</span>(40%)</span>
                    <span>+</span>
                    <span><span style={{ color: '#ffd700' }}>Engagement</span>(30%)</span>
                    <span>+</span>
                    <span><span style={{ color: '#9b59b6' }}>Support</span>(20%)</span>
                    <span>+</span>
                    <span><span style={{ color: '#888' }}>Tenure</span>(10%)</span>
                </div>

                {/* Users Table */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1.5fr 1fr 1fr',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255,255,255,0.03)',
                        fontSize: '0.75rem',
                        color: '#888',
                        textTransform: 'uppercase',
                    }}>
                        <span>Name</span>
                        <span>Email</span>
                        <span>Plan</span>
                        <span>Health</span>
                        <span>Onboarding</span>
                        <span>Risk</span>
                        <span>Active</span>
                    </div>

                    {users.map((user, i) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1.5fr 1fr 1fr',
                                padding: '0.75rem 1rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                            }}
                        >
                            <span>{user.name}</span>
                            <span style={{ color: '#888' }}>{user.email}</span>
                            <span style={{ color: '#9b59b6' }}>{user.plan}</span>

                            {/* Health Score Bar */}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: 60,
                                    height: 6,
                                    background: '#222',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${user.healthScore}%`,
                                        height: '100%',
                                        background: RISK_COLORS[user.risk],
                                    }} />
                                </div>
                                <span style={{ color: RISK_COLORS[user.risk] }}>{user.healthScore}</span>
                            </span>

                            {/* Onboarding Progress */}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: 60,
                                    height: 6,
                                    background: '#222',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${user.onboardingProgress}%`,
                                        height: '100%',
                                        background: user.onboardingProgress >= 50 ? '#00ff41' : '#ffd700',
                                    }} />
                                </div>
                                <span>{user.onboardingProgress}%</span>
                            </span>

                            <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                background: `${RISK_COLORS[user.risk]}20`,
                                color: RISK_COLORS[user.risk],
                            }}>
                                {user.risk}
                            </span>

                            <span style={{ color: '#888' }}>{user.lastActive}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Alerts */}
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>RETENTION ALERTS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {users.filter(u => u.risk !== 'healthy').map(user => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    padding: '1rem',
                                    background: `${RISK_COLORS[user.risk]}10`,
                                    border: `1px solid ${RISK_COLORS[user.risk]}30`,
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span>
                                    {user.risk === 'critical' ? '🚨' : '⚠️'}
                                    <strong> {user.name}</strong> - Score: {user.healthScore}, Last active: {user.lastActive}
                                </span>
                                <button style={{
                                    background: RISK_COLORS[user.risk],
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                }}>
                                    Reach Out
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
