'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFavorites } from '@/hooks/useFavorites'
import { useToastHelpers } from '@/components/Toast'

const HUB_CATEGORIES = [
    {
        name: 'Command',
        hubs: [
            { id: 'warroom', name: 'War Room', icon: '🏯', path: '/warroom', color: '#ff0000' },
            { id: 'executive', name: 'Executive', icon: '👑', path: '/executive', color: '#ffd700' },
            { id: 'agentops', name: 'AgentOps', icon: '🎯', path: '/agentops', color: '#00bfff' },
        ]
    },
    {
        name: 'VC Studio',
        hubs: [
            { id: 'binhphap', name: 'Binh Pháp', icon: '🏯', path: '/binhphap', color: '#ff0000' },
            { id: 'dealflow', name: 'Deal Flow', icon: '🎯', path: '/dealflow', color: '#8a2be2' },
            { id: 'portfolio', name: 'Portfolio', icon: '💎', path: '/portfolio', color: '#00ff41' },
            { id: 'shield', name: 'Shield', icon: '🛡️', path: '/shield', color: '#ffd700' },
            { id: 'startup', name: 'Startup', icon: '🦄', path: '/startup', color: '#8a2be2' },
        ]
    },
    {
        name: 'Sales & BD',
        hubs: [
            { id: 'sales', name: 'Sales', icon: '💰', path: '/sales', color: '#ffd700' },
            { id: 'crm', name: 'CRM', icon: '💼', path: '/crm', color: '#ff69b4' },
            { id: 'realestate', name: 'Real Estate', icon: '🏠', path: '/realestate', color: '#4caf50' },
        ]
    },
    {
        name: 'Growth',
        hubs: [
            { id: 'marketing', name: 'Marketing', icon: '📢', path: '/marketing', color: '#e4405f' },
            { id: 'social', name: 'Social', icon: '📱', path: '/social', color: '#1DA1F2' },
            { id: 'analytics', name: 'Analytics', icon: '📊', path: '/analytics', color: '#00ff41' },
        ]
    },
    {
        name: 'Operations',
        hubs: [
            { id: 'operations', name: 'Operations', icon: '⚙️', path: '/operations', color: '#ff9800' },
            { id: 'data', name: 'Data', icon: '🔄', path: '/data', color: '#00bfff' },
            { id: 'it', name: 'IT Ops', icon: '🖥️', path: '/it', color: '#8a2be2' },
            { id: 'inventory', name: 'Inventory', icon: '📦', path: '/inventory', color: '#795548' },
        ]
    },
    {
        name: 'Finance & Legal',
        hubs: [
            { id: 'finops', name: 'FinOps', icon: '💵', path: '/finops', color: '#00ff41' },
            { id: 'legal', name: 'Legal', icon: '⚖️', path: '/legal', color: '#9e9e9e' },
            { id: 'security', name: 'Security', icon: '🔐', path: '/security', color: '#ff6347' },
        ]
    },
    {
        name: 'Product',
        hubs: [
            { id: 'product', name: 'Product', icon: '🚀', path: '/product', color: '#00bfff' },
            { id: 'projects', name: 'Projects', icon: '📂', path: '/projects', color: '#00bfff' },
        ]
    },
    {
        name: 'People',
        hubs: [
            { id: 'hr', name: 'HR', icon: '👥', path: '/hr', color: '#8a2be2' },
            { id: 'learning', name: 'Learning', icon: '🎓', path: '/learning', color: '#9c27b0' },
        ]
    },
    {
        name: 'Support & Retail',
        hubs: [
            { id: 'support', name: 'Support', icon: '💬', path: '/support', color: '#00bfff' },
            { id: 'retail', name: 'Retail', icon: '🏪', path: '/retail', color: '#ff69b4' },
        ]
    },
    {
        name: 'Tools',
        hubs: [
            { id: 'admin', name: 'Admin', icon: '📋', path: '/admin', color: '#8bc34a' },
            { id: 'calendar', name: 'Calendar', icon: '📅', path: '/calendar', color: '#ffd700' },
            { id: 'documents', name: 'Documents', icon: '📄', path: '/documents', color: '#00bfff' },
            { id: 'assistant', name: 'Assistant', icon: '🤖', path: '/assistant', color: '#00bfff' },
            { id: 'settings', name: 'Settings', icon: '⚙️', path: '/settings', color: '#8a2be2' },
            { id: 'entrepreneur', name: 'Entrepreneur', icon: '🚀', path: '/entrepreneur', color: '#ff69b4' },
        ]
    },
]

