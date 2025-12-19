'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const PROJECTS = [
    {
        id: 1,
        name: 'Website Redesign',
        status: 'In Progress',
        progress: 75,
        startDate: 'Oct 1, 2024',
        endDate: 'Dec 31, 2024',
        budget: 15000,
        spent: 11250,
        tasks: { completed: 18, total: 24 },
        team: ['Sarah', 'Mike', 'Lisa']
    },
    {
        id: 2,
        name: 'SEO Campaign',
        status: 'In Progress',
        progress: 45,
        startDate: 'Nov 1, 2024',
        endDate: 'Apr 30, 2025',
        budget: 6000,
        spent: 2700,
        tasks: { completed: 9, total: 20 },
        team: ['John', 'Emma']
    },
    {
        id: 3,
        name: 'Social Media Strategy',
        status: 'Completed',
        progress: 100,
        startDate: 'Sep 1, 2024',
        endDate: 'Nov 30, 2024',
        budget: 4500,
        spent: 4200,
        tasks: { completed: 15, total: 15 },
        team: ['Alex', 'Sophie']
    },
]

const STATUS_COLORS: Record<string, string> = {
    'In Progress': 'text-yellow-400',
    'Completed': 'text-green-400',
    'On Hold': 'text-orange-400',
}

export default function ProjectsPage() {
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
                        <Link href="/client-portal/projects" className="text-white">Projects</Link>
                        <Link href="/client-portal/files" className="text-gray-400 hover:text-white">Files</Link>
                        <Link href="/client-portal/invoices" className="text-gray-400 hover:text-white">Invoices</Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white">📁 Projects</h2>
                    <p className="text-gray-400 mt-1">Track your project progress</p>
                </div>

                {/* Projects Grid */}
                <div className="space-y-6">
                    {PROJECTS.map((project, idx) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                                    <p className={`text-sm ${STATUS_COLORS[project.status]}`}>{project.status}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white">{project.progress}%</p>
                                    <p className="text-gray-500 text-sm">Complete</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
                                <div
                                    className={`h-3 rounded-full transition-all ${project.progress === 100
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                        }`}
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <p className="text-gray-500 text-xs mb-1">Timeline</p>
                                    <p className="text-white text-sm">{project.startDate} - {project.endDate}</p>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <p className="text-gray-500 text-xs mb-1">Budget</p>
                                    <p className="text-white text-sm">
                                        ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <p className="text-gray-500 text-xs mb-1">Tasks</p>
                                    <p className="text-white text-sm">
                                        {project.tasks.completed} / {project.tasks.total} completed
                                    </p>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-4">
                                    <p className="text-gray-500 text-xs mb-1">Team</p>
                                    <p className="text-white text-sm">{project.team.join(', ')}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}
