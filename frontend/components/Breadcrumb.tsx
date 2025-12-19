'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Route configuration with icons and labels
const ROUTE_CONFIG: Record<string, { label: string; icon: string; category?: string }> = {
    // Navigation
    'warroom': { label: 'War Room', icon: '⚔️', category: 'Command' },
    'hubs': { label: 'Hub Index', icon: '🏯', category: 'Navigation' },
    'agentops': { label: 'AgentOps', icon: '🤖', category: 'AI' },
    'analytics': { label: 'Analytics', icon: '📊', category: 'Data' },
    'settings': { label: 'Settings', icon: '⚙️', category: 'System' },

    // VC Studio
    'binhphap': { label: 'Binh Pháp', icon: '📜', category: 'VC Studio' },
    'dealflow': { label: 'Deal Flow', icon: '🎯', category: 'VC Studio' },
    'portfolio': { label: 'Portfolio', icon: '💼', category: 'VC Studio' },
    'shield': { label: 'Shield', icon: '🛡️', category: 'VC Studio' },
    'startup': { label: 'Startup', icon: '🚀', category: 'VC Studio' },

    // Business
    'sales': { label: 'Sales', icon: '💰', category: 'Business' },
    'crm': { label: 'CRM', icon: '👥', category: 'Business' },
    'projects': { label: 'Projects', icon: '📋', category: 'Business' },
    'marketing': { label: 'Marketing', icon: '📢', category: 'Business' },
    'operations': { label: 'Operations', icon: '⚡', category: 'Business' },
    'admin': { label: 'Admin', icon: '🔑', category: 'Business' },

    // Productivity
    'documents': { label: 'Documents', icon: '📄', category: 'Productivity' },
    'calendar': { label: 'Calendar', icon: '📅', category: 'Productivity' },
    'assistant': { label: 'Assistant', icon: '🧠', category: 'Productivity' },
    'learning': { label: 'Learning', icon: '📚', category: 'Productivity' },

    // Commerce
    'inventory': { label: 'Inventory', icon: '📦', category: 'Commerce' },
    'retail': { label: 'Retail', icon: '🏪', category: 'Commerce' },
    'realestate': { label: 'Real Estate', icon: '🏠', category: 'Commerce' },

    // Tech
    'it': { label: 'IT Hub', icon: '💻', category: 'Tech' },
    'security': { label: 'Security', icon: '🔐', category: 'Tech' },
    'data': { label: 'Data', icon: '🗄️', category: 'Tech' },

    // Support
    'support': { label: 'Support', icon: '🎧', category: 'Support' },
    'social': { label: 'Social', icon: '📱', category: 'Support' },
    'legal': { label: 'Legal', icon: '⚖️', category: 'Support' },
    'product': { label: 'Product', icon: '🎨', category: 'Support' },
    'entrepreneur': { label: 'Entrepreneur', icon: '💡', category: 'Support' },
}

export default function Breadcrumb() {
    const pathname = usePathname()

    // Parse path into segments
    const segments = pathname.split('/').filter(Boolean)

    // Don't show on home page
    if (segments.length === 0) return null

    // Build breadcrumb items
    const items = segments.map((segment, idx) => {
        const config = ROUTE_CONFIG[segment] || { label: segment, icon: '📁' }
        const path = '/' + segments.slice(0, idx + 1).join('/')
        const isLast = idx === segments.length - 1

        return {
            segment,
            label: config.label,
            icon: config.icon,
            category: config.category,
            path,
            isLast,
        }
    })

    return (
        <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 left-20 z-[100] flex items-center gap-1 px-4 py-2 ultra-glass border border-white/10 rounded-xl font-mono text-[13px] shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-md"
        >
            {/* Home */}
            <Link
                href="/"
                className="flex items-center gap-1 text-white/50 hover:text-cyan-400 transition-colors duration-200"
            >
                🏠
            </Link>

            <AnimatePresence mode="popLayout">
                {items.map((item, idx) => (
                    <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-1"
                    >
                        {/* Separator */}
                        <span className="text-white/30 mx-1">
                            ▸
                        </span>

                        {/* Category tag (first item only) */}
                        {idx === 0 && item.category && (
                            <span className="text-[9px] text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider mr-1.5 border border-cyan-500/20">
                                {item.category}
                            </span>
                        )}

                        {item.isLast ? (
                            // Current page (not clickable)
                            <span className="flex items-center gap-1.5 text-cyan-400 font-bold filter drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </span>
                        ) : (
                            // Clickable link
                            <Link
                                href={item.path}
                                className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors duration-200 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.nav>
    )
}
