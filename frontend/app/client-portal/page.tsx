'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const STATS = [
    { label: 'Active Projects', value: '3', icon: '📁', color: 'from-blue-500 to-cyan-500' },
    { label: 'Hours This Month', value: '42', icon: '⏱️', color: 'from-green-500 to-emerald-500' },
    { label: 'Reports Ready', value: '5', icon: '📊', color: 'from-purple-500 to-pink-500' },
    { label: 'Next Invoice', value: '$2,500', icon: '💳', color: 'from-orange-500 to-yellow-500' },
]

const RECENT_REPORTS = [
    { title: 'Monthly SEO Performance', date: 'Dec 15, 2024', type: 'SEO' },
    { title: 'Social Media Analytics', date: 'Dec 10, 2024', type: 'Social' },
    { title: 'PPC Campaign Results', date: 'Dec 5, 2024', type: 'PPC' },
    { title: 'Content Performance Q4', date: 'Dec 1, 2024', type: 'Content' },
]

const PROJECT_STATUS = [
    { name: 'Website Redesign', progress: 75, status: 'In Progress' },
    { name: 'SEO Campaign', progress: 45, status: 'In Progress' },
    { name: 'Social Media Strategy', progress: 100, status: 'Completed' },
]

export default function ClientPortal() {
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
                        <Link href="/client-portal" className="text-white">Dashboard</Link>
                        <Link href="/client-portal/reports" className="text-gray-400 hover:text-white">Reports</Link>
                        <Link href="/client-portal/projects" className="text-gray-400 hover:text-white">Projects</Link>
                        <Link href="/client-portal/files" className="text-gray-400 hover:text-white">Files</Link>
                        <Link href="/client-portal/invoices" className="text-gray-400 hover:text-white">Invoices</Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">john@abc.com</span>
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            J
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white">Welcome back, John! 👋</h2>
                    <p className="text-gray-400 mt-1">Here&apos;s an overview of your marketing performance.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {STATS.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-2xl">{stat.icon}</span>
                            </div>
                            <p className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}>
                                {stat.value}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-8">
                    {/* Recent Reports */}
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white">📊 Recent Reports</h3>
                            <Link href="/client-portal/reports" className="text-sm text-blue-400 hover:text-blue-300">
                                View all →
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {RECENT_REPORTS.map((report, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors cursor-pointer"
                                >
                                    <div>
                                        <p className="text-white text-sm font-medium">{report.title}</p>
                                        <p className="text-gray-500 text-xs">{report.date}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                        {report.type}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Project Status */}
                    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white">📁 Project Status</h3>
                            <Link href="/client-portal/projects" className="text-sm text-blue-400 hover:text-blue-300">
                                View all →
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {PROJECT_STATUS.map((project, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-3 rounded-lg bg-gray-700/30"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-white text-sm font-medium">{project.name}</p>
                                        <span className={`text-xs ${project.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${project.progress === 100
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                }`}
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                    <Link
                        href="/client-portal/reports"
                        className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all flex items-center gap-4"
                    >
                        <span className="text-3xl">📊</span>
                        <div>
                            <p className="text-white font-medium">View Reports</p>
                            <p className="text-gray-500 text-sm">Latest analytics & insights</p>
                        </div>
                    </Link>
                    <Link
                        href="/client-portal/files"
                        className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all flex items-center gap-4"
                    >
                        <span className="text-3xl">📁</span>
                        <div>
                            <p className="text-white font-medium">Download Files</p>
                            <p className="text-gray-500 text-sm">Assets & deliverables</p>
                        </div>
                    </Link>
                    <Link
                        href="/client-portal/invoices"
                        className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all flex items-center gap-4"
                    >
                        <span className="text-3xl">💳</span>
                        <div>
                            <p className="text-white font-medium">Pay Invoice</p>
                            <p className="text-gray-500 text-sm">View & pay invoices</p>
                        </div>
                    </Link>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>Powered by Agency OS • Your trusted marketing partner</p>
                </div>
            </main>
        </div>
    )
}
