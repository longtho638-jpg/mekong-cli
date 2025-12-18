'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Server {
    id: string
    name: string
    type: 'production' | 'staging' | 'development'
    status: 'online' | 'offline' | 'warning'
    cpu: number
    memory: number
    uptime: string
}

interface Ticket {
    id: string
    title: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    status: 'open' | 'in_progress' | 'resolved'
    assignee: string
    created: string
}

interface Service {
    id: string
    name: string
    status: 'operational' | 'degraded' | 'outage'
    latency: number
}

// Sample data
const SERVERS: Server[] = [
    { id: '1', name: 'api-prod-1', type: 'production', status: 'online', cpu: 45, memory: 68, uptime: '99.99%' },
    { id: '2', name: 'api-prod-2', type: 'production', status: 'online', cpu: 52, memory: 71, uptime: '99.98%' },
    { id: '3', name: 'api-staging', type: 'staging', status: 'warning', cpu: 85, memory: 90, uptime: '99.50%' },
    { id: '4', name: 'dev-server', type: 'development', status: 'online', cpu: 25, memory: 45, uptime: '98.00%' },
]

const TICKETS: Ticket[] = [
    { id: 'TKT-001', title: 'Database connection timeout', priority: 'critical', status: 'in_progress', assignee: 'DevOps', created: '30 min ago' },
    { id: 'TKT-002', title: 'SSL certificate renewal', priority: 'high', status: 'open', assignee: 'SysAdmin', created: '2 hours ago' },
    { id: 'TKT-003', title: 'New developer onboarding', priority: 'medium', status: 'open', assignee: 'IT Support', created: 'Yesterday' },
]

const SERVICES: Service[] = [
    { id: '1', name: 'API Gateway', status: 'operational', latency: 45 },
    { id: '2', name: 'Authentication', status: 'operational', latency: 120 },
    { id: '3', name: 'Database Cluster', status: 'degraded', latency: 250 },
    { id: '4', name: 'CDN', status: 'operational', latency: 15 },
    { id: '5', name: 'Email Service', status: 'operational', latency: 180 },
]

const STATUS_COLORS: Record<string, string> = {
    online: '#00ff41',
    offline: '#ff0000',
    warning: '#ffd700',
    operational: '#00ff41',
    degraded: '#ffd700',
    outage: '#ff0000',
    open: '#00bfff',
    in_progress: '#ffd700',
    resolved: '#00ff41',
}

const PRIORITY_COLORS: Record<string, string> = {
    critical: '#ff0000',
    high: '#ff6347',
    medium: '#ffd700',
    low: '#00ff41',
}

export default function ITHubPage() {
    const [servers] = useState(SERVERS)
    const [tickets] = useState(TICKETS)
    const [services] = useState(SERVICES)

    // Metrics
    const onlineServers = servers.filter(s => s.status === 'online').length
    const avgCPU = (servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length).toFixed(0)
    const openTickets = tickets.filter(t => t.status !== 'resolved').length
    const operationalServices = services.filter(s => s.status === 'operational').length

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
                right: '20%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 60%)',
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
                        <span style={{ color: '#8a2be2' }}>🖥️</span> IT Operations Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Infrastructure • Tickets • Services</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Servers Online', value: `${onlineServers}/${servers.length}`, color: '#00ff41' },
                        { label: 'Avg CPU', value: `${avgCPU}%`, color: parseInt(avgCPU) > 80 ? '#ff6347' : '#00bfff' },
                        { label: 'Open Tickets', value: openTickets, color: openTickets > 0 ? '#ffd700' : '#00ff41' },
                        { label: 'Services Up', value: `${operationalServices}/${services.length}`, color: '#8a2be2' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Servers */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(138,43,226,0.2)',
                        borderTop: '3px solid #8a2be2',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#8a2be2' }}>🖥️ Server Status</h3>

                        {servers.map((server, i) => (
                            <motion.div
                                key={server.id}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: STATUS_COLORS[server.status],
                                        }} />
                                        <span style={{ fontWeight: 600 }}>{server.name}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        background: 'rgba(138,43,226,0.1)',
                                        color: '#8a2be2',
                                    }}>
                                        {server.type}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                                    <span>CPU: <span style={{ color: server.cpu > 80 ? '#ff6347' : '#00ff41' }}>{server.cpu}%</span></span>
                                    <span>MEM: <span style={{ color: server.memory > 80 ? '#ff6347' : '#00bfff' }}>{server.memory}%</span></span>
                                    <span>Uptime: <span style={{ color: '#888' }}>{server.uptime}</span></span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Tickets + Services */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Tickets */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>🎫 Support Tickets</h3>

                            {tickets.map((ticket, i) => (
                                <div
                                    key={ticket.id}
                                    style={{
                                        padding: '0.5rem 0',
                                        borderBottom: i < tickets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ fontSize: '0.85rem' }}>{ticket.title}</p>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${PRIORITY_COLORS[ticket.priority]}20`,
                                            color: PRIORITY_COLORS[ticket.priority],
                                        }}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <span style={{ color: '#888', fontSize: '0.7rem' }}>{ticket.id}</span>
                                        <span style={{ color: STATUS_COLORS[ticket.status], fontSize: '0.7rem' }}>{ticket.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Services */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,255,65,0.2)',
                            borderTop: '3px solid #00ff41',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00ff41' }}>📡 Service Status</h3>

                            {services.map((svc, i) => (
                                <div
                                    key={svc.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < services.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: STATUS_COLORS[svc.status],
                                        }} />
                                        <span style={{ fontSize: '0.85rem' }}>{svc.name}</span>
                                    </div>
                                    <span style={{ color: svc.latency > 200 ? '#ff6347' : '#888', fontSize: '0.75rem' }}>
                                        {svc.latency}ms
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - IT Excellence
                </footer>
            </div>
        </div>
    )
}
