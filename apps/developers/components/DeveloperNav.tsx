'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code, Key, BarChart3, Webhook, BookOpen, Settings, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DeveloperNav() {
    const pathname = usePathname()

    const navItems = [
        { name: 'Overview', href: '/', icon: LayoutDashboard },
        { name: 'API Keys', href: '/api-keys', icon: Key },
        { name: 'OAuth Apps', href: '/oauth', icon: Code },
        { name: 'Webhooks', href: '/webhooks', icon: Webhook },
        { name: 'Usage', href: '/usage', icon: BarChart3 },
        { name: 'Documentation', href: '/docs', icon: BookOpen },
    ]

    return (
        <div className="flex h-screen w-64 flex-col border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
            <div className="flex h-16 items-center px-6 border-b border-[var(--md-sys-color-outline-variant)]">
                <Code className="h-6 w-6 text-[var(--md-sys-color-primary)] mr-2" />
                <span className="text-lg font-bold">AgencyOS Dev</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center px-3 py-2 text-sm font-medium rounded-[var(--md-sys-shape-corner-medium)] transition-colors",
                                isActive
                                    ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                                    : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]"
                            )}
                        >
                            <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-[var(--md-sys-color-on-primary-container)]" : "text-[var(--md-sys-color-on-surface-variant)]")} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            <div className="border-t border-[var(--md-sys-color-outline-variant)] p-4">
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    v1.0.0 (Beta)
                </div>
            </div>
        </div>
    )
}
