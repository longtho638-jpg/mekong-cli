'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Types
interface Event {
    id: string
    title: string
    type: 'meeting' | 'deadline' | 'reminder' | 'call'
    time: string
    duration: string
    attendees: number
    status: 'upcoming' | 'in_progress' | 'completed'
}

interface Calendar {
    id: string
    name: string
    color: string
    events: number
}

// Sample data
const EVENTS: Event[] = [
    { id: '1', title: 'Team Standup', type: 'meeting', time: '09:00', duration: '30m', attendees: 8, status: 'completed' },
    { id: '2', title: 'Product Review', type: 'meeting', time: '11:00', duration: '1h', attendees: 5, status: 'in_progress' },
    { id: '3', title: 'Client Call - Saigon Tech', type: 'call', time: '14:00', duration: '45m', attendees: 3, status: 'upcoming' },
    { id: '4', title: 'Q4 Report Deadline', type: 'deadline', time: '17:00', duration: '-', attendees: 0, status: 'upcoming' },
    { id: '5', title: 'Investor Update', type: 'reminder', time: '18:00', duration: '-', attendees: 0, status: 'upcoming' },
]

const CALENDARS: Calendar[] = [
    { id: '1', name: 'Work', color: '#00bfff', events: 24 },
    { id: '2', name: 'Meetings', color: '#ffd700', events: 12 },
    { id: '3', name: 'Deadlines', color: '#ff0000', events: 5 },
    { id: '4', name: 'Personal', color: '#00ff41', events: 8 },
]

const TYPE_COLORS: Record<string, string> = {
    meeting: '#00bfff',
    deadline: '#ff0000',
    reminder: '#ffd700',
    call: '#00ff41',
}

const STATUS_COLORS: Record<string, string> = {
    upcoming: '#00bfff',
    in_progress: '#ffd700',
    completed: '#00ff41',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarHubPage() {
    const [events] = useState(EVENTS)
    const [calendars] = useState(CALENDARS)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const todayEvents = events.length
    const upcomingEvents = events.filter(e => e.status === 'upcoming').length
    const totalCalendarEvents = calendars.reduce((sum, c) => sum + c.events, 0)

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{
                position: 'fixed',
                top: '-20%',
                right: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#ffd700' }}>📅</span> Calendar Hub
                        </h1>
                        <p style={{ color: '#888', fontSize: '0.85rem' }}>Events • Schedules • Deadlines</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ textAlign: 'right' }}
                    >
                        <p style={{ fontSize: '1.5rem', color: '#ffd700', fontWeight: 'bold' }}>
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                        <p style={{ color: '#888', fontSize: '0.85rem' }}>
                            {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </motion.div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: "Today's Events", value: todayEvents, color: '#ffd700' },
                        { label: 'Upcoming', value: upcomingEvents, color: '#00bfff' },
                        { label: 'Total Events', value: totalCalendarEvents, color: '#00ff41' },
                        { label: 'Calendars', value: calendars.length, color: '#8a2be2' },
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

                {/* Mini Week View */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                }}>
                    {DAYS.map((day, i) => {
                        const isToday = i === currentTime.getDay() - 1
                        return (
                            <motion.div
                                key={day}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    background: isToday ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.02)',
                                    border: isToday ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    textAlign: 'center',
                                }}
                            >
                                <p style={{ color: isToday ? '#ffd700' : '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{day}</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isToday ? '#ffd700' : '#fff' }}>
                                    {16 + i}
                                </p>
                                <p style={{ color: '#666', fontSize: '0.65rem' }}>{i < 3 ? `${2 + i} events` : '-'}</p>
                            </motion.div>
                        )
                    })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        borderTop: '3px solid #ffd700',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ffd700' }}>📋 Today&apos;s Schedule</h3>
                        {events.map((event, i) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${TYPE_COLORS[event.type]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                }}
                            >
                                <div style={{ textAlign: 'center', minWidth: 50 }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: TYPE_COLORS[event.type] }}>{event.time}</p>
                                    <p style={{ color: '#888', fontSize: '0.65rem' }}>{event.duration}</p>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{event.title}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '1px 4px',
                                            borderRadius: '4px',
                                            fontSize: '0.55rem',
                                            background: `${TYPE_COLORS[event.type]}20`,
                                            color: TYPE_COLORS[event.type],
                                        }}>
                                            {event.type}
                                        </span>
                                        {event.attendees > 0 && (
                                            <span style={{ color: '#888', fontSize: '0.65rem' }}>👥 {event.attendees}</span>
                                        )}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.6rem',
                                    background: `${STATUS_COLORS[event.status]}20`,
                                    color: STATUS_COLORS[event.status],
                                }}>
                                    {event.status.replace('_', ' ')}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>🗂️ Calendars</h3>
                        {calendars.map((cal, i) => (
                            <div
                                key={cal.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 0',
                                    borderBottom: i < calendars.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '3px', background: cal.color }} />
                                    <span style={{ fontSize: '0.9rem' }}>{cal.name}</span>
                                </div>
                                <span style={{ color: '#888', fontSize: '0.8rem' }}>{cal.events} events</span>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Time Excellence
                </footer>
            </div>
        </div>
    )
}
