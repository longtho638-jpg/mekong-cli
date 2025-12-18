'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface BudgetItem {
    id: string
    category: string
    allocated: number
    spent: number
    remaining: number
}

interface Transaction {
    id: string
    description: string
    type: 'income' | 'expense'
    amount: number
    date: string
    status: 'completed' | 'pending'
}

interface Invoice {
    id: string
    client: string
    amount: number
    status: 'paid' | 'pending' | 'overdue'
    dueDate: string
}

// Sample data
const BUDGETS: BudgetItem[] = [
    { id: '1', category: 'Engineering', allocated: 50000, spent: 35000, remaining: 15000 },
    { id: '2', category: 'Marketing', allocated: 25000, spent: 18000, remaining: 7000 },
    { id: '3', category: 'Operations', allocated: 15000, spent: 12000, remaining: 3000 },
    { id: '4', category: 'Sales', allocated: 20000, spent: 8000, remaining: 12000 },
]

const TRANSACTIONS: Transaction[] = [
    { id: '1', description: 'Client Payment - AgencyOS', type: 'income', amount: 15000, date: 'Today', status: 'completed' },
    { id: '2', description: 'AWS Infrastructure', type: 'expense', amount: 2500, date: 'Yesterday', status: 'completed' },
    { id: '3', description: 'Contractor Payment', type: 'expense', amount: 5000, date: 'Dec 15', status: 'pending' },
]

const INVOICES: Invoice[] = [
    { id: 'INV-001', client: 'Mekong Corp', amount: 25000, status: 'paid', dueDate: 'Dec 10' },
    { id: 'INV-002', client: 'Saigon Tech', amount: 18000, status: 'pending', dueDate: 'Dec 20' },
    { id: 'INV-003', client: 'Delta Farms', amount: 8500, status: 'overdue', dueDate: 'Dec 5' },
]

const STATUS_COLORS: Record<string, string> = {
    paid: '#00ff41',
    pending: '#ffd700',
    overdue: '#ff0000',
    completed: '#00ff41',
}

export default function FinOpsHubPage() {
    const [budgets] = useState(BUDGETS)
    const [transactions] = useState(TRANSACTIONS)
    const [invoices] = useState(INVOICES)

    // Metrics
    const totalBudget = budgets.reduce((sum, b) => sum + b.allocated, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
    const burnRate = (totalSpent / totalBudget * 100).toFixed(0)
    const totalAR = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0)

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
                left: '50%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(0,255,65,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
                transform: 'translateX(-50%)',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#00ff41' }}>💵</span> FinOps Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Budget • Transactions • Invoices</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Budget', value: `$${(totalBudget / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Total Spent', value: `$${(totalSpent / 1000).toFixed(0)}K`, color: '#ffd700' },
                        { label: 'Burn Rate', value: `${burnRate}%`, color: parseInt(burnRate) > 80 ? '#ff6347' : '#00ff41' },
                        { label: 'A/R Outstanding', value: `$${(totalAR / 1000).toFixed(1)}K`, color: '#ff6347' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Budgets */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,255,65,0.2)',
                        borderTop: '3px solid #00ff41',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00ff41' }}>📊 Department Budgets</h3>

                        {budgets.map((budget, i) => (
                            <motion.div
                                key={budget.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '1rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{budget.category}</span>
                                    <span style={{ fontSize: '0.85rem' }}>
                                        <span style={{ color: '#ffd700' }}>${(budget.spent / 1000).toFixed(0)}K</span>
                                        <span style={{ color: '#888' }}> / ${(budget.allocated / 1000).toFixed(0)}K</span>
                                    </span>
                                </div>
                                <div style={{
                                    height: 6,
                                    background: '#333',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${(budget.spent / budget.allocated) * 100}%`,
                                        height: '100%',
                                        background: (budget.spent / budget.allocated) > 0.9 ? '#ff6347' : (budget.spent / budget.allocated) > 0.7 ? '#ffd700' : '#00ff41',
                                    }} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Transactions + Invoices */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Transactions */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,191,255,0.2)',
                            borderTop: '3px solid #00bfff',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00bfff' }}>💳 Recent Transactions</h3>

                            {transactions.map((tx, i) => (
                                <div
                                    key={tx.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{tx.description}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{tx.date}</p>
                                    </div>
                                    <span style={{
                                        color: tx.type === 'income' ? '#00ff41' : '#ff6347',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                    }}>
                                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Invoices */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>📄 Invoices</h3>

                            {invoices.map((inv, i) => (
                                <div
                                    key={inv.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < invoices.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{inv.client}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{inv.id} • Due: {inv.dueDate}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.85rem' }}>${inv.amount.toLocaleString()}</p>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[inv.status]}20`,
                                            color: STATUS_COLORS[inv.status],
                                        }}>
                                            {inv.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Financial Excellence
                </footer>
            </div>
        </div>
    )
}
