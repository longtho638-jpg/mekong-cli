'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface EventItem {
    id: string
    name: string
    type: 'webinar' | 'conference' | 'workshop'
    date: string
    venue: string
    capacity: number
    registrations: number
    status: 'scheduled' | 'live' | 'completed'
}

interface AttendeeItem {
    id: string
    name: string
    company: string
    title: string
    leadScore: 'hot' | 'warm' | 'cold'
    status: 'confirmed' | 'checked_in'
}

// Sample data
const EVENTS: EventItem[] = [
    { id: '1', name: 'DevOps Summit 2024', type: 'conference', date: 'Jan 15, 2025', venue: 'Grand Convention Center', capacity: 500, registrations: 342, status: 'scheduled' },
    { id: '2', name: 'SaaS Growth Webinar', type: 'webinar', date: 'Dec 20, 2024', venue: 'Virtual', capacity: 1000, registrations: 856, status: 'live' },
    { id: '3', name: 'Cloud Workshop', type: 'workshop', date: 'Dec 10, 2024', venue: 'Tech Hub', capacity: 50, registrations: 48, status: 'completed' },
]

const ATTENDEES: AttendeeItem[] = [
    { id: '1', name: 'Jane Doe', company: 'TechCorp', title: 'CTO', leadScore: 'hot', status: 'checked_in' },
    { id: '2', name: 'John Smith', company: 'Startup Inc', title: 'Developer', leadScore: 'cold', status: 'confirmed' },
    { id: '3', name: 'Bob Wilson', company: 'Enterprise Co', title: 'VP Engineering', leadScore: 'hot', status: 'checked_in' },
    { id: '4', name: 'Alice Brown', company: 'MidSize Ltd', title: 'Manager', leadScore: 'warm', status: 'confirmed' },
]

const TYPE_COLORS = {
    webinar: '#00bfff',
    conference: '#ffd700',
    workshop: '#00ff41',
}

const STATUS_COLORS = {
    scheduled: '#00bfff',
    live: '#00ff41',
    completed: '#888',
    confirmed: '#ffd700',
    checked_in: '#00ff41',
}

const LEAD_COLORS = {
    hot: '#ff5f56',
    warm: '#ffd700',
    cold: '#888',
}

export default function EventsDashboard() {
    const [events] = useState<EventItem[]>(EVENTS)
    const [attendees] = useState<AttendeeItem[]>(ATTENDEES)

    const totalRegistrations = events.reduce((sum, e) => sum + e.registrations, 0)
    const hotLeads = attendees.filter(a => a.leadScore === 'hot').length
    const checkedIn = attendees.filter(a => a.status === 'checked_in').length
    const liveEvents = events.filter(e => e.status === 'live').length

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
                        <span style={{ color: '#ffd700' }}>🎪</span> Event Marketing
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Events & Attendees</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Registrations', value: totalRegistrations.toLocaleString(), color: '#00bfff' },
                        { label: 'Hot Leads', value: hotLeads, color: '#ff5f56' },
                        { label: 'Checked In', value: checkedIn, color: '#00ff41' },
                        { label: 'Live Events', value: liveEvents, color: '#ffd700' },
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

                    {/* Events */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>EVENT CALENDAR</h3>

                        {events.map((event, i) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[event.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{event.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[event.type]}20`,
                                            color: TYPE_COLORS[event.type],
                                        }}>
                                            {event.type}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[event.status]}20`,
                                        color: STATUS_COLORS[event.status],
                                    }}>
                                        {event.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>📅 {event.date}</span>
                                    <span>📍 {event.venue}</span>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888' }}>Registrations</span>
                                        <span style={{ color: '#00ff41' }}>{event.registrations}/{event.capacity}</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(event.registrations / event.capacity) * 100}%`, height: '100%', background: '#00ff41' }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Attendees */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>RECENT ATTENDEES</h3>

                        {attendees.map((attendee, i) => (
                            <motion.div
                                key={attendee.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    borderLeft: `3px solid ${LEAD_COLORS[attendee.leadScore]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 600 }}>{attendee.name}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[attendee.status]}20`,
                                        color: STATUS_COLORS[attendee.status],
                                    }}>
                                        {attendee.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>{attendee.title} @ {attendee.company}</span>
                                    <span style={{ color: LEAD_COLORS[attendee.leadScore] }}>🎯 {attendee.leadScore}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
