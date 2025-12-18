'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CampaignItem {
    id: string
    name: string
    status: 'draft' | 'active' | 'completed'
    budget: number
    spent: number
    leads: number
    conversions: number
}

interface EventItem {
    id: string
    name: string
    type: 'webinar' | 'conference' | 'workshop'
    date: string
    capacity: number
    registered: number
    status: 'planning' | 'registration_open' | 'completed'
}

// Sample data
const CAMPAIGNS: CampaignItem[] = [
    { id: '1', name: 'Q1 Product Launch', status: 'active', budget: 50000, spent: 25000, leads: 350, conversions: 45 },
    { id: '2', name: 'Brand Awareness', status: 'active', budget: 30000, spent: 15000, leads: 200, conversions: 20 },
    { id: '3', name: 'Holiday Promo', status: 'completed', budget: 20000, spent: 20000, leads: 500, conversions: 75 },
]

const EVENTS: EventItem[] = [
    { id: '1', name: 'Product Launch Webinar', type: 'webinar', date: 'Dec 30, 2024', capacity: 500, registered: 320, status: 'registration_open' },
    { id: '2', name: 'Developer Workshop', type: 'workshop', date: 'Jan 15, 2025', capacity: 50, registered: 45, status: 'registration_open' },
    { id: '3', name: 'Annual Conference', type: 'conference', date: 'Mar 10, 2025', capacity: 1000, registered: 0, status: 'planning' },
]

const STATUS_COLORS = {
    draft: '#888',
    active: '#00ff41',
    completed: '#00bfff',
    planning: '#888',
    registration_open: '#ffd700',
}

const TYPE_COLORS = {
    webinar: '#00bfff',
    conference: '#9b59b6',
    workshop: '#ffd700',
}

export default function CampaignsDashboard() {
    const [campaigns] = useState<CampaignItem[]>(CAMPAIGNS)
    const [events] = useState<EventItem[]>(EVENTS)

    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0)
    const upcomingEvents = events.filter(e => e.status !== 'completed').length

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
                        <span style={{ color: '#ff5f56' }}>📣</span> Marketing Coordinator
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Campaigns & Events</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Budget', value: `$${(totalBudget / 1000).toFixed(0)}K`, color: '#fff' },
                        { label: 'Spent', value: `$${(totalSpent / 1000).toFixed(0)}K`, color: '#ff5f56' },
                        { label: 'Leads', value: totalLeads, color: '#00ff41' },
                        { label: 'Upcoming Events', value: upcomingEvents, color: '#ffd700' },
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

                    {/* Campaigns */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CAMPAIGNS</h3>

                        {campaigns.map((campaign, i) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[campaign.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{campaign.name}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[campaign.status]}20`,
                                        color: STATUS_COLORS[campaign.status],
                                    }}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888' }}>Budget</span>
                                        <span style={{ color: '#00bfff' }}>${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(campaign.spent / campaign.budget) * 100}%`,
                                            background: campaign.spent > campaign.budget * 0.9 ? '#ff5f56' : '#00ff41',
                                            borderRadius: 2,
                                        }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>📈 {campaign.leads} leads</span>
                                    <span style={{ color: '#00ff41' }}>✅ {campaign.conversions} conv</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Events */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>EVENTS CALENDAR</h3>

                        {events.map((event, i) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
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
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#888' }}>📅 {event.date}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[event.status]}20`,
                                        color: STATUS_COLORS[event.status],
                                    }}>
                                        {event.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>Registration</span>
                                    <span style={{ color: event.registered / event.capacity > 0.8 ? '#ff5f56' : '#00ff41' }}>
                                        {event.registered}/{event.capacity} ({Math.round(event.registered / event.capacity * 100)}%)
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
