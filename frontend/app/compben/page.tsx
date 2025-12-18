'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CompItem {
    id: string
    name: string
    level: string
    jobFamily: string
    baseSalary: number
    bonusTarget: number
    compaRatio: number
}

interface PayrollEntry {
    id: string
    employeeName: string
    gross: number
    deductions: number
    net: number
    status: 'draft' | 'processing' | 'paid'
}

// Sample data
const COMPENSATIONS: CompItem[] = [
    { id: '1', name: 'Nguyen A', level: 'Senior', jobFamily: 'Engineering', baseSalary: 2700, bonusTarget: 15, compaRatio: 1.08 },
    { id: '2', name: 'Tran B', level: 'Mid', jobFamily: 'Engineering', baseSalary: 1600, bonusTarget: 10, compaRatio: 0.89 },
    { id: '3', name: 'Le C', level: 'Senior', jobFamily: 'Engineering', baseSalary: 2200, bonusTarget: 15, compaRatio: 0.88 },
    { id: '4', name: 'Pham D', level: 'Lead', jobFamily: 'Product', baseSalary: 3200, bonusTarget: 20, compaRatio: 1.02 },
]

const PAYROLL: PayrollEntry[] = [
    { id: '1', employeeName: 'Nguyen A', gross: 2700, deductions: 918, net: 1782, status: 'paid' },
    { id: '2', employeeName: 'Tran B', gross: 1600, deductions: 544, net: 1056, status: 'paid' },
    { id: '3', employeeName: 'Le C', gross: 2200, deductions: 748, net: 1452, status: 'paid' },
    { id: '4', employeeName: 'Pham D', gross: 3200, deductions: 1088, net: 2112, status: 'processing' },
]

const getCompaColor = (ratio: number) => {
    if (ratio < 0.9) return '#ff5f56'
    if (ratio > 1.1) return '#ffd700'
    return '#00ff41'
}

const STATUS_COLORS = {
    draft: '#888',
    processing: '#ffd700',
    paid: '#00ff41',
}

export default function CompBenDashboard() {
    const [comps] = useState<CompItem[]>(COMPENSATIONS)
    const [payroll] = useState<PayrollEntry[]>(PAYROLL)

    const totalPayroll = comps.reduce((sum, c) => sum + c.baseSalary, 0)
    const avgCompa = (comps.reduce((sum, c) => sum + c.compaRatio, 0) / comps.length).toFixed(2)
    const totalNet = payroll.reduce((sum, p) => sum + p.net, 0)
    const totalDeductions = payroll.reduce((sum, p) => sum + p.deductions, 0)

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
                        <span style={{ color: '#27ae60' }}>💰</span> Compensation & Benefits
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Salary & Payroll</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Payroll', value: `$${(totalPayroll / 1000).toFixed(1)}K`, color: '#fff' },
                        { label: 'Avg Compa-Ratio', value: avgCompa, color: '#00ff41' },
                        { label: 'Net Payout', value: `$${(totalNet / 1000).toFixed(1)}K`, color: '#00bfff' },
                        { label: 'Deductions', value: `$${(totalDeductions / 1000).toFixed(1)}K`, color: '#ff5f56' },
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

                    {/* Compensation */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>COMPENSATION ANALYSIS</h3>

                        {comps.map((comp, i) => (
                            <motion.div
                                key={comp.id}
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
                                        <span style={{ fontWeight: 600 }}>{comp.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: 'rgba(0,191,255,0.1)',
                                            color: '#00bfff',
                                        }}>
                                            {comp.level}
                                        </span>
                                    </div>
                                    <span style={{ color: getCompaColor(comp.compaRatio), fontWeight: 'bold' }}>
                                        {comp.compaRatio.toFixed(2)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>{comp.jobFamily}</span>
                                    <div>
                                        <span style={{ color: '#00ff41' }}>${comp.baseSalary.toLocaleString()}</span>
                                        <span style={{ marginLeft: '0.5rem', color: '#ffd700' }}>+{comp.bonusTarget}%</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Payroll */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>PAYROLL - DEC 2024</h3>

                        {payroll.map((entry, i) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[entry.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{entry.employeeName}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[entry.status]}20`,
                                        color: STATUS_COLORS[entry.status],
                                    }}>
                                        {entry.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>Gross: ${entry.gross.toLocaleString()}</span>
                                    <span style={{ color: '#ff5f56' }}>-${entry.deductions.toLocaleString()}</span>
                                    <span style={{ color: '#00ff41', fontWeight: 'bold' }}>Net: ${entry.net.toLocaleString()}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