export default function QuickNavSidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const { favorites, isFavorite, toggleFavorite, canAddMore } = useFavorites()
    const toast = useToastHelpers()

    const handleToggleFavorite = (e: React.MouseEvent, hub: { path: string; name: string; icon: string }) => {
        e.preventDefault()
        e.stopPropagation()
        const result = toggleFavorite(hub)
        if (result.success) {
            if (isFavorite(hub.path)) {
                toast.info('Unpinned', `${hub.name} removed from favorites`)
            } else {
                toast.success('Pinned!', `${hub.name} added to favorites`)
            }
        } else {
            toast.warning('Limit Reached', result.message)
        }
    }

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed flex items-center justify-center w-12 h-12 rounded-full cursor-pointer z-[1001] shadow-[0_0_20px_rgba(255,0,0,0.5)] hover:shadow-[0_0_40px_rgba(255,0,0,0.8)] transition-all duration-300 left-4 text-xl border border-white/20 hover:border-white/50 bg-black/40 backdrop-blur-md"
                animate={{
                    left: isOpen ? 280 : 16,
                    rotate: isOpen ? 90 : 0
                }}
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'linear-gradient(135deg, #ff0000 0%, #ff6347 100%)',
                }}
            >
                {isOpen ? '✕' : '🏯'}
            </motion.button>

            {/* Sidebar Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[999]"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-[280px] z-[1000] overflow-y-auto p-4 border-r border-white/10 bg-[#0a0a0f]/80 backdrop-blur-3xl shadow-[5px_0_50px_rgba(0,0,0,0.5)]"
                        >
                            {/* Header */}
                            <div className="mb-8 text-center pt-4">
                                <Link href="/hubs" className="no-underline block group">
                                    <h2 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-bold font-mono tracking-wider filter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:scale-105 transition-transform duration-300">
                                        🏯 AGENCY OS
                                    </h2>
                                    <div className="h-0.5 w-16 mx-auto bg-gradient-to-r from-transparent via-red-500/50 to-transparent mt-2" />
                                </Link>
                                <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-3 font-semibold">33 Departments</p>
                            </div>

                            {/* ⭐ Favorites Section */}
                            {favorites.length > 0 && (
                                <div className="mb-8 bg-gradient-to-b from-yellow-500/5 to-transparent rounded-2xl p-2 border border-yellow-500/10">
                                    <p className="text-[10px] text-yellow-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2 font-bold opacity-80">
                                        ⭐ Favorites ({favorites.length}/5)
                                    </p>
                                    <div className="flex flex-col gap-1">
                                        {favorites.map((fav) => {
                                            const isActive = pathname === fav.path
                                            return (
                                                <motion.div
                                                    key={fav.path}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center group relative"
                                                >
                                                    <Link
                                                        href={fav.path}
                                                        onClick={() => setIsOpen(false)}
                                                        className={`
                                                            flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
                                                            ${isActive
                                                                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/5 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                                                : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                                                            }
                                                        `}
                                                    >
                                                        <span className="text-lg filter drop-shadow-md group-hover:scale-110 transition-transform">{fav.icon}</span>
                                                        <span className={`text-sm tracking-wide ${isActive ? 'text-yellow-400 font-bold' : 'text-yellow-100/80 group-hover:text-yellow-200'}`}>
                                                            {fav.name}
                                                        </span>
                                                    </Link>
                                                    <motion.button
                                                        whileHover={{ scale: 1.2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => handleToggleFavorite(e, fav)}
                                                        className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white"
                                                        title="Unpin"
                                                    >
                                                        ✕
                                                    </motion.button>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Categories */}
                            {HUB_CATEGORIES.map((category) => (
                                <div key={category.name} className="mb-8 group/cat">
                                    <div className="flex items-center gap-2 px-2 mb-3">
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold whitespace-nowrap group-hover/cat:text-cyan-400/70 transition-colors">
                                            {category.name}
                                        </p>
                                        <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {category.hubs.map((hub) => {
                                            const isActive = pathname === hub.path
                                            const isPinned = isFavorite(hub.path)
                                            return (
                                                <div
                                                    key={hub.id}
                                                    className="flex items-center group relative"
                                                >
                                                    <Link
                                                        href={hub.path}
                                                        onClick={() => setIsOpen(false)}
                                                        className={`
                                                            flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
                                                            ${isActive
                                                                ? 'bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                                                : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                                                            }
                                                        `}
                                                    >
                                                        <div
                                                            className={`
                                                                text-xl transition-transform duration-300 group-hover:scale-110
                                                                ${isActive ? 'filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'opacity-80 group-hover:opacity-100'}
                                                            `}
                                                        >
                                                            {hub.icon}
                                                        </div>
                                                        <span
                                                            className={`text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}
                                                        >
                                                            {hub.name}
                                                        </span>
                                                    </Link>
                                                    {!isActive && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => handleToggleFavorite(e, hub)}
                                                            className={`
                                                                absolute right-2 p-1.5 rounded-lg transition-all 
                                                                ${isPinned ? 'opacity-100 text-yellow-400' : 'opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/60 hover:bg-white/10'}
                                                            `}
                                                            title={isPinned ? 'Unpin' : (canAddMore ? 'Pin to favorites' : 'Max favorites reached')}
                                                        >
                                                            {isPinned ? '★' : '☆'}
                                                        </motion.button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Footer */}
                            <div className="mt-12 pb-8 text-center">
                                <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-light">
                                    WIN-WIN-WIN 🏯
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

