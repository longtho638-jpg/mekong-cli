'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Ticket {
    id: string
    subject: string
    customer: string
    priority: 'urgent' | 'high' | 'normal' | 'low'
    status: 'new' | 'open' | 'pending' | 'resolved'
    channel: string
    created: string
}

interface Agent {
    id: string
    name: string
    status: 'online' | 'busy' | 'away'
    ticketsHandled: number
    avgResponseTime: string
    satisfaction: number
}

interface KnowledgeArticle {
    id: string
    title: string
    views: number
    helpful: number
    category: string
}

// Sample data
const TICKETS: Ticket[] = [
    { id: 'TKT-2024-001', subject: 'Login issue after password reset', customer: 'Mekong Corp', priority: 'urgent', status: 'open', channel: 'Email', created: '10 min ago' },
    { id: 'TKT-2024-002', subject: 'Feature request: Dark mode', customer: 'Saigon Tech', priority: 'normal', status: 'pending', channel: 'Chat', created: '2 hours ago' },
    { id: 'TKT-2024-003', subject: 'Billing inquiry Q4', customer: 'Delta Farms', priority: 'high', status: 'new', channel: 'Phone', created: '3 hours ago' },
    { id: 'TKT-2024-004', subject: 'API integration help', customer: 'Tech Startup', priority: 'normal', status: 'open', channel: 'Email', created: 'Yesterday' },
]

const AGENTS: Agent[] = [
    { id: '1', name: 'Sarah Chen', status: 'online', ticketsHandled: 45, avgResponseTime: '2m 30s', satisfaction: 98 },
    { id: '2', name: 'Mike Nguyen', status: 'busy', ticketsHandled: 38, avgResponseTime: '3m 15s', satisfaction: 95 },
    { id: '3', name: 'Lisa Tran', status: 'online', ticketsHandled: 52, avgResponseTime: '1m 45s', satisfaction: 99 },
]

const ARTICLES: KnowledgeArticle[] = [
    { id: '1', title: 'Getting Started with AgencyOS', views: 2450, helpful: 95, category: 'Onboarding' },
    { id: '2', title: 'Understanding Binh Pháp Strategy', views: 1820, helpful: 92, category: 'Strategy' },
    { id: '3', title: 'API Documentation Guide', views: 1350, helpful: 88, category: 'Technical' },
]

const STATUS_COLORS: Record<string, string> = {
    new: '#00bfff',
    open: '#ffd700',
    pending: '#8a2be2',
    resolved: '#00ff41',
    online: '#00ff41',
    busy: '#ffd700',
    away: '#888',
}

const PRIORITY_COLORS: Record<string, string> = {
    urgent: '#ff0000',
    high: '#ff6347',
    normal: '#ffd700',
    low: '#00ff41',
}

export default function SupportHubPage() {
    const [tickets] = useState(TICKETS)
    const [agents] = useState(AGENTS)
    const [articles] = useState(ARTICLES)

    // Metrics
    const openTickets = tickets.filter(t => t.status !== 'resolved').length
    const avgSatisfaction = (agents.reduce((sum, a) => sum + a.satisfaction, 0) / agents.length).toFixed(0)
    const onlineAgents = agents.filter(a => a.status === 'online').length
    const totalViews = articles.reduce((sum, a) => sum + a.views, 0)

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
                right: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(0,255,65,0.06) 0%, transparent 60%)',
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
                        <span style={{ color: '#00ff41' }}>💬</span> Support Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Tickets • Agents • Knowledge Base</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Open Tickets', value: openTickets, color: openTickets > 5 ? '#ff6347' : '#00ff41' },
                        { label: 'CSAT Score', value: `${avgSatisfaction}%`, color: '#00bfff' },
                        { label: 'Agents Online', value: `${onlineAgents}/${agents.length}`, color: '#00ff41' },
                        { label: 'KB Views', value: totalViews.toLocaleString(), color: '#ffd700' },
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

                    {/* Tickets */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,255,65,0.2)',
                        borderTop: '3px solid #00ff41',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00ff41' }}>🎫 Active Tickets</h3>

                        {tickets.map((ticket, i) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${PRIORITY_COLORS[ticket.priority]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{ticket.subject}</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ color: '#888', fontSize: '0.7rem' }}>{ticket.id}</span>
                                            <span style={{ color: '#888', fontSize: '0.7rem' }}>•</span>
                                            <span style={{ color: '#888', fontSize: '0.7rem' }}>{ticket.customer}</span>
                                            <span style={{ color: '#888', fontSize: '0.7rem' }}>•</span>
                                            <span style={{ color: '#888', fontSize: '0.7rem' }}>{ticket.channel}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${PRIORITY_COLORS[ticket.priority]}20`,
                                            color: PRIORITY_COLORS[ticket.priority],
                                        }}>
                                            {ticket.priority}
                                        </span>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[ticket.status]}20`,
                                            color: STATUS_COLORS[ticket.status],
                                        }}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Agents + Knowledge Base */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Agents */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,191,255,0.2)',
                            borderTop: '3px solid #00bfff',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00bfff' }}>👤 Support Team</h3>

                            {agents.map((agent, i) => (
                                <div
                                    key={agent.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < agents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: STATUS_COLORS[agent.status],
                                        }} />
                                        <span style={{ fontSize: '0.85rem' }}>{agent.name}</span>
                                    </div>
                                    <span style={{ color: '#00ff41', fontSize: '0.8rem' }}>{agent.satisfaction}%</span>
                                </div>
                            ))}
                        </div>

                        {/* Knowledge Base */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>📚 Top Articles</h3>

                            {articles.map((article, i) => (
                                <div
                                    key={article.id}
                                    style={{
                                        padding: '0.5rem 0',
                                        borderBottom: i < articles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{article.title}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ color: '#888', fontSize: '0.65rem' }}>{article.views} views</span>
                                        <span style={{ color: '#00ff41', fontSize: '0.65rem' }}>{article.helpful}% helpful</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Customer Excellence
                </footer>
            </div>
        </div>
    )
}
