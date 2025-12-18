'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Ticket {
    id: string
    subject: string
    customer: string
    channel: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'open' | 'in_progress' | 'resolved'
    sla: string
}

interface Message {
    id: string
    sender: string
    content: string
    isBot: boolean
    time: string
}

// Sample data
const TICKETS: Ticket[] = [
    { id: 'TKT-001', subject: 'Lỗi deploy không hoạt động', customer: 'Nguyễn Văn A', channel: 'zalo', priority: 'high', status: 'in_progress', sla: '2h' },
    { id: 'TKT-002', subject: 'Hỏi về giá Enterprise', customer: 'Trần B', channel: 'email', priority: 'medium', status: 'open', sla: '24h' },
    { id: 'TKT-003', subject: 'Đề xuất thêm tính năng', customer: 'Lê C', channel: 'messenger', priority: 'low', status: 'open', sla: '72h' },
    { id: 'TKT-004', subject: 'Không thể đăng nhập', customer: 'Phạm D', channel: 'website', priority: 'urgent', status: 'in_progress', sla: '30m' },
]

const MESSAGES: Message[] = [
    { id: '1', sender: 'Nguyễn Văn A', content: 'Chào shop', isBot: false, time: '10:00' },
    { id: '2', sender: 'Bot', content: 'Xin chào! 👋 Mình là trợ lý AI của Mekong-CLI. Mình có thể giúp gì cho bạn nghen?', isBot: true, time: '10:00' },
    { id: '3', sender: 'Nguyễn Văn A', content: 'Lỗi khi deploy, bị timeout', isBot: false, time: '10:01' },
    { id: '4', sender: 'Bot', content: '🐛 Cảm ơn bạn đã báo lỗi! Mình đã tạo ticket TKT-001. Team sẽ hỗ trợ trong vòng 8 giờ.', isBot: true, time: '10:01' },
]

const PRIORITY_COLORS = {
    low: '#888',
    medium: '#ffd700',
    high: '#ff9500',
    urgent: '#ff5f56',
}

const STATUS_COLORS = {
    open: '#888',
    in_progress: '#00bfff',
    resolved: '#00ff41',
}

export default function SupportDashboard() {
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(TICKETS[0])

    const metrics = {
        total: TICKETS.length,
        open: TICKETS.filter(t => t.status === 'open').length,
        resolved: 12,
        csat: 4.8,
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
                        <span style={{ color: '#00bfff' }}>🎧</span> Support Dashboard
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>AI-Powered Customer Service</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Tickets', value: metrics.total, color: '#fff' },
                        { label: 'Open', value: metrics.open, color: '#ffd700' },
                        { label: 'Resolved (7d)', value: metrics.resolved, color: '#00ff41' },
                        { label: 'CSAT', value: `${metrics.csat}/5`, color: '#00bfff' },
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

                {/* Main Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Tickets List */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#888' }}>TICKETS</h3>
                        </div>

                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {TICKETS.map((ticket, i) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                    onClick={() => setSelectedTicket(ticket)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        cursor: 'pointer',
                                        background: selectedTicket?.id === ticket.id ? 'rgba(0,191,255,0.05)' : 'transparent',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>{ticket.id}</span>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            background: `${PRIORITY_COLORS[ticket.priority]}20`,
                                            color: PRIORITY_COLORS[ticket.priority],
                                        }}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{ticket.subject}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.75rem' }}>
                                        <span>{ticket.customer}</span>
                                        <span style={{ color: STATUS_COLORS[ticket.status] }}>{ticket.status}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Conversation */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#888' }}>CONVERSATION</h3>
                            {selectedTicket && (
                                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    {selectedTicket.customer} • {selectedTicket.channel}
                                </p>
                            )}
                        </div>

                        <div style={{ flex: 1, padding: '1rem', maxHeight: 300, overflowY: 'auto' }}>
                            {MESSAGES.map((msg, i) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: msg.isBot ? 'flex-start' : 'flex-end',
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: msg.isBot ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                                        background: msg.isBot ? 'rgba(0,191,255,0.1)' : 'rgba(255,255,255,0.1)',
                                        border: msg.isBot ? '1px solid rgba(0,191,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                                    }}>
                                        <p style={{ fontSize: '0.85rem' }}>{msg.content}</p>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                                        {msg.time}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Reply Input */}
                        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                            }}>
                                <input
                                    type="text"
                                    placeholder="Type a reply..."
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '0.75rem 1rem',
                                        color: '#fff',
                                        fontFamily: 'inherit',
                                        fontSize: '0.85rem',
                                    }}
                                />
                                <button style={{
                                    background: '#00bfff',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0 1.5rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}>
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
