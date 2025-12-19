'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MotionDiv } from '@/components/MotionWrapper'

// Types
interface Prospect {
    id: string
    name: string
    company: string
    email: string
    status: 'new' | 'contacted' | 'qualified'
    cadenceStep: number
    source: string
}

interface Activity {
    id: string
    type: 'call' | 'email' | 'meeting'
    prospect: string
    outcome: string
    time: string
}

// Sample data
const PROSPECTS: Prospect[] = [
    { id: '1', name: 'Nguyễn A', company: 'TechCorp VN', email: 'a@techcorp.vn', status: 'contacted', cadenceStep: 2, source: 'linkedin' },
    { id: '2', name: 'Trần B', company: 'StartupX', email: 'b@startupx.com', status: 'new', cadenceStep: 0, source: 'website' },
    { id: '3', name: 'Lê C', company: 'Agency Pro', email: 'c@agency.vn', status: 'qualified', cadenceStep: 5, source: 'referral' },
    { id: '4', name: 'Phạm D', company: 'Digital VN', email: 'd@digital.vn', status: 'contacted', cadenceStep: 3, source: 'cold' },
]

const ACTIVITIES: Activity[] = [
    { id: '1', type: 'call', prospect: 'Nguyễn A', outcome: 'connected', time: '10:30 AM' },
    { id: '2', type: 'email', prospect: 'Trần B', outcome: 'sent', time: '10:15 AM' },
    { id: '3', type: 'call', prospect: 'Phạm D', outcome: 'no_answer', time: '10:00 AM' },
    { id: '4', type: 'meeting', prospect: 'Lê C', outcome: 'completed', time: '9:30 AM' },
]

const STATUS_COLORS = {
    new: '#888',
    contacted: '#ffd700',
    qualified: '#00ff41',
}

const TYPE_ICONS = {
    call: '📞',
    email: '📧',
    meeting: '📅',
}

const GOALS = {
    calls: { current: 23, goal: 50 },
    emails: { current: 18, goal: 30 },
    meetings: { current: 2, goal: 3 },
    talkTime: { current: 45, goal: 120 },
}

export default function ISRDashboard() {
    const [prospects] = useState<Prospect[]>(PROSPECTS)
    const [activities] = useState<Activity[]>(ACTIVITIES)

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
                        <span style={{ color: '#1abc9c' }}>📞</span> Inside Sales Dashboard
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Prospecting & Activity Tracking</p>
                </header>

                {/* Daily Goals */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>TODAY'S GOALS</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                        {[
                            { label: 'Calls', ...GOALS.calls, icon: '📞' },
                            { label: 'Emails', ...GOALS.emails, icon: '📧' },
                            { label: 'Meetings', ...GOALS.meetings, icon: '📅' },
                            { label: 'Talk Time', ...GOALS.talkTime, icon: '⏱️', suffix: 'm' },
                        ].map((goal, i) => (
                            <motion.div
                                key={goal.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>{goal.icon} {goal.label}</span>
                                    <span style={{ color: '#1abc9c' }}>{goal.current}/{goal.goal}{'suffix' in goal ? goal.suffix : ''}</span>
                                </div>
                                <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                                    <MotionDiv
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(goal.current / goal.goal) * 100}%` }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        style={{
                                            height: '100%',
                                            background: goal.current >= goal.goal ? '#00ff41' : '#1abc9c',
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Prospects */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#888' }}>PROSPECTS</h3>
                        </div>

                        {prospects.map((prospect, i) => (
                            <motion.div
                                key={prospect.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{prospect.name}</p>
                                    <p style={{ color: '#888', fontSize: '0.8rem' }}>{prospect.company} • {prospect.email}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ color: '#888', fontSize: '0.75rem' }}>Step {prospect.cadenceStep}/5</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        background: `${STATUS_COLORS[prospect.status]}20`,
                                        color: STATUS_COLORS[prospect.status],
                                    }}>
                                        {prospect.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Activity Feed */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#888' }}>ACTIVITY FEED</h3>
                        </div>

                        {activities.map((activity, i) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    gap: '0.75rem',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span style={{ fontSize: '1.25rem' }}>{TYPE_ICONS[activity.type]}</span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        <strong>{activity.type}</strong> with {activity.prospect}
                                    </p>
                                    <p style={{ color: '#888', fontSize: '0.75rem' }}>
                                        {activity.outcome} • {activity.time}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
