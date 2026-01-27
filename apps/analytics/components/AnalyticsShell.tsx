'use client'

import React from 'react'
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    Filter,
    Settings,
    Zap,
    BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const NAV_ITEMS = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Revenue', href: '/revenue', icon: TrendingUp },
    { name: 'User Behavior', href: '/users', icon: Users },
    { name: 'Funnels', href: '/funnels', icon: Filter },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function AnalyticsShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />
            <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-64 flex-shrink-0 border-r border-white/5 z-20 flex flex-col relative bg-black/50 backdrop-blur-xl"
            >
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Zap className="w-5 h-5 text-white fill-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Analytics
                    </span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "text-white font-medium bg-white/5 border border-white/5"
                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl" />
                                )}
                                <item.icon className={clsx("w-4 h-4 relative z-10 transition-colors", isActive ? "text-purple-400" : "group-hover:text-purple-300")} />
                                <span className="relative z-10 text-sm">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute left-0 w-1 h-6 bg-purple-500 rounded-r-full"
                                    />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="rounded-xl p-4 bg-gradient-to-b from-white/5 to-transparent border border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <span className="text-xs font-bold text-green-400">IPO</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Readiness</p>
                                <p className="text-sm font-bold text-white">Ready</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
                    <h1 className="text-lg font-medium text-white/90 tracking-tight">
                        {NAV_ITEMS.find(i => i.href === pathname)?.name || 'Dashboard'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <span className="text-purple-400 text-xs font-medium">Live Updates</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border border-white/10 shadow-lg" />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 relative">
                    <div className="max-w-7xl mx-auto space-y-8 pb-20">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
