'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Types
interface Metric {
    id: string
    label: string
    value: string | number
    change: number
    trend: 'up' | 'down' | 'stable'
    icon: string
}

interface WarAlert {
    id: string
    type: 'critical' | 'warning' | 'success'
    message: string
    source: string
    timestamp: string
}

interface Campaign {
    id: string
    name: string
    objective: string
    progress: number
    status: 'active' | 'planning' | 'completed'
}

// Sample data
const METRICS: Metric[] = [
    { id: '1', label: 'MRR', value: '$85K', change: 12.5, trend: 'up', icon: '💰' },
    { id: '2', label: 'Active Clients', value: 42, change: 8.2, trend: 'up', icon: '🏢' },
    { id: '3', label: 'Pipeline Value', value: '$2.5M', change: -5.3, trend: 'down', icon: '📊' },
    { id: '4', label: 'Team Velocity', value: '94%', change: 2.1, trend: 'up', icon: '⚡' },
    { id: '5', label: 'NPS Score', value: 72, change: 5.0, trend: 'up', icon: '❤️' },
    { id: '6', label: 'Runway', value: '18 mo', change: 0, trend: 'stable', icon: '🛡️' },
]

const ALERTS: WarAlert[] = [
    { id: '1', type: 'critical', message: 'High-value deal ($500K) at risk - requires CEO attention', source: 'Sales', timestamp: '10 min ago' },
    { id: '2', type: 'success', message: 'Series A milestone achieved: $100K MRR within reach', source: 'Finance', timestamp: '1 hour ago' },
    { id: '3', type: 'warning', message: 'Competitor launched similar product - market response needed', source: 'Scout', timestamp: '2 hours ago' },
]

const CAMPAIGNS: Campaign[] = [
    { id: '1', name: 'Q1 Growth Offensive', objective: 'Increase MRR to $100K', progress: 85, status: 'active' },
    { id: '2', name: 'Series A Preparation', objective: 'Complete fundraising docs', progress: 60, status: 'active' },
    { id: '3', name: 'Market Expansion - ĐBSCL', objective: 'Launch in 5 new provinces', progress: 40, status: 'planning' },
]

const BINH_PHAP_QUOTES = [
    { chapter: 1, quote: "Binh giả, quốc chi đại sự", meaning: "War is a matter of vital importance to the State" },
    { chapter: 3, quote: "Bất chiến nhi khuất nhân chi binh", meaning: "Win without fighting" },
    { chapter: 6, quote: "Hư thực", meaning: "Strength and weakness - know thyself, know thy enemy" },
]

const ALERT_COLORS: Record<string, string> = {
    critical: '#ff0000',
    warning: '#ffd700',
    success: '#00ff41',
}

export default function WarRoomPage() {
    const [metrics] = useState(METRICS)
    const [alerts] = useState(ALERTS)
    const [campaigns] = useState(CAMPAIGNS)
    const [currentQuote, setCurrentQuote] = useState(0)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        const quoteTimer = setInterval(() => setCurrentQuote(prev => (prev + 1) % BINH_PHAP_QUOTES.length), 10000)
        return () => { clearInterval(timer); clearInterval(quoteTimer) }
    }, [])

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
            {/* Animated ambient glow */}
            <div style={{
                position: 'fixed',
                top: '10%',
                left: '20%',
                width: '60%',
                height: '30%',
                background: 'radial-gradient(circle, rgba(0,191,255,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed',
                bottom: '10%',
                right: '10%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,0,0,0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1600, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                            <span style={{ color: '#ff0000' }}>🏯</span> WAR ROOM
                        </h1>
                        <p style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '0.2em' }}>
                            BINH PHÁP COMMAND CENTER • agencyos.network
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ textAlign: 'right' }}
                    >
                        <p style={{ fontSize: '2rem', color: '#00bfff', fontWeight: 'bold' }}>
                            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p style={{ color: '#888', fontSize: '0.75rem' }}>
                            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </motion.div>
                </header>

                {/* Binh Phap Quote */}
                <motion.div
                    key={currentQuote}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                        background: 'rgba(255,0,0,0.05)',
                        border: '1px solid rgba(255,0,0,0.2)',
                        borderRadius: '8px',
                        padding: '1rem 1.5rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                    }}
                >
                    <p style={{ color: '#ff6347', fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                        &quot;{BINH_PHAP_QUOTES[currentQuote].quote}&quot;
                    </p>
                    <p style={{ color: '#888', fontSize: '0.8rem' }}>
                        — Chapter {BINH_PHAP_QUOTES[currentQuote].chapter}: {BINH_PHAP_QUOTES[currentQuote].meaning}
                    </p>
                </motion.div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {metrics.map((metric, i) => (
                        <motion.div
                            key={metric.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                padding: '1rem',
                                textAlign: 'center',
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{metric.icon}</span>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0 0.25rem', color: metric.trend === 'up' ? '#00ff41' : metric.trend === 'down' ? '#ff6347' : '#fff' }}>
                                {metric.value}
                            </p>
                            <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase' }}>{metric.label}</p>
                            <p style={{
                                fontSize: '0.75rem',
                                color: metric.trend === 'up' ? '#00ff41' : metric.trend === 'down' ? '#ff6347' : '#888',
                                marginTop: '0.25rem',
                            }}>
                                {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} {Math.abs(metric.change)}%
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Alerts */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,0,0,0.2)',
                        borderTop: '3px solid #ff0000',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ff0000', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🚨 SITUATION ALERTS
                        </h3>

                        {alerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `4px solid ${ALERT_COLORS[alert.type]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{alert.message}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{alert.source} • {alert.timestamp}</p>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        background: `${ALERT_COLORS[alert.type]}20`,
                                        color: ALERT_COLORS[alert.type],
                                    }}>
                                        {alert.type}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Campaigns */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>🎯 ACTIVE CAMPAIGNS</h3>

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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{campaign.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{campaign.objective}</p>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: campaign.status === 'active' ? 'rgba(0,255,65,0.1)' : 'rgba(255,215,0,0.1)',
                                        color: campaign.status === 'active' ? '#00ff41' : '#ffd700',
                                    }}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        flex: 1,
                                        height: 8,
                                        background: '#333',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${campaign.progress}%`,
                                            height: '100%',
                                            background: campaign.progress >= 80 ? '#00ff41' : campaign.progress >= 50 ? '#00bfff' : '#ffd700',
                                            borderRadius: 4,
                                        }} />
                                    </div>
                                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{campaign.progress}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    <p style={{ color: '#ff0000', marginBottom: '0.5rem' }}>
                        🏯 &quot;Bách chiến bách thắng, phi thiện chi thiện giả dã&quot; - Trăm trận trăm thắng không phải hay nhất
                    </p>
                    agencyos.network - WIN-WIN-WIN Command Center
                </footer>
            </div>
        </div>
    )
}
