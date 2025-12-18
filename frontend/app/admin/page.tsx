'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Task {
    id: string
    title: string
    priority: 'high' | 'medium' | 'low'
    assignee: string
    status: 'pending' | 'in_progress' | 'completed'
    due: string
}

interface Meeting {
    id: string
    title: string
    time: string
    attendees: number
    type: 'standup' | 'review' | 'planning'
}

interface Resource {
    id: string
    name: string
    type: 'cost' | 'tool' | 'service'
    amount: number
    trend: 'up' | 'down' | 'stable'
}

// Sample data
const TASKS: Task[] = [
    { id: '1', title: 'Q1 Budget Review', priority: 'high', assignee: 'Anh', status: 'in_progress', due: 'Today' },
    { id: '2', title: 'Vendor Contract Renewal', priority: 'medium', assignee: 'Admin', status: 'pending', due: 'This Week' },
    { id: '3', title: 'Team Performance Reports', priority: 'low', assignee: 'HR', status: 'completed', due: 'Done' },
    { id: '4', title: 'Office Equipment Audit', priority: 'medium', assignee: 'IT', status: 'pending', due: 'Next Week' },
]

const MEETINGS: Meeting[] = [
    { id: '1', title: 'Daily Standup', time: '9:00 AM', attendees: 8, type: 'standup' },
    { id: '2', title: 'Sprint Review', time: '2:00 PM', attendees: 12, type: 'review' },
    { id: '3', title: 'Q2 Planning', time: 'Tomorrow', attendees: 5, type: 'planning' },
]

const RESOURCES: Resource[] = [
    { id: '1', name: 'Cloud Infrastructure', type: 'cost', amount: 2500, trend: 'up' },
    { id: '2', name: 'SaaS Subscriptions', type: 'tool', amount: 1800, trend: 'stable' },
    { id: '3', name: 'Office Utilities', type: 'service', amount: 800, trend: 'down' },
]

const PRIORITY_COLORS: Record<string, string> = {
    high: '#ff6347',
    medium: '#ffd700',
    low: '#00ff41',
}

export default function AdminHubPage() {
    const [tasks] = useState(TASKS)
    const [meetings] = useState(MEETINGS)
    const [resources] = useState(RESOURCES)

    // Metrics
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const todayMeetings = meetings.filter(m => m.time.includes('AM') || m.time.includes('PM')).length
    const monthlyCost = resources.reduce((sum, r) => sum + r.amount, 0)

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
                background: 'radial-gradient(circle, rgba(139,195,74,0.06) 0%, transparent 60%)',
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
                        <span style={{ color: '#8bc34a' }}>📋</span> Admin Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Tasks • Meetings • Resources</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Pending Tasks', value: pendingTasks, color: '#ffd700' },
                        { label: 'Completed', value: completedTasks, color: '#00ff41' },
                        { label: 'Today Meetings', value: todayMeetings, color: '#00bfff' },
                        { label: 'Monthly Cost', value: `$${monthlyCost.toLocaleString()}`, color: '#ff6347' },
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

                    {/* Tasks */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(139,195,74,0.2)',
                        borderTop: '3px solid #8bc34a',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#8bc34a' }}>✅ Task Board</h3>

                        {tasks.map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>@{task.assignee} • {task.due}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${PRIORITY_COLORS[task.priority]}20`,
                                            color: PRIORITY_COLORS[task.priority],
                                        }}>
                                            {task.priority}
                                        </span>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: task.status === 'completed' ? 'rgba(0,255,65,0.1)' : 'rgba(0,191,255,0.1)',
                                            color: task.status === 'completed' ? '#00ff41' : '#00bfff',
                                        }}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Meetings + Resources */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Meetings */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,191,255,0.2)',
                            borderTop: '3px solid #00bfff',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00bfff' }}>📅 Today&apos;s Meetings</h3>

                            {meetings.map((meeting, i) => (
                                <div
                                    key={meeting.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < meetings.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{meeting.title}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{meeting.time} • {meeting.attendees} attendees</p>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        background: 'rgba(0,191,255,0.1)',
                                        color: '#00bfff',
                                    }}>
                                        {meeting.type}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Resources */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>💰 Resources</h3>

                            {resources.map((resource, i) => (
                                <div
                                    key={resource.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < resources.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{resource.name}</p>
                                        <span style={{
                                            padding: '1px 4px',
                                            borderRadius: '4px',
                                            fontSize: '0.55rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: '#888',
                                        }}>
                                            {resource.type}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.85rem' }}>${resource.amount}</p>
                                        <span style={{
                                            color: resource.trend === 'down' ? '#00ff41' : resource.trend === 'up' ? '#ff6347' : '#888',
                                            fontSize: '0.7rem',
                                        }}>
                                            {resource.trend === 'up' ? '↑' : resource.trend === 'down' ? '↓' : '→'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Operations Excellence
                </footer>
            </div>
        </div>
    )
}
