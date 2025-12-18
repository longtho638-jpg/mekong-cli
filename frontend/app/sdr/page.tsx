'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Lead {
    id: string
    name: string
    company: string
    title: string
    bant: { budget: number, authority: number, need: number, timeline: number }
    status: 'pending' | 'qualified' | 'disqualified' | 'handed_off'
}

interface Meeting {
    id: string
    lead: string
    company: string
    type: string
    time: string
    ae: string
    status: 'scheduled' | 'confirmed' | 'completed'
}

// Sample data
const LEADS: Lead[] = [
    { id: '1', name: 'Nguyễn A', company: 'TechCorp VN', title: 'CTO', bant: { budget: 22, authority: 20, need: 25, timeline: 18 }, status: 'qualified' },
    { id: '2', name: 'Trần B', company: 'StartupX', title: 'Developer', bant: { budget: 10, authority: 5, need: 20, timeline: 10 }, status: 'disqualified' },
    { id: '3', name: 'Lê C', company: 'Agency Pro', title: 'CEO', bant: { budget: 25, authority: 25, need: 22, timeline: 20 }, status: 'handed_off' },
    { id: '4', name: 'Phạm D', company: 'Digital VN', title: 'Marketing Director', bant: { budget: 18, authority: 15, need: 20, timeline: 15 }, status: 'pending' },
]

const MEETINGS: Meeting[] = [
    { id: '1', lead: 'Nguyễn A', company: 'TechCorp VN', type: 'discovery', time: '10:00 AM', ae: 'AE_001', status: 'confirmed' },
    { id: '2', lead: 'Lê C', company: 'Agency Pro', type: 'demo', time: '2:00 PM', ae: 'AE_002', status: 'scheduled' },
    { id: '3', lead: 'New Lead', company: 'Corp X', type: 'discovery', time: '4:00 PM', ae: 'AE_001', status: 'scheduled' },
]

const STATUS_COLORS = {
    pending: '#888',
    qualified: '#00ff41',
    disqualified: '#ff5f56',
    handed_off: '#00bfff',
    scheduled: '#ffd700',
    confirmed: '#00ff41',
    completed: '#888',
}

const getGrade = (score: number) => {
    if (score >= 80) return { grade: 'A', color: '#00ff41' }
    if (score >= 60) return { grade: 'B', color: '#00bfff' }
    if (score >= 40) return { grade: 'C', color: '#ffd700' }
    return { grade: 'D', color: '#ff5f56' }
}

export default function SDRDashboard() {
    const [leads] = useState<Lead[]>(LEADS)
    const [meetings] = useState<Meeting[]>(MEETINGS)

    const qualified = leads.filter(l => l.status === 'qualified' || l.status === 'handed_off').length
    const qualRate = (qualified / leads.length * 100).toFixed(0)

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
                        <span style={{ color: '#2ecc71' }}>🎯</span> SDR Dashboard
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Lead Qualification & Meeting Booking</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Leads', value: leads.length, color: '#fff' },
                        { label: 'Qualified', value: qualified, color: '#00ff41' },
                        { label: 'Qual Rate', value: `${qualRate}%`, color: '#00bfff' },
                        { label: "Today's Meetings", value: meetings.length, color: '#ffd700' },
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

                    {/* Lead Queue */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>QUALIFICATION QUEUE</h3>

                        {leads.map((lead, i) => {
                            const bantScore = lead.bant.budget + lead.bant.authority + lead.bant.need + lead.bant.timeline
                            const { grade, color } = getGrade(bantScore)

                            return (
                                <motion.div
                                    key={lead.id}
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
                                            <span style={{ fontWeight: 600 }}>{lead.name}</span>
                                            <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{lead.title}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                background: `${color}20`,
                                                color: color,
                                            }}>
                                                {bantScore} ({grade})
                                            </span>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.65rem',
                                                background: `${STATUS_COLORS[lead.status]}20`,
                                                color: STATUS_COLORS[lead.status],
                                            }}>
                                                {lead.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{lead.company}</p>

                                    {/* BANT Bars */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                        {['B', 'A', 'N', 'T'].map((label, idx) => {
                                            const values = [lead.bant.budget, lead.bant.authority, lead.bant.need, lead.bant.timeline]
                                            return (
                                                <div key={label} style={{ textAlign: 'center' }}>
                                                    <div style={{ height: 4, background: '#222', borderRadius: 2, overflow: 'hidden', marginBottom: '0.25rem' }}>
                                                        <div style={{ width: `${values[idx] / 25 * 100}%`, height: '100%', background: color }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.6rem', color: '#888' }}>{label}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Today's Meetings */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TODAY'S MEETINGS</h3>

                        {meetings.map((meeting, i) => (
                            <motion.div
                                key={meeting.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <div style={{
                                    width: 48, height: 48,
                                    borderRadius: '8px',
                                    background: `${STATUS_COLORS[meeting.status]}20`,
                                    border: `1px solid ${STATUS_COLORS[meeting.status]}30`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                }}>
                                    <span style={{ fontSize: '0.7rem', color: STATUS_COLORS[meeting.status] }}>{meeting.time.split(' ')[0]}</span>
                                    <span style={{ fontSize: '0.6rem', color: '#888' }}>{meeting.time.split(' ')[1]}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{meeting.lead}</p>
                                    <p style={{ color: '#888', fontSize: '0.8rem' }}>{meeting.company} • {meeting.type}</p>
                                </div>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    background: `${STATUS_COLORS[meeting.status]}20`,
                                    color: STATUS_COLORS[meeting.status],
                                }}>
                                    {meeting.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
