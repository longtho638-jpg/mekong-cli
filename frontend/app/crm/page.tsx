'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Contact {
    id: string
    name: string
    company: string
    email: string
    stage: 'lead' | 'prospect' | 'customer' | 'churned'
    value: number
    lastContact: string
}

interface Deal {
    id: string
    name: string
    contact: string
    value: number
    stage: 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
    probability: number
    closeDate: string
}

interface Activity {
    id: string
    type: 'call' | 'email' | 'meeting' | 'note'
    contact: string
    description: string
    time: string
}

// Sample data
const CONTACTS: Contact[] = [
    { id: '1', name: 'Nguyen Van A', company: 'Mekong Corp', email: 'nva@mekong.vn', stage: 'customer', value: 125000, lastContact: 'Today' },
    { id: '2', name: 'Tran Thi B', company: 'Saigon Tech', email: 'ttb@saigon.tech', stage: 'prospect', value: 85000, lastContact: 'Yesterday' },
    { id: '3', name: 'Le Van C', company: 'Delta Farms', email: 'lvc@delta.ag', stage: 'lead', value: 45000, lastContact: '3 days ago' },
    { id: '4', name: 'Pham Thi D', company: 'Phoenix Logistics', email: 'ptd@phoenix.vn', stage: 'customer', value: 200000, lastContact: 'Last week' },
]

const DEALS: Deal[] = [
    { id: '1', name: 'Enterprise License', contact: 'Mekong Corp', value: 125000, stage: 'negotiation', probability: 75, closeDate: 'Dec 28' },
    { id: '2', name: 'Annual Contract', contact: 'Saigon Tech', value: 85000, stage: 'proposal', probability: 50, closeDate: 'Jan 15' },
    { id: '3', name: 'Pilot Project', contact: 'Delta Farms', value: 25000, stage: 'qualification', probability: 25, closeDate: 'Jan 30' },
]

const ACTIVITIES: Activity[] = [
    { id: '1', type: 'call', contact: 'Nguyen Van A', description: 'Discussed contract renewal terms', time: '2 hours ago' },
    { id: '2', type: 'email', contact: 'Tran Thi B', description: 'Sent proposal document v2', time: '4 hours ago' },
    { id: '3', type: 'meeting', contact: 'Le Van C', description: 'Initial discovery call', time: 'Yesterday' },
]

const STAGE_COLORS: Record<string, string> = {
    lead: '#888',
    prospect: '#ffd700',
    customer: '#00ff41',
    churned: '#ff0000',
    qualification: '#888',
    proposal: '#00bfff',
    negotiation: '#ffd700',
    closed_won: '#00ff41',
    closed_lost: '#ff0000',
}

const TYPE_ICONS: Record<string, string> = {
    call: '📞',
    email: '✉️',
    meeting: '🤝',
    note: '📝',
}

export default function CRMHubPage() {
    const [contacts] = useState(CONTACTS)
    const [deals] = useState(DEALS)
    const [activities] = useState(ACTIVITIES)

    const totalContacts = contacts.length
    const pipelineValue = deals.reduce((sum, d) => sum + d.value, 0)
    const customers = contacts.filter(c => c.stage === 'customer').length
    const avgProbability = (deals.reduce((sum, d) => sum + d.probability, 0) / deals.length).toFixed(0)

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
                left: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,105,180,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#ff69b4' }}>💼</span> CRM Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Contacts • Deals • Activities</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Contacts', value: totalContacts, color: '#ff69b4' },
                        { label: 'Pipeline Value', value: `$${(pipelineValue / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Customers', value: customers, color: '#00ff41' },
                        { label: 'Avg Win Rate', value: `${avgProbability}%`, color: '#ffd700' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,105,180,0.2)',
                        borderTop: '3px solid #ff69b4',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ff69b4' }}>👥 Contacts</h3>
                        {contacts.map((contact, i) => (
                            <motion.div
                                key={contact.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STAGE_COLORS[contact.stage]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '0.75rem',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{contact.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{contact.company}</p>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.55rem',
                                        background: `${STAGE_COLORS[contact.stage]}20`,
                                        color: STAGE_COLORS[contact.stage],
                                    }}>
                                        {contact.stage}
                                    </span>
                                </div>
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
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>💰 Deals</h3>
                        {deals.map((deal, i) => (
                            <motion.div
                                key={deal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{deal.name}</p>
                                    <p style={{ color: '#00ff41', fontSize: '0.85rem' }}>${(deal.value / 1000).toFixed(0)}K</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${deal.probability}%`,
                                            height: '100%',
                                            background: deal.probability >= 50 ? '#00ff41' : '#ffd700',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{deal.probability}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        borderTop: '3px solid #ffd700',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ffd700' }}>📋 Activities</h3>
                        {activities.map((activity, i) => (
                            <div
                                key={activity.id}
                                style={{
                                    padding: '0.75rem 0',
                                    borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '1rem' }}>{TYPE_ICONS[activity.type]}</span>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{activity.description}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{activity.contact} • {activity.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Relationship Excellence
                </footer>
            </div>
        </div>
    )
}
