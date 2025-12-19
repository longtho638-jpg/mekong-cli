'use client'
import { useState, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Tab {
    id: string
    label: string
    icon?: string
    content: ReactNode
    disabled?: boolean
}

interface AnimatedTabsProps {
    tabs: Tab[]
    defaultTab?: string
    onChange?: (tabId: string) => void
    variant?: 'underline' | 'pills' | 'cards'
    className?: string
}

export default function AnimatedTabs({
    tabs,
    defaultTab,
    onChange,
    variant = 'underline',
    className = '',
}: AnimatedTabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        onChange?.(tabId)
    }

    const activeContent = tabs.find((t) => t.id === activeTab)?.content

    return (
        <div className={className}>
            {/* Tab Headers */}
            <div
                className={`
                    relative flex
                    ${variant === 'underline' ? 'border-b border-white/10 gap-2' : ''}
                    ${variant === 'pills' ? 'bg-white/5 backdrop-blur-2xl p-1.5 rounded-2xl gap-2 border border-white/10' : ''}
                    ${variant === 'cards' ? 'gap-3 mb-6' : ''}
                `}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id

                    return (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && handleTabChange(tab.id)}
                            disabled={tab.disabled}
                            className={`
                                relative px-5 py-2.5 font-bold transition-all duration-300
                                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                                ${variant === 'underline' ? 'text-base' : ''}
                                ${variant === 'pills' ? 'rounded-xl text-sm flex-1' : ''}
                                ${variant === 'cards' ? 'rounded-2xl px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10' : ''}
                                ${isActive ? 'text-white text-shadow-glow' : 'text-white/60 hover:text-white'}
                            `}
                        >
                            {/* Active indicator */}
                            {isActive && variant === 'underline' && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                                    layoutId="activeTab"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            {isActive && variant === 'pills' && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                                    layoutId="activeTab"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            {isActive && variant === 'cards' && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-400/50 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                                    layoutId="activeTab"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}

                            {/* Tab content */}
                            <span className="relative z-10 flex items-center justify-center gap-2.5">
                                {tab.icon && <span className="text-xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{tab.icon}</span>}
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={variant === 'underline' ? 'pt-6' : 'pt-4'}
            >
                {activeContent}
            </motion.div>
        </div>
    )
}
