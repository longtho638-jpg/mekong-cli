'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface TalentItem {
    id: string
    name: string
    title: string
    skills: string[]
    source: string
    matchScore: number
    status: 'discovered' | 'qualified' | 'in_pool' | 'contacted'
}

interface CampaignItem {
    id: string
    candidateName: string
    jobTitle: string
    step: 'initial' | 'follow_up_1' | 'follow_up_2'
    status: 'sent' | 'opened' | 'replied'
}

// Sample data
const TALENTS: TalentItem[] = [
    { id: '1', name: 'Nguyen A', title: 'Senior Engineer', skills: ['Python', 'React', 'AWS'], source: 'LinkedIn', matchScore: 95, status: 'in_pool' },
    { id: '2', name: 'Tran B', title: 'Backend Dev', skills: ['Python', 'Django'], source: 'GitHub', matchScore: 85, status: 'qualified' },
    { id: '3', name: 'Le C', title: 'Full Stack', skills: ['Node.js', 'React'], source: 'Referral', matchScore: 78, status: 'discovered' },
    { id: '4', name: 'Pham D', title: 'DevOps', skills: ['K8s', 'Docker', 'AWS'], source: 'LinkedIn', matchScore: 88, status: 'contacted' },
]

const CAMPAIGNS: CampaignItem[] = [
    { id: '1', candidateName: 'Nguyen A', jobTitle: 'Senior Engineer', step: 'initial', status: 'replied' },
    { id: '2', candidateName: 'Tran B', jobTitle: 'Product Manager', step: 'follow_up_1', status: 'opened' },
    { id: '3', candidateName: 'Le C', jobTitle: 'Backend Dev', step: 'initial', status: 'sent' },
]

const STATUS_COLORS = {
    discovered: '#888',
    qualified: '#ffd700',
    in_pool: '#00bfff',
    contacted: '#00ff41',
    sent: '#888',
    opened: '#ffd700',
    replied: '#00ff41',
}

const SOURCE_COLORS: Record<string, string> = {
    LinkedIn: '#0077b5',
    GitHub: '#333',
    Referral: '#9b59b6',
    'Job Board': '#e67e22',
}

export default function RecruiterDashboard() {
    const [talents] = useState<TalentItem[]>(TALENTS)
    const [campaigns] = useState<CampaignItem[]>(CAMPAIGNS)

    const inPool = talents.filter(t => t.status === 'in_pool').length
    const avgMatch = Math.round(talents.reduce((sum, t) => sum + t.matchScore, 0) / talents.length)
    const openRate = Math.round((campaigns.filter(c => c.status !== 'sent').length / campaigns.length) * 100)
    const replyRate = Math.round((campaigns.filter(c => c.status === 'replied').length / campaigns.length) * 100)

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
                        <span style={{ color: '#00bfff' }}>🔍</span> Recruiter Operations
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Sourcing & Outreach</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Talent Pool', value: inPool, color: '#00bfff' },
                        { label: 'Avg Match', value: `${avgMatch}%`, color: '#00ff41' },
                        { label: 'Open Rate', value: `${openRate}%`, color: '#ffd700' },
                        { label: 'Reply Rate', value: `${replyRate}%`, color: '#9b59b6' },
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

                    {/* Talent Pool */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TALENT PIPELINE</h3>

                        {talents.map((talent, i) => (
                            <motion.div
                                key={talent.id}
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
                                        <span style={{ fontWeight: 600 }}>{talent.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[talent.status]}20`,
                                            color: STATUS_COLORS[talent.status],
                                        }}>
                                            {talent.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span style={{ color: '#00ff41', fontWeight: 'bold' }}>{talent.matchScore}%</span>
                                </div>
                                <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{talent.title}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {talent.skills.map((skill, j) => (
                                        <span key={j} style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: 'rgba(0,191,255,0.1)',
                                            color: '#00bfff',
                                        }}>
                                            {skill}
                                        </span>
                                    ))}
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${SOURCE_COLORS[talent.source] || '#888'}20`,
                                        color: SOURCE_COLORS[talent.source] || '#888',
                                    }}>
                                        {talent.source}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Outreach */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>OUTREACH CAMPAIGNS</h3>

                        {campaigns.map((campaign, i) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
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
                                    <div>
                                        <span style={{ fontWeight: 600 }}>📧 {campaign.candidateName}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${STATUS_COLORS[campaign.status]}20`,
                                        color: STATUS_COLORS[campaign.status],
                                    }}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888' }}>
                                    <span>{campaign.jobTitle}</span>
                                    <span style={{ color: '#ffd700' }}>{campaign.step.replace('_', ' ')}</span>
                                </div>
                            </motion.div>
                        ))}

                        {/* Funnel visualization */}
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.75rem' }}>OUTREACH FUNNEL</p>
                            {[
                                { label: 'Sent', value: 100, color: '#888' },
                                { label: 'Opened', value: openRate, color: '#ffd700' },
                                { label: 'Replied', value: replyRate, color: '#00ff41' },
                            ].map((step, i) => (
                                <div key={i} style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888' }}>{step.label}</span>
                                        <span style={{ color: step.color }}>{step.value}%</span>
                                    </div>
                                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${step.value}%`,
                                            background: step.color,
                                            borderRadius: 3,
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
