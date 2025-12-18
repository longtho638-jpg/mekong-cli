'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Lead {
    id: string
    name: string
    email: string
    source: string
    score: number
    status: 'new' | 'qualified' | 'nurturing'
}

interface Deal {
    id: string
    title: string
    value: number
    stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
    client: string
}

// Sample data
const LEADS: Lead[] = [
    { id: '1', name: 'Nguyễn Văn A', email: 'a@techvn.com', source: 'affiliate', score: 85, status: 'qualified' },
    { id: '2', name: 'Trần B', email: 'b@gmail.com', source: 'facebook', score: 35, status: 'nurturing' },
    { id: '3', name: 'Lê C', email: 'c@startup.vn', source: 'inbound', score: 72, status: 'qualified' },
]

const DEALS: Deal[] = [
    { id: '1', title: 'TechVN Agency Setup', value: 2000, stage: 'proposal', client: 'TechVN' },
    { id: '2', title: 'Marketing Hub', value: 5000, stage: 'negotiation', client: 'StartupABC' },
    { id: '3', title: 'E-commerce Bot', value: 1500, stage: 'discovery', client: 'ShopLocal' },
]

const STAGES = ['discovery', 'proposal', 'negotiation', 'closed_won']
const STAGE_COLORS: Record<string, string> = {
    discovery: '#888',
    proposal: '#ffd700',
    negotiation: '#00bfff',
    closed_won: '#00ff41',
    closed_lost: '#ff5f56',
}

export default function SalesDashboard() {
    const [leads] = useState<Lead[]>(LEADS)
    const [deals] = useState<Deal[]>(DEALS)

    // Calculate metrics
    const pipelineValue = deals.filter(d => !d.stage.includes('closed')).reduce((sum, d) => sum + d.value, 0)
    const qualifiedLeads = leads.filter(l => l.status === 'qualified').length
    const avgScore = leads.reduce((sum, l) => sum + l.score, 0) / leads.length

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
                left: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,215,0,0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#ffd700' }}>💰</span> Sales Pipeline
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Lead → Deal → Invoice</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}`, color: '#ffd700' },
                        { label: 'Qualified Leads', value: qualifiedLeads, color: '#00ff41' },
                        { label: 'Avg Lead Score', value: `${avgScore.toFixed(0)}%`, color: '#00bfff' },
                        { label: 'Win Rate', value: '67%', color: '#00ff41' },
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

                {/* Funnel */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#888' }}>DEAL PIPELINE</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {STAGES.map((stage, i) => {
                            const stageDeals = deals.filter(d => d.stage === stage)
                            const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0)

                            return (
                                <motion.div
                                    key={stage}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${STAGE_COLORS[stage]}30`,
                                        borderTop: `3px solid ${STAGE_COLORS[stage]}`,
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        minHeight: 200,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{stage.replace('_', ' ')}</span>
                                        <span style={{ color: STAGE_COLORS[stage], fontSize: '0.8rem' }}>${stageValue}</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {stageDeals.map(deal => (
                                            <motion.div
                                                key={deal.id}
                                                whileHover={{ scale: 1.02, x: 4 }}
                                                style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    borderRadius: '6px',
                                                    padding: '0.75rem',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <p style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>{deal.title}</p>
                                                <p style={{ color: '#888', fontSize: '0.7rem' }}>{deal.client} • ${deal.value}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Leads Table */}
                <div>
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#888' }}>RECENT LEADS</h3>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255,255,255,0.03)',
                            fontSize: '0.75rem',
                            color: '#888',
                            textTransform: 'uppercase',
                        }}>
                            <span>Name</span>
                            <span>Email</span>
                            <span>Source</span>
                            <span>Score</span>
                            <span>Status</span>
                        </div>

                        {/* Rows */}
                        {leads.map((lead, i) => (
                            <motion.div
                                key={lead.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                                    padding: '0.75rem 1rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                }}
                            >
                                <span>{lead.name}</span>
                                <span style={{ color: '#888' }}>{lead.email}</span>
                                <span style={{ color: '#888' }}>{lead.source}</span>
                                <span>
                                    <span style={{
                                        display: 'inline-block',
                                        width: 40,
                                        height: 6,
                                        background: '#333',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        marginRight: 8,
                                    }}>
                                        <span style={{
                                            display: 'block',
                                            width: `${lead.score}%`,
                                            height: '100%',
                                            background: lead.score >= 70 ? '#00ff41' : lead.score >= 50 ? '#ffd700' : '#ff5f56',
                                        }} />
                                    </span>
                                    {lead.score}
                                </span>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    background: lead.status === 'qualified' ? 'rgba(0,255,65,0.1)' : 'rgba(255,215,0,0.1)',
                                    color: lead.status === 'qualified' ? '#00ff41' : '#ffd700',
                                }}>
                                    {lead.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
