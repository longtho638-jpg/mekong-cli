'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const INVOICES = [
    {
        id: 'INV-2024-012',
        date: 'Dec 15, 2024',
        dueDate: 'Dec 30, 2024',
        amount: 2500,
        status: 'pending',
        description: 'Monthly Retainer - December 2024'
    },
    {
        id: 'INV-2024-011',
        date: 'Nov 15, 2024',
        dueDate: 'Nov 30, 2024',
        amount: 2500,
        status: 'paid',
        description: 'Monthly Retainer - November 2024'
    },
    {
        id: 'INV-2024-010',
        date: 'Oct 15, 2024',
        dueDate: 'Oct 30, 2024',
        amount: 2500,
        status: 'paid',
        description: 'Monthly Retainer - October 2024'
    },
    {
        id: 'INV-2024-009',
        date: 'Sep 15, 2024',
        dueDate: 'Sep 30, 2024',
        amount: 3500,
        status: 'paid',
        description: 'Website Redesign Project'
    },
]

const STATUS_STYLES: Record<string, string> = {
    'paid': 'bg-green-500/20 text-green-400',
    'pending': 'bg-yellow-500/20 text-yellow-400',
    'overdue': 'bg-red-500/20 text-red-400',
}

export default function InvoicesPage() {
    const totalPaid = INVOICES.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
    const totalPending = INVOICES.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/10 to-gray-900">
            {/* Header */}
            <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                            🏢 Client Portal
                        </h1>
                        <p className="text-xs text-gray-500">ABC Corporation</p>
                    </div>
                    <nav className="flex items-center gap-6">
                        <Link href="/client-portal" className="text-gray-400 hover:text-white">Dashboard</Link>
                        <Link href="/client-portal/reports" className="text-gray-400 hover:text-white">Reports</Link>
                        <Link href="/client-portal/projects" className="text-gray-400 hover:text-white">Projects</Link>
                        <Link href="/client-portal/files" className="text-gray-400 hover:text-white">Files</Link>
                        <Link href="/client-portal/invoices" className="text-white">Invoices</Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white">💳 Invoices</h2>
                        <p className="text-gray-400 mt-1">View and pay your invoices</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                        <p className="text-gray-400 text-sm">Total Paid</p>
                        <p className="text-3xl font-bold text-green-400">${totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                        <p className="text-gray-400 text-sm">Pending Payment</p>
                        <p className="text-3xl font-bold text-yellow-400">${totalPending.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                        <p className="text-gray-400 text-sm">Total Invoices</p>
                        <p className="text-3xl font-bold text-blue-400">{INVOICES.length}</p>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700/50 bg-gray-800/30">
                                <th className="text-left p-4 text-gray-400 font-medium">Invoice</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Description</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Due Date</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Amount</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                                <th className="text-right p-4 text-gray-400 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {INVOICES.map((invoice, idx) => (
                                <motion.tr
                                    key={invoice.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                                >
                                    <td className="p-4 text-white font-mono text-sm">{invoice.id}</td>
                                    <td className="p-4 text-gray-300 text-sm">{invoice.description}</td>
                                    <td className="p-4 text-gray-400 text-sm">{invoice.date}</td>
                                    <td className="p-4 text-gray-400 text-sm">{invoice.dueDate}</td>
                                    <td className="p-4 text-white font-medium">${invoice.amount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs capitalize ${STATUS_STYLES[invoice.status]}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {invoice.status === 'pending' ? (
                                            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity">
                                                Pay Now
                                            </button>
                                        ) : (
                                            <button className="px-4 py-2 bg-gray-700/50 rounded-lg text-gray-400 text-sm hover:text-white transition-colors">
                                                Download
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}
