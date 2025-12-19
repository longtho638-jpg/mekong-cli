'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface BudgetItem { id: string; category: string; allocated: number; spent: number; remaining: number }
interface Transaction { id: string; description: string; type: 'income' | 'expense'; amount: number; date: string; status: 'completed' | 'pending' }
interface Invoice { id: string; client: string; amount: number; status: 'paid' | 'pending' | 'overdue'; dueDate: string }

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

export default function FinOpsHubPage() {
    const [budgets] = useState(BUDGETS)
    const [transactions] = useState(TRANSACTIONS)
    const [invoices] = useState(INVOICES)

    const totalBudget = budgets.reduce((sum, b) => sum + b.allocated, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
    const burnRate = (totalSpent / totalBudget * 100).toFixed(0)
    const totalAR = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0)

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono p-8">
            <div className="fixed -top-[20%] left-1/2 -translate-x-1/2 w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(0,255,65,0.06)_0%,transparent_60%)] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-8">
                    <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl mb-2">
                        <span className="text-green-400">💵</span> FinOps Hub
                    </motion.h1>
                    <p className="text-gray-500">Budget • Transactions • Invoices</p>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Budget', value: `$${(totalBudget / 1000).toFixed(0)}K`, color: 'text-cyan-400' },
                        { label: 'Total Spent', value: `$${(totalSpent / 1000).toFixed(0)}K`, color: 'text-yellow-400' },
                        { label: 'Burn Rate', value: `${burnRate}%`, color: parseInt(burnRate) > 80 ? 'text-red-400' : 'text-green-400' },
                        { label: 'A/R Outstanding', value: `$${(totalAR / 1000).toFixed(1)}K`, color: 'text-red-400' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white/[0.02] border border-white/5 rounded-xl p-5 text-center">
                            <p className="text-gray-500 text-xs mb-2 uppercase">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Budgets */}
                    <div className="bg-white/[0.02] border border-green-400/20 border-t-[3px] border-t-green-400 rounded-xl p-6">
                        <h3 className="text-green-400 mb-6">📊 Department Budgets</h3>
                        {budgets.map((budget, i) => {
                            const pct = (budget.spent / budget.allocated) * 100
                            return (
                                <motion.div key={budget.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="mb-4">
                                    <div className="flex justify-between mb-1 text-sm">
                                        <span>{budget.category}</span>
                                        <span><span className="text-yellow-400">${(budget.spent / 1000).toFixed(0)}K</span><span className="text-gray-500"> / ${(budget.allocated / 1000).toFixed(0)}K</span></span>
                                    </div>
                                    <div className="h-1.5 bg-gray-700 rounded overflow-hidden">
                                        <div className={`h-full ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Transactions */}
                        <div className="bg-white/[0.02] border border-cyan-400/20 border-t-[3px] border-t-cyan-400 rounded-xl p-5">
                            <h3 className="text-cyan-400 text-sm mb-4">💳 Recent Transactions</h3>
                            {transactions.map((tx, i) => (
                                <div key={tx.id} className={`flex justify-between items-center py-2 ${i < transactions.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div>
                                        <p className="text-sm">{tx.description}</p>
                                        <p className="text-gray-500 text-xs">{tx.date}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Invoices */}
                        <div className="bg-white/[0.02] border border-yellow-400/20 border-t-[3px] border-t-yellow-400 rounded-xl p-5">
                            <h3 className="text-yellow-400 text-sm mb-4">📄 Invoices</h3>
                            {invoices.map((inv, i) => (
                                <div key={inv.id} className={`flex justify-between items-center py-2 ${i < invoices.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div>
                                        <p className="text-sm">{inv.client}</p>
                                        <p className="text-gray-500 text-xs">{inv.id} • Due: {inv.dueDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm">${inv.amount.toLocaleString()}</p>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${inv.status === 'paid' ? 'bg-green-400/10 text-green-400' : inv.status === 'overdue' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>{inv.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="mt-8 text-center text-gray-500 text-sm">🏯 agencyos.network - Financial Excellence</footer>
            </div>
        </div>
    )
}
