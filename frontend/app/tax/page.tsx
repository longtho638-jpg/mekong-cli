'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface TaxFiling {
    id: string
    name: string
    type: string
    period: string
    daysUntilDue: number
    amount: number
    status: 'pending' | 'submitted' | 'accepted'
}

interface TaxStrategy {
    id: string
    name: string
    type: 'deduction' | 'credit' | 'incentive'
    potentialSavings: number
    actualSavings: number
    implemented: boolean
}

// Sample data
const FILINGS: TaxFiling[] = [
    { id: '1', name: 'Corporate Tax Q4', type: 'corporate_income', period: 'Q4 2024', daysUntilDue: 15, amount: 25000, status: 'pending' },
    { id: '2', name: 'VAT Monthly', type: 'vat', period: 'Dec 2024', daysUntilDue: 5, amount: 8500, status: 'submitted' },
    { id: '3', name: 'Payroll Tax', type: 'payroll', period: 'Dec 2024', daysUntilDue: 10, amount: 12000, status: 'pending' },
    { id: '4', name: 'Annual Report', type: 'annual_report', period: '2024', daysUntilDue: 45, amount: 0, status: 'pending' },
]

const STRATEGIES: TaxStrategy[] = [
    { id: '1', name: 'R&D Tax Credit', type: 'credit', potentialSavings: 15000, actualSavings: 14500, implemented: true },
    { id: '2', name: 'Equipment Depreciation', type: 'deduction', potentialSavings: 8000, actualSavings: 7800, implemented: true },
    { id: '3', name: 'Startup Incentive', type: 'incentive', potentialSavings: 12000, actualSavings: 0, implemented: false },
]

const STATUS_COLORS = {
    pending: '#ffd700',
    submitted: '#00bfff',
    accepted: '#00ff41',
}

const TYPE_COLORS = {
    deduction: '#00bfff',
    credit: '#00ff41',
    incentive: '#9b59b6',
}

export default function TaxDashboard() {
    const [filings] = useState<TaxFiling[]>(FILINGS)
    const [strategies] = useState<TaxStrategy[]>(STRATEGIES)

    const totalDue = filings.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)
    const urgentFilings = filings.filter(f => f.daysUntilDue <= 7 && f.status === 'pending').length
    const totalSavings = strategies.reduce((sum, s) => sum + s.actualSavings, 0)
    const potentialSavings = strategies.filter(s => !s.implemented).reduce((sum, s) => sum + s.potentialSavings, 0)

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
                        <span style={{ color: '#27ae60' }}>🧾</span> Tax Operations
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Filings & Tax Planning</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Due', value: `$${(totalDue / 1000).toFixed(1)}K`, color: '#ffd700' },
                        { label: 'Urgent (7d)', value: urgentFilings, color: '#ff5f56' },
                        { label: 'Tax Savings', value: `$${(totalSavings / 1000).toFixed(1)}K`, color: '#00ff41' },
                        { label: 'Potential Savings', value: `$${(potentialSavings / 1000).toFixed(0)}K`, color: '#00bfff' },
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

                    {/* Filings */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>UPCOMING FILINGS</h3>

                        {filings.map((filing, i) => (
                            <motion.div
                                key={filing.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${filing.daysUntilDue <= 7 ? '#ff5f56' : 'rgba(255,255,255,0.05)'}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{filing.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{filing.period}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${STATUS_COLORS[filing.status]}20`,
                                        color: STATUS_COLORS[filing.status],
                                    }}>
                                        {filing.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: filing.daysUntilDue <= 7 ? '#ff5f56' : '#888' }}>
                                        Due in {filing.daysUntilDue} days
                                    </span>
                                    {filing.amount > 0 && (
                                        <span style={{ color: '#ffd700' }}>${filing.amount.toLocaleString()}</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Tax Strategies */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TAX STRATEGIES</h3>

                        {strategies.map((strategy, i) => (
                            <motion.div
                                key={strategy.id}
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
                                        <span style={{ fontWeight: 600 }}>{strategy.name}</span>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[strategy.type]}20`,
                                            color: TYPE_COLORS[strategy.type],
                                        }}>
                                            {strategy.type}
                                        </span>
                                    </div>
                                    <div style={{
                                        width: 10, height: 10,
                                        borderRadius: '50%',
                                        background: strategy.implemented ? '#00ff41' : '#888',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#888' }}>Potential: ${strategy.potentialSavings.toLocaleString()}</span>
                                    {strategy.implemented && (
                                        <span style={{ color: '#00ff41' }}>Saved: ${strategy.actualSavings.toLocaleString()}</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
