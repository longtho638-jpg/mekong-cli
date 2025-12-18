'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface ContractItem {
    id: string
    name: string
    counterparty: string
    type: string
    value: number
    status: 'draft' | 'review' | 'pending_signature' | 'signed'
    daysToExpiry: number
}

interface ComplianceItem {
    id: string
    name: string
    regulation: string
    status: 'compliant' | 'partial' | 'non_compliant'
    risk: 'low' | 'medium' | 'high' | 'critical'
}

// Sample data
const CONTRACTS: ContractItem[] = [
    { id: '1', name: 'Enterprise MSA', counterparty: 'BigCorp', type: 'msa', value: 150000, status: 'signed', daysToExpiry: 180 },
    { id: '2', name: 'NDA - TechCo', counterparty: 'TechCo', type: 'nda', value: 0, status: 'review', daysToExpiry: 0 },
    { id: '3', name: 'SOW Phase 1', counterparty: 'StartupX', type: 'sow', value: 50000, status: 'pending_signature', daysToExpiry: 0 },
    { id: '4', name: 'License Agreement', counterparty: 'MediaCo', type: 'license', value: 25000, status: 'signed', daysToExpiry: 45 },
]

const COMPLIANCE: ComplianceItem[] = [
    { id: '1', name: 'Data Processing Agreement', regulation: 'GDPR', status: 'compliant', risk: 'high' },
    { id: '2', name: 'Access Controls', regulation: 'SOC2', status: 'partial', risk: 'medium' },
    { id: '3', name: 'Encryption at Rest', regulation: 'SOC2', status: 'compliant', risk: 'high' },
    { id: '4', name: 'Data Retention Policy', regulation: 'GDPR', status: 'non_compliant', risk: 'critical' },
]

const STATUS_COLORS = {
    draft: '#888',
    review: '#ffd700',
    pending_signature: '#ff9500',
    signed: '#00ff41',
    compliant: '#00ff41',
    partial: '#ffd700',
    non_compliant: '#ff5f56',
}

const RISK_COLORS = {
    low: '#888',
    medium: '#ffd700',
    high: '#ff9500',
    critical: '#ff5f56',
}

export default function LegalDashboard() {
    const [contracts] = useState<ContractItem[]>(CONTRACTS)
    const [compliance] = useState<ComplianceItem[]>(COMPLIANCE)

    const activeValue = contracts.filter(c => c.status === 'signed').reduce((sum, c) => sum + c.value, 0)
    const pendingReview = contracts.filter(c => c.status === 'review').length
    const compliantItems = compliance.filter(c => c.status === 'compliant').length
    const complianceRate = (compliantItems / compliance.length * 100).toFixed(0)

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
                        <span style={{ color: '#8e44ad' }}>⚖️</span> Legal Operations
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Contracts & Compliance</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Active Contracts', value: `$${(activeValue / 1000).toFixed(0)}K`, color: '#00ff41' },
                        { label: 'Pending Review', value: pendingReview, color: '#ffd700' },
                        { label: 'Compliance Rate', value: `${complianceRate}%`, color: '#00bfff' },
                        { label: 'High Risk Items', value: compliance.filter(c => c.risk === 'high' || c.risk === 'critical').length, color: '#ff5f56' },
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

                    {/* Contracts */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CONTRACT PIPELINE</h3>

                        {contracts.map((contract, i) => (
                            <motion.div
                                key={contract.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[contract.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{contract.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{contract.counterparty}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${STATUS_COLORS[contract.status]}20`,
                                        color: STATUS_COLORS[contract.status],
                                    }}>
                                        {contract.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#888' }}>{contract.type.toUpperCase()}</span>
                                    {contract.value > 0 && (
                                        <span style={{ color: '#00ff41' }}>${contract.value.toLocaleString()}</span>
                                    )}
                                    {contract.status === 'signed' && contract.daysToExpiry > 0 && (
                                        <span style={{ color: contract.daysToExpiry <= 60 ? '#ff5f56' : '#888' }}>
                                            Expires in {contract.daysToExpiry}d
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Compliance */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>COMPLIANCE STATUS</h3>

                        {compliance.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: 8, height: 8,
                                            borderRadius: '50%',
                                            background: STATUS_COLORS[item.status],
                                        }} />
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${RISK_COLORS[item.risk]}20`,
                                        color: RISK_COLORS[item.risk],
                                    }}>
                                        {item.risk} risk
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>{item.regulation}</span>
                                    <span style={{ color: STATUS_COLORS[item.status] }}>{item.status.replace('_', ' ')}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
