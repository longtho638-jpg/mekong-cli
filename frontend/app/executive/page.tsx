'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Types
interface DepartmentOverview {
    id: string
    name: string
    icon: string
    status: 'excellent' | 'good' | 'warning' | 'critical'
    kpi: number
    trend: 'up' | 'down' | 'stable'
    highlight: string
}

interface StrategicInitiative {
    id: string
    name: string
    owner: string
    progress: number
    dueDate: string
    priority: 'high' | 'medium' | 'low'
}

interface ExecutiveAlert {
    id: string
    type: 'success' | 'warning' | 'info'
    message: string
    source: string
    time: string
}

// Sample data
const DEPARTMENTS: DepartmentOverview[] = [
    { id: '1', name: 'Sales', icon: '💰', status: 'excellent', kpi: 125, trend: 'up', highlight: '$2.5M pipeline' },
    { id: '2', name: 'Marketing', icon: '📢', status: 'good', kpi: 108, trend: 'up', highlight: '410K reach' },
    { id: '3', name: 'Finance', icon: '💵', status: 'good', kpi: 95, trend: 'stable', highlight: '18mo runway' },
    { id: '4', name: 'Engineering', icon: '⚙️', status: 'excellent', kpi: 112, trend: 'up', highlight: '94% velocity' },
    { id: '5', name: 'HR', icon: '👥', status: 'warning', kpi: 85, trend: 'down', highlight: '3 open positions' },
    { id: '6', name: 'Security', icon: '🔐', status: 'good', kpi: 92, trend: 'up', highlight: '0 critical alerts' },
]

const INITIATIVES: StrategicInitiative[] = [
    { id: '1', name: 'Series A Fundraise', owner: 'CEO', progress: 65, dueDate: 'Q1 2025', priority: 'high' },
    { id: '2', name: 'Product-Market Fit V2', owner: 'CPO', progress: 80, dueDate: 'Dec 2024', priority: 'high' },
    { id: '3', name: 'Market Expansion ĐBSCL', owner: 'CMO', progress: 45, dueDate: 'Q2 2025', priority: 'medium' },
    { id: '4', name: 'SOC 2 Certification', owner: 'CTO', progress: 30, dueDate: 'Mar 2025', priority: 'medium' },
]

const ALERTS: ExecutiveAlert[] = [
    { id: '1', type: 'success', message: 'MRR exceeded $85K target for December', source: 'Finance', time: '2 hours ago' },
    { id: '2', type: 'warning', message: 'Customer churn rate increased 0.5% this month', source: 'CS', time: '4 hours ago' },
    { id: '3', type: 'info', message: 'New partnership opportunity with Saigon Tech', source: 'BD', time: 'Yesterday' },
]

const STATUS_COLORS: Record<string, string> = {
    excellent: '#00ff41',
    good: '#00bfff',
    warning: '#ffd700',
    critical: '#ff0000',
    success: '#00ff41',
    info: '#00bfff',
}

const PRIORITY_COLORS: Record<string, string> = {
    high: '#ff0000',
    medium: '#ffd700',
    low: '#00ff41',
}

export default function ExecutiveHubPage() {
    const [departments] = useState(DEPARTMENTS)
    const [initiatives] = useState(INITIATIVES)
    const [alerts] = useState(ALERTS)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Executive Metrics
    const avgKPI = (departments.reduce((sum, d) => sum + d.kpi, 0) / departments.length).toFixed(0)
    const excellentDepts = departments.filter(d => d.status === 'excellent').length
    const avgProgress = (initiatives.reduce((sum, i) => sum + i.progress, 0) / initiatives.length).toFixed(0)

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #050505 0%, #0a0a1a 50%, #050510 100%)',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Ambient */}
            <div style={{
                position: 'fixed',
                top: '5%',
                left: '20%',
                width: '60%',
                height: '25%',
                background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1600, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#ffd700' }}>👑</span> Executive Hub
                        </h1>
                        <p style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                            CEO COMMAND CENTER • agencyos.network
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ textAlign: 'right' }}
                    >
                        <p style={{ fontSize: '1.75rem', color: '#ffd700', fontWeight: 'bold' }}>
                            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p style={{ color: '#888', fontSize: '0.75rem' }}>
                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </motion.div>
                </header>

                {/* Top Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Overall KPI', value: `${avgKPI}%`, color: '#ffd700', sub: 'vs 100% target' },
                        { label: 'Excellent Depts', value: `${excellentDepts}/${departments.length}`, color: '#00ff41', sub: 'departments' },
                        { label: 'Initiative Progress', value: `${avgProgress}%`, color: '#00bfff', sub: 'avg completion' },
                        { label: 'MRR', value: '$85K', color: '#ff69b4', sub: '+12.5% MoM' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                            <p style={{ color: '#666', fontSize: '0.65rem', marginTop: '0.25rem' }}>{stat.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Department Overview */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,215,0,0.2)',
                    borderTop: '3px solid #ffd700',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ffd700' }}>🏢 Department Performance</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
                        {departments.map((dept, i) => (
                            <motion.div
                                key={dept.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    textAlign: 'center',
                                    borderBottom: `3px solid ${STATUS_COLORS[dept.status]}`,
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{dept.icon}</span>
                                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{dept.name}</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: STATUS_COLORS[dept.status] }}>
                                    {dept.kpi}%
                                    <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                                        {dept.trend === 'up' ? '↑' : dept.trend === 'down' ? '↓' : '→'}
                                    </span>
                                </p>
                                <p style={{ color: '#888', fontSize: '0.6rem', marginTop: '0.25rem' }}>{dept.highlight}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Strategic Initiatives */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>🎯 Strategic Initiatives</h3>

                        {initiatives.map((init, i) => (
                            <motion.div
                                key={init.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{init.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{init.owner} • Due: {init.dueDate}</p>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${PRIORITY_COLORS[init.priority]}20`,
                                        color: PRIORITY_COLORS[init.priority],
                                    }}>
                                        {init.priority}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${init.progress}%`,
                                            height: '100%',
                                            background: init.progress >= 70 ? '#00ff41' : init.progress >= 40 ? '#00bfff' : '#ffd700',
                                            borderRadius: 4,
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{init.progress}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Executive Alerts */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,255,65,0.2)',
                        borderTop: '3px solid #00ff41',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00ff41' }}>📢 Executive Briefing</h3>

                        {alerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STATUS_COLORS[alert.type]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '0.75rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{alert.message}</p>
                                <p style={{ color: '#888', fontSize: '0.7rem' }}>{alert.source} • {alert.time}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Executive Excellence
                </footer>
            </div>
        </div>
    )
}
