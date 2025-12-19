'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const REPORTS = [
    {
        id: 1,
        title: 'Monthly SEO Performance Report',
        date: 'December 15, 2024',
        type: 'SEO',
        summary: 'Organic traffic increased 23% MoM. Top 10 rankings improved for 15 keywords.',
        metrics: [
            { label: 'Organic Traffic', value: '+23%', trend: 'up' },
            { label: 'Keywords Ranked', value: '156', trend: 'up' },
            { label: 'Backlinks', value: '+42', trend: 'up' },
        ]
    },
    {
        id: 2,
        title: 'Social Media Analytics - Q4',
        date: 'December 10, 2024',
        type: 'Social',
        summary: 'Engagement rate up 15%. Instagram followers grew by 2,500.',
        metrics: [
            { label: 'Engagement', value: '+15%', trend: 'up' },
            { label: 'Followers', value: '+2.5K', trend: 'up' },
            { label: 'Reach', value: '125K', trend: 'up' },
        ]
    },
    {
        id: 3,
        title: 'PPC Campaign Results',
        date: 'December 5, 2024',
        type: 'PPC',
        summary: 'ROAS improved to 4.2x. Cost per acquisition reduced by 18%.',
        metrics: [
            { label: 'ROAS', value: '4.2x', trend: 'up' },
            { label: 'CPA', value: '-18%', trend: 'up' },
            { label: 'Conversions', value: '342', trend: 'up' },
        ]
    },
    {
        id: 4,
        title: 'Content Performance Analysis',
        date: 'December 1, 2024',
        type: 'Content',
        summary: 'Blog traffic increased 35%. Average time on page improved by 45 seconds.',
        metrics: [
            { label: 'Blog Traffic', value: '+35%', trend: 'up' },
            { label: 'Avg Time', value: '+45s', trend: 'up' },
            { label: 'Shares', value: '89', trend: 'up' },
        ]
    },
]

const TYPE_COLORS: Record<string, string> = {
    'SEO': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Social': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'PPC': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Content': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export default function ReportsPage() {
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
                        <Link href="/client-portal/reports" className="text-white">Reports</Link>
                        <Link href="/client-portal/projects" className="text-gray-400 hover:text-white">Projects</Link>
                        <Link href="/client-portal/files" className="text-gray-400 hover:text-white">Files</Link>
                        <Link href="/client-portal/invoices" className="text-gray-400 hover:text-white">Invoices</Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white">📊 Reports</h2>
                        <p className="text-gray-400 mt-1">Performance reports and analytics</p>
                    </div>
                    <div className="flex gap-2">
                        {['All', 'SEO', 'Social', 'PPC', 'Content'].map(filter => (
                            <button
                                key={filter}
                                className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === 'All'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reports Grid */}
                <div className="space-y-4">
                    {REPORTS.map((report, idx) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 hover:border-blue-500/30 transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold text-white">{report.title}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs border ${TYPE_COLORS[report.type]}`}>
                                            {report.type}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm">{report.date}</p>
                                </div>
                                <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors">
                                    📥 Download PDF
                                </button>
                            </div>

                            <p className="text-gray-300 mb-4">{report.summary}</p>

                            <div className="grid grid-cols-3 gap-4">
                                {report.metrics.map((metric, i) => (
                                    <div key={i} className="bg-gray-700/30 rounded-lg p-3">
                                        <p className="text-gray-500 text-xs mb-1">{metric.label}</p>
                                        <p className={`text-xl font-bold ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {metric.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}
