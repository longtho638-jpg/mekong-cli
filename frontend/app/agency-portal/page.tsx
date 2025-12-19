'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const STATS = [
    { label: 'Active Clients', value: '12', change: '+2', icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'MRR', value: '$8,450', change: '+15%', icon: '💰', color: 'from-green-500 to-emerald-500' },
    { label: 'Projects', value: '24', change: '+5', icon: '📁', color: 'from-purple-500 to-pink-500' },
    { label: 'Tasks Due', value: '7', change: '-3', icon: '✅', color: 'from-orange-500 to-yellow-500' },
]

const QUICK_ACTIONS = [
    { label: 'New Client', icon: '➕', href: '/agency-portal/clients/new', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30' },
    { label: 'Create Invoice', icon: '🧾', href: '/agency-portal/billing', color: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30' },
    { label: 'New Proposal', icon: '📝', href: '/agency-portal/proposals/new', color: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30' },
    { label: 'Schedule Call', icon: '📞', href: '/calendar', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30' },
]

const NAV_SECTIONS = [
    {
        title: 'Agency',
        items: [
            { label: 'Dashboard', icon: '🏠', href: '/agency-portal', active: true },
            { label: 'Clients', icon: '👥', href: '/agency-portal/clients' },
            { label: 'Projects', icon: '📁', href: '/projects' },
            { label: 'Billing', icon: '💳', href: '/agency-portal/billing' },
        ]
    },
    {
        title: 'Marketing',
        items: [
            { label: 'Campaigns', icon: '📢', href: '/campaigns' },
            { label: 'Content', icon: '✍️', href: '/content' },
            { label: 'SEO', icon: '🔍', href: '/seo' },
            { label: 'Social', icon: '📱', href: '/social' },
        ]
    },
    {
        title: 'Strategy',
        items: [
            { label: 'Binh Pháp', icon: '⚔️', href: '/binhphap' },
            { label: 'Shield', icon: '🛡️', href: '/shield' },
            { label: 'War Room', icon: '🎯', href: '/warroom' },
            { label: 'Analytics', icon: '📊', href: '/analytics' },
        ]
    },
]

const RECENT_ACTIVITY = [
    { action: 'Invoice #1234 paid', client: 'ABC Corp', time: '2 hours ago', icon: '💰' },
    { action: 'New project started', client: 'XYZ Ltd', time: '5 hours ago', icon: '🚀' },
    { action: 'Report sent', client: 'Startup Inc', time: '1 day ago', icon: '📧' },
    { action: 'Client onboarded', client: 'Tech Co', time: '2 days ago', icon: '👋' },
]

export default function AgencyPortal() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-screen bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 p-4">
                    <div className="mb-8">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            🏯 Agency OS
                        </h1>
                        <p className="text-xs text-gray-500">v2.0 • WIN-WIN-WIN</p>
                    </div>

                    {NAV_SECTIONS.map((section, idx) => (
                        <div key={idx} className="mb-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{section.title}</p>
                            <nav className="space-y-1">
                                {section.items.map((item, i) => (
                                    <Link
                                        key={i}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${item.active
                                                ? 'bg-purple-500/20 text-purple-300'
                                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                            }`}
                                    >
                                        <span>{item.icon}</span>
                                        <span className="text-sm">{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    ))}

                    {/* Settings */}
                    <div className="mt-auto pt-4 border-t border-gray-700/50">
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all"
                        >
                            <span>⚙️</span>
                            <span className="text-sm">Settings</span>
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Good morning! 👋</h2>
                            <p className="text-gray-400">Here&apos;s what&apos;s happening with your agency today.</p>
                        </div>
                        <Link
                            href="/agency-portal/onboarding"
                            className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors text-sm"
                        >
                            ✨ Onboarding
                        </Link>
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
                                    <span className={`text-xs px-2 py-1 rounded-full ${stat.change.startsWith('+')
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <p className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}>
                                    {stat.value}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {QUICK_ACTIONS.map((action, idx) => (
                                <Link
                                    key={idx}
                                    href={action.href}
                                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${action.color}`}
                                >
                                    <span className="text-2xl">{action.icon}</span>
                                    <span className="text-white font-medium">{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Recent Activity */}
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {RECENT_ACTIVITY.map((activity, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <span className="text-xl">{activity.icon}</span>
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{activity.action}</p>
                                            <p className="text-gray-500 text-xs">{activity.client}</p>
                                        </div>
                                        <span className="text-gray-500 text-xs">{activity.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Revenue Chart Placeholder */}
                        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
                            <div className="h-48 flex items-center justify-center border border-dashed border-gray-600 rounded-lg">
                                <p className="text-gray-500">📈 Chart coming soon...</p>
                            </div>
                        </div>
                    </div>

                    {/* Binh Pháp Tip */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/20 p-6"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">⚔️</span>
                            <div>
                                <p className="text-purple-300 font-medium">Binh Pháp Tip of the Day</p>
                                <p className="text-gray-300 text-sm mt-1">
                                    &quot;Bất chiến nhi khuất nhân chi binh&quot; - Win without fighting. Focus on positioning, not confrontation.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    )
}
