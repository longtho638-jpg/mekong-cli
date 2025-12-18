'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface GrievanceItem {
    id: string
    title: string
    type: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'submitted' | 'under_review' | 'investigating' | 'resolved'
    daysOpen: number
}

interface InvestigationItem {
    id: string
    title: string
    incidentType: string
    status: 'initiated' | 'evidence_gathering' | 'interviews' | 'completed'
    evidenceCount: number
    interviewCount: number
}

// Sample data
const GRIEVANCES: GrievanceItem[] = [
    { id: '1', title: 'Workplace harassment complaint', type: 'harassment', priority: 'high', status: 'investigating', daysOpen: 5 },
    { id: '2', title: 'Pay discrepancy issue', type: 'compensation', priority: 'medium', status: 'under_review', daysOpen: 3 },
    { id: '3', title: 'Policy violation report', type: 'policy_violation', priority: 'low', status: 'resolved', daysOpen: 0 },
    { id: '4', title: 'Discrimination concern', type: 'discrimination', priority: 'critical', status: 'investigating', daysOpen: 2 },
]

const INVESTIGATIONS: InvestigationItem[] = [
    { id: '1', title: 'Harassment Investigation', incidentType: 'misconduct', status: 'interviews', evidenceCount: 5, interviewCount: 3 },
    { id: '2', title: 'Theft Investigation', incidentType: 'theft', status: 'evidence_gathering', evidenceCount: 8, interviewCount: 1 },
    { id: '3', title: 'Safety Violation Review', incidentType: 'safety_violation', status: 'completed', evidenceCount: 3, interviewCount: 2 },
]

const PRIORITY_COLORS = {
    low: '#888',
    medium: '#ffd700',
    high: '#ff9500',
    critical: '#ff5f56',
}

const STATUS_COLORS = {
    submitted: '#888',
    under_review: '#ffd700',
    investigating: '#00bfff',
    resolved: '#00ff41',
    initiated: '#888',
    evidence_gathering: '#ffd700',
    interviews: '#00bfff',
    completed: '#00ff41',
}

export default function ERDashboard() {
    const [grievances] = useState<GrievanceItem[]>(GRIEVANCES)
    const [investigations] = useState<InvestigationItem[]>(INVESTIGATIONS)

    const openCases = grievances.filter(g => g.status !== 'resolved').length
    const resolvedCases = grievances.filter(g => g.status === 'resolved').length
    const activeInv = investigations.filter(i => i.status !== 'completed').length
    const criticalCases = grievances.filter(g => g.priority === 'critical').length

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
                        <span style={{ color: '#e74c3c' }}>🤝</span> Employee Relations
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Grievances & Investigations</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Open Cases', value: openCases, color: '#ffd700' },
                        { label: 'Resolved', value: resolvedCases, color: '#00ff41' },
                        { label: 'Active Investigations', value: activeInv, color: '#00bfff' },
                        { label: 'Critical Cases', value: criticalCases, color: '#ff5f56' },
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

                    {/* Grievances */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>GRIEVANCE CASES</h3>

                        {grievances.map((grv, i) => (
                            <motion.div
                                key={grv.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${PRIORITY_COLORS[grv.priority]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{grv.title}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${PRIORITY_COLORS[grv.priority]}20`,
                                        color: PRIORITY_COLORS[grv.priority],
                                    }}>
                                        {grv.priority}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span style={{ color: '#888' }}>{grv.type}</span>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[grv.status]}20`,
                                            color: STATUS_COLORS[grv.status],
                                        }}>
                                            {grv.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {grv.daysOpen > 0 && (
                                        <span style={{ color: grv.daysOpen > 7 ? '#ff5f56' : '#888' }}>{grv.daysOpen}d open</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Investigations */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>INVESTIGATIONS</h3>

                        {investigations.map((inv, i) => (
                            <motion.div
                                key={inv.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[inv.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>🔍 {inv.title}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${STATUS_COLORS[inv.status]}20`,
                                        color: STATUS_COLORS[inv.status],
                                    }}>
                                        {inv.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>{inv.incidentType}</span>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <span>📁 {inv.evidenceCount} evidence</span>
                                        <span>👤 {inv.interviewCount} interviews</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
