'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Invoice {
    id: string
    number: string
    client: string
    amount: number
    status: 'paid' | 'pending' | 'overdue'
    date: string
    dueDate: string
}

const MOCK_INVOICES: Invoice[] = [
    { id: '1', number: 'INV-0001', client: 'ABC Corporation', amount: 2500, status: 'paid', date: '2024-12-01', dueDate: '2024-12-15' },
    { id: '2', number: 'INV-0002', client: 'XYZ Ventures', amount: 1800, status: 'pending', date: '2024-12-10', dueDate: '2024-12-25' },
    { id: '3', number: 'INV-0003', client: 'Tech Solutions', amount: 3200, status: 'overdue', date: '2024-11-15', dueDate: '2024-11-30' },
    { id: '4', number: 'INV-0004', client: 'Startup Inc', amount: 950, status: 'pending', date: '2024-12-18', dueDate: '2025-01-02' },
]

const STATUS_STYLES = {
    paid: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    overdue: 'bg-red-500/20 text-red-400',
}

export default function BillingPage() {
    const [invoices] = useState<Invoice[]>(MOCK_INVOICES)

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0)
    const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <Link href="/agency-portal" className="hover:text-white transition-colors">Agency Portal</Link>
                        <span>/</span>
                        <span className="text-white">Billing</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">💳 Billing & Invoices</h1>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity">
                    🧾 New Invoice
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6"
                >
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-400">${totalRevenue.toLocaleString()}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6"
                >
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-3xl font-bold text-yellow-400">${pendingAmount.toLocaleString()}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6"
                >
                    <p className="text-gray-400 text-sm">Overdue</p>
                    <p className="text-3xl font-bold text-red-400">${overdueAmount.toLocaleString()}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6"
                >
                    <p className="text-gray-400 text-sm">Total Invoices</p>
                    <p className="text-3xl font-bold text-purple-400">{invoices.length}</p>
                </motion.div>
            </div>

            {/* Invoices Table */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Recent Invoices</h3>
                    <input
                        type="text"
                        placeholder="Search invoices..."
                        className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700/50 bg-gray-800/30">
                            <th className="text-left p-4 text-gray-400 font-medium text-sm">Invoice</th>
                            <th className="text-left p-4 text-gray-400 font-medium text-sm">Client</th>
                            <th className="text-left p-4 text-gray-400 font-medium text-sm">Amount</th>
                            <th className="text-left p-4 text-gray-400 font-medium text-sm">Status</th>
                            <th className="text-left p-4 text-gray-400 font-medium text-sm">Date</th>
                            <th className="text-left p-4 text-gray-400 font-medium text-sm">Due Date</th>
                            <th className="text-right p-4 text-gray-400 font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((invoice, idx) => (
                            <motion.tr
                                key={invoice.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                            >
                                <td className="p-4 text-white font-mono">{invoice.number}</td>
                                <td className="p-4 text-gray-300">{invoice.client}</td>
                                <td className="p-4 text-white font-medium">${invoice.amount.toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${STATUS_STYLES[invoice.status]}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 text-sm">{invoice.date}</td>
                                <td className="p-4 text-gray-400 text-sm">{invoice.dueDate}</td>
                                <td className="p-4 text-right">
                                    <button className="text-purple-400 hover:text-purple-300 transition-colors text-sm">
                                        View
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
