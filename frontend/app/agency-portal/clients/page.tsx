'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Client {
    id: string
    name: string
    email: string
    status: 'active' | 'pending' | 'churned'
    mrr: number
    projects: number
    lastActivity: string
}

const MOCK_CLIENTS: Client[] = [
    { id: '1', name: 'ABC Corporation', email: 'contact@abc.com', status: 'active', mrr: 2500, projects: 3, lastActivity: '2 hours ago' },
    { id: '2', name: 'XYZ Ventures', email: 'hello@xyz.co', status: 'active', mrr: 1800, projects: 2, lastActivity: '1 day ago' },
    { id: '3', name: 'Startup Inc', email: 'team@startup.io', status: 'pending', mrr: 0, projects: 1, lastActivity: '3 days ago' },
    { id: '4', name: 'Tech Solutions', email: 'info@techsol.com', status: 'active', mrr: 3200, projects: 4, lastActivity: '5 hours ago' },
    { id: '5', name: 'Digital Agency Pro', email: 'contact@dap.agency', status: 'churned', mrr: 0, projects: 0, lastActivity: '30 days ago' },
]

const STATUS_STYLES = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    churned: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function ClientsPage() {
    const [clients] = useState<Client[]>(MOCK_CLIENTS)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'churned'>('all')

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase()) ||
            client.email.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'all' || client.status === filter
        return matchesSearch && matchesFilter
    })

    const totalMRR = clients.filter(c => c.status === 'active').reduce((sum, c) => sum + c.mrr, 0)
    const activeCount = clients.filter(c => c.status === 'active').length

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <Link href="/agency-portal" className="hover:text-white transition-colors">Agency Portal</Link>
                        <span>/</span>
                        <span className="text-white">Clients</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">👥 Clients</h1>
                </div>
                <Link
                    href="/agency-portal/clients/new"
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                >
                    ➕ Add Client
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                    <p className="text-gray-400 text-sm">Total MRR</p>
                    <p className="text-3xl font-bold text-green-400">${totalMRR.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                    <p className="text-gray-400 text-sm">Active Clients</p>
                    <p className="text-3xl font-bold text-blue-400">{activeCount}</p>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                    <p className="text-gray-400 text-sm">Total Clients</p>
                    <p className="text-3xl font-bold text-purple-400">{clients.length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search clients..."
                    className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2">
                    {(['all', 'active', 'pending', 'churned'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg border transition-colors capitalize ${filter === f
                                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700/50">
                            <th className="text-left p-4 text-gray-400 font-medium">Client</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                            <th className="text-left p-4 text-gray-400 font-medium">MRR</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Projects</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Last Activity</th>
                            <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map((client, idx) => (
                            <motion.tr
                                key={client.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                            >
                                <td className="p-4">
                                    <p className="text-white font-medium">{client.name}</p>
                                    <p className="text-gray-500 text-sm">{client.email}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs border capitalize ${STATUS_STYLES[client.status]}`}>
                                        {client.status}
                                    </span>
                                </td>
                                <td className="p-4 text-white">${client.mrr.toLocaleString()}</td>
                                <td className="p-4 text-gray-300">{client.projects}</td>
                                <td className="p-4 text-gray-400 text-sm">{client.lastActivity}</td>
                                <td className="p-4 text-right">
                                    <button className="text-gray-400 hover:text-white transition-colors">
                                        •••
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
