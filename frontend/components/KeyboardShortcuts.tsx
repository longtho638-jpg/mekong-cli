'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Shortcut categories
const SHORTCUT_CATEGORIES = [
    {
        title: 'Navigation',
        icon: '🧭',
        color: '#00bfff',
        shortcuts: [
            { keys: ['⌘', 'K'], description: 'Command Palette' },
            { keys: ['?'], description: 'Keyboard Shortcuts' },
            { keys: ['G', 'H'], description: 'Go to Hubs' },
            { keys: ['G', 'W'], description: 'Go to War Room' },
            { keys: ['G', 'D'], description: 'Go to Deal Flow' },
            { keys: ['G', 'P'], description: 'Go to Portfolio' },
        ]
    },
    {
        title: 'Quick Actions',
        icon: '⚡',
        color: '#ffd700',
        shortcuts: [
            { keys: ['N', 'D'], description: 'New Deal' },
            { keys: ['N', 'P'], description: 'New Project' },
            { keys: ['N', 'T'], description: 'New Task' },
            { keys: ['Esc'], description: 'Close Modal' },
        ]
    },
    {
        title: 'Agents',
        icon: '🤖',
        color: '#00ff41',
        shortcuts: [
            { keys: ['A', 'S'], description: 'Run Scout Agent' },
            { keys: ['A', 'E'], description: 'Run Editor Agent' },
            { keys: ['A', 'D'], description: 'Run Director Agent' },
            { keys: ['A', 'C'], description: 'Run Community Agent' },
        ]
    },
    {
        title: 'Views',
        icon: '👁️',
        color: '#a855f7',
        shortcuts: [
            { keys: ['V', 'G'], description: 'Grid View' },
            { keys: ['V', 'L'], description: 'List View' },
            { keys: ['V', 'K'], description: 'Kanban View' },
            { keys: ['/'], description: 'Focus Search' },
        ]
    },
]

export default function KeyboardShortcuts() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ? key to toggle (shift + /)
            if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
                const target = e.target as HTMLElement
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[700px] max-h-[80vh] bg-[#0a0a0f]/95 border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[9999] ultra-glass font-mono flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white m-0 tracking-tight">
                                    ⌨️ Keyboard Shortcuts
                                </h2>
                                <p className="text-xs text-white/50 mt-1 uppercase tracking-widest font-medium">
                                    Master your workflow
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white/50 hover:text-white hover:bg-white/20 transition-all text-xs font-medium cursor-pointer"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <div className="grid grid-cols-2 gap-6">
                                {SHORTCUT_CATEGORIES.map((category, catIdx) => (
                                    <motion.div
                                        key={category.title}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: catIdx * 0.05 }}
                                        className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                                            <span className="text-lg filter drop-shadow-md">{category.icon}</span>
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: category.color }}>
                                                {category.title}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {category.shortcuts.map((shortcut, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors"
                                                >
                                                    <span className="text-xs text-white/60 font-medium">
                                                        {shortcut.description}
                                                    </span>
                                                    <div className="flex gap-1.5">
                                                        {shortcut.keys.map((key, keyIdx) => (
                                                            <span
                                                                key={keyIdx}
                                                                className="px-2 py-1 rounded text-[10px] font-bold min-w-[24px] text-center shadow-sm"
                                                                style={{
                                                                    backgroundColor: `${category.color}15`,
                                                                    border: `1px solid ${category.color}30`,
                                                                    color: category.color,
                                                                    boxShadow: `0 0 5px ${category.color}20`
                                                                }}
                                                            >
                                                                {key}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-cyan-500/5 text-center shrink-0">
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                💡 Press <span className="text-cyan-400 font-bold">?</span> anytime to toggle this panel
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
