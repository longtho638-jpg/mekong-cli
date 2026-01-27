'use client'

import React from 'react'
import { 
    LayoutDashboard, 
    TrendingUp, 
    Users, 
    PenTool, 
    Settings, 
    Zap,
    Target
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const NAV_ITEMS = [
    { name: 'Mission Control', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Revenue Engine', href: '/dashboard/revenue', icon: TrendingUp },
    { name: 'Client Magnet', href: '/dashboard/crm', icon: Users },
    { name: 'Content Factory', href: '/dashboard/content', icon: PenTool },
    { name: 'Strategy (Binh Pháp)', href: '/dashboard/strategy', icon: Target },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-mesh opacity-20 pointer-events-none" />
            <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none" />
            
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden md:flex w-64 flex-shrink-0 glass-ultra border-r border-white/5 z-20 flex-col relative"
            >
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 agentic-core">
                        <Zap className="w-5 h-5 text-white fill-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Agency OS
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
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden hover-lift",
                                    isActive 
                                        ? "text-white font-medium shadow-catalyst" 
                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20" />
                                )}
                                <item.icon className={clsx("w-4 h-4 relative z-10 transition-colors", isActive ? "text-emerald-400" : "group-hover:text-emerald-300")} />
                                <span className="relative z-10 text-sm">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeGlow"
                                        className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                                    />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="glass-card-pro rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <span className="text-xs font-bold text-blue-400">VC</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Readiness Score</p>
                                <p className="text-sm font-bold text-white">83/100</p>
                            </div>
                        </div>
                        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-[83%] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 glass-nav">
                    <h1 className="text-lg font-medium text-white/90 tracking-tight">
                        {NAV_ITEMS.find(i => i.href === pathname)?.name || 'Dashboard'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <button className="hidden md:block px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            ⚡ Binh Phap Mode
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border border-white/10 shadow-lg" />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8 relative scrollbar-hide">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}