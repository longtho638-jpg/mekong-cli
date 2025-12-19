'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'

// All 33 hubs with search metadata
const COMMANDS = [
    // Navigation - Core
    { id: 'warroom', label: 'War Room', icon: '⚔️', path: '/warroom', category: 'Navigation', keywords: ['home', 'dashboard', 'command', 'mission'] },
    { id: 'hubs', label: 'Hub Index', icon: '🏯', path: '/hubs', category: 'Navigation', keywords: ['all', 'departments', 'index', 'browse'] },
    { id: 'agentops', label: 'AgentOps', icon: '🤖', path: '/agentops', category: 'Navigation', keywords: ['ai', 'automation', 'agent'] },
    { id: 'analytics', label: 'Analytics', icon: '📊', path: '/analytics', category: 'Navigation', keywords: ['data', 'reports', 'metrics'] },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings', category: 'Navigation', keywords: ['config', 'preferences'] },

    // VC Studio
    { id: 'binhphap', label: 'Binh Pháp Browser', icon: '📜', path: '/binhphap', category: 'VC Studio', keywords: ['strategy', 'art of war', 'chapters', 'sun tzu'] },
    { id: 'dealflow', label: 'Deal Flow', icon: '🎯', path: '/dealflow', category: 'VC Studio', keywords: ['pipeline', 'startups', 'investing'] },
    { id: 'portfolio', label: 'Portfolio', icon: '💼', path: '/portfolio', category: 'VC Studio', keywords: ['ventures', 'investments', 'companies'] },
    { id: 'shield', label: 'Anti-Dilution Shield', icon: '🛡️', path: '/shield', category: 'VC Studio', keywords: ['term sheet', 'dilution', 'calculator', 'equity'] },
    { id: 'startup', label: 'Startup Runway', icon: '🚀', path: '/startup', category: 'VC Studio', keywords: ['runway', 'burn', 'funding'] },

    // Business Ops
    { id: 'sales', label: 'Sales Hub', icon: '💰', path: '/sales', category: 'Business', keywords: ['sales', 'revenue', 'pipeline', 'deals'] },
    { id: 'crm', label: 'CRM Hub', icon: '👥', path: '/crm', category: 'Business', keywords: ['customers', 'contacts', 'relationships'] },
    { id: 'projects', label: 'Projects', icon: '📋', path: '/projects', category: 'Business', keywords: ['tasks', 'sprints', 'kanban'] },
    { id: 'marketing', label: 'Marketing', icon: '📢', path: '/marketing', category: 'Business', keywords: ['campaigns', 'ads', 'growth'] },
    { id: 'operations', label: 'Operations', icon: '⚡', path: '/operations', category: 'Business', keywords: ['ops', 'workflows'] },
    { id: 'admin', label: 'Admin Console', icon: '🔑', path: '/admin', category: 'Business', keywords: ['users', 'permissions', 'admin'] },

    // Productivity
    { id: 'documents', label: 'Documents', icon: '📄', path: '/documents', category: 'Productivity', keywords: ['files', 'docs', 'notes'] },
    { id: 'calendar', label: 'Calendar', icon: '📅', path: '/calendar', category: 'Productivity', keywords: ['schedule', 'events', 'meetings'] },
    { id: 'assistant', label: 'AI Assistant', icon: '🧠', path: '/assistant', category: 'Productivity', keywords: ['chat', 'ai', 'help'] },
    { id: 'learning', label: 'Learning Hub', icon: '📚', path: '/learning', category: 'Productivity', keywords: ['courses', 'training', 'education'] },

    // Commerce
    { id: 'inventory', label: 'Inventory', icon: '📦', path: '/inventory', category: 'Commerce', keywords: ['stock', 'products', 'warehouse'] },
    { id: 'retail', label: 'Retail', icon: '🏪', path: '/retail', category: 'Commerce', keywords: ['pos', 'sales', 'store'] },
    { id: 'realestate', label: 'Real Estate', icon: '🏠', path: '/realestate', category: 'Commerce', keywords: ['property', 'listings'] },

    // Tech
    { id: 'it', label: 'IT Hub', icon: '💻', path: '/it', category: 'Tech', keywords: ['infrastructure', 'servers', 'devops'] },
    { id: 'security', label: 'Security', icon: '🔐', path: '/security', category: 'Tech', keywords: ['ciso', 'threats', 'compliance'] },
    { id: 'data', label: 'Data Hub', icon: '🗄️', path: '/data', category: 'Tech', keywords: ['database', 'etl', 'warehouse'] },

    // Support
    { id: 'support', label: 'Support', icon: '🎧', path: '/support', category: 'Support', keywords: ['tickets', 'help desk', 'service'] },
    { id: 'social', label: 'Social Media', icon: '📱', path: '/social', category: 'Support', keywords: ['twitter', 'facebook', 'posts'] },
    { id: 'legal', label: 'Legal', icon: '⚖️', path: '/legal', category: 'Support', keywords: ['contracts', 'compliance', 'law'] },
    { id: 'product', label: 'Product', icon: '🎨', path: '/product', category: 'Support', keywords: ['roadmap', 'features', 'design'] },
    { id: 'entrepreneur', label: 'Entrepreneur', icon: '💡', path: '/entrepreneur', category: 'Support', keywords: ['founder', 'ideation', 'business'] },

    // Quick Actions
    { id: 'new-deal', label: 'New Deal', icon: '➕', path: '/dealflow?action=new', category: 'Quick Actions', keywords: ['create', 'add', 'deal'] },
    { id: 'new-project', label: 'New Project', icon: '➕', path: '/projects?action=new', category: 'Quick Actions', keywords: ['create', 'add', 'project'] },
    { id: 'run-agent', label: 'Run Agent', icon: '▶️', path: '/agentops?action=run', category: 'Quick Actions', keywords: ['execute', 'start', 'agent'] },
]

const RECENT_KEY = 'agencyos-recent-commands'

// Fuzzy search with scoring
function fuzzyScore(query: string, text: string): number {
    const q = query.toLowerCase()
    const t = text.toLowerCase()
    if (t === q) return 100
    if (t.startsWith(q)) return 90
    if (t.includes(q)) return 70

    // Word start match
    const words = t.split(/\s+/)
    for (const word of words) {
        if (word.startsWith(q)) return 60
    }

    // Character sequence
    let qIdx = 0
    for (let i = 0; i < t.length && qIdx < q.length; i++) {
        if (t[i] === q[qIdx]) qIdx++
    }
    return qIdx === q.length ? 40 : 0
}

function scoreCommand(query: string, cmd: typeof COMMANDS[0]): number {
    const labelScore = fuzzyScore(query, cmd.label) * 2
    const categoryScore = fuzzyScore(query, cmd.category)
    const keywordScores = cmd.keywords.map(k => fuzzyScore(query, k))
    return labelScore + categoryScore + Math.max(...keywordScores, 0)
}

// Highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return (
        <>
            {text.slice(0, idx)}
            <span style={{ background: 'rgba(0, 255, 255, 0.3)', borderRadius: 2 }}>
                {text.slice(idx, idx + query.length)}
            </span>
            {text.slice(idx + query.length)}
        </>
    )
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [recentCommands, setRecentCommands] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const pathname = usePathname()

    // Load recent commands
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_KEY)
            if (stored) setRecentCommands(JSON.parse(stored))
        } catch { }
    }, [])

    // Filter commands based on query with scoring
    const filteredCommands = query === ''
        ? COMMANDS
        : COMMANDS
            .map(cmd => ({ cmd, score: scoreCommand(query, cmd) }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .map(({ cmd }) => cmd)

    // Get recent items for empty query
    const recentItems = query === ''
        ? recentCommands
            .map(id => COMMANDS.find(c => c.id === id))
            .filter(Boolean) as typeof COMMANDS
        : []

    // Keyboard handler for opening palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Focus input when opening
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
            setQuery('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    // Navigate with arrow keys
    const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
        const totalItems = query === '' ? recentItems.length + filteredCommands.length : filteredCommands.length
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(i => Math.min(i + 1, totalItems - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            let targetCmd
            if (query === '' && selectedIndex < recentItems.length) {
                targetCmd = recentItems[selectedIndex]
            } else {
                const idx = query === '' ? selectedIndex - recentItems.length : selectedIndex
                targetCmd = filteredCommands[idx]
            }
            if (targetCmd) executeCommand(targetCmd)
        }
    }, [filteredCommands, selectedIndex, query, recentItems])

    const executeCommand = (cmd: typeof COMMANDS[0]) => {
        // Add to recent
        const updated = [cmd.id, ...recentCommands.filter(id => id !== cmd.id)].slice(0, 5)
        setRecentCommands(updated)
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))

        setIsOpen(false)
        router.push(cmd.path)
    }

    // Group commands by category
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = []
        acc[cmd.category].push(cmd)
        return acc
    }, {} as Record<string, typeof COMMANDS>)

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[9998]"
                    />

                    {/* Command Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl max-h-[70vh] z-[9999] overflow-hidden rounded-2xl ultra-glass border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_50px_rgba(6,182,212,0.15)] bg-[#0a0a0f]/80 backdrop-blur-3xl"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-6 py-5 border-b border-white/10 gap-4 bg-white/5">
                            <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">🔍</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                    setSelectedIndex(0)
                                }}
                                onKeyDown={handleInputKeyDown}
                                placeholder="Search hubs, actions, commands..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-xl font-medium placeholder:text-white/20 placeholder:font-normal focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] rounded-lg transition-all"
                            />
                            <kbd className="bg-white/10 px-2 py-1 rounded-md text-xs font-bold text-white/40 border border-white/5 tracking-wider">ESC</kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[calc(70vh-120px)] overflow-y-auto p-3 scrollbar-hide">
                            {/* Recent Searches */}
                            {query === '' && recentItems.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-3 py-2 text-[10px] font-bold text-yellow-500/70 uppercase tracking-widest flex items-center gap-2">
                                        <span>🕐</span> Recent
                                    </div>
                                    {recentItems.map((cmd, idx) => {
                                        const isSelected = idx === selectedIndex
                                        return (
                                            <motion.div
                                                key={`recent-${cmd.id}`}
                                                onClick={() => executeCommand(cmd)}
                                                whileHover={{ x: 4 }}
                                                className={`
                                                    flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200
                                                    ${isSelected ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/30' : 'hover:bg-white/5 border border-transparent'}
                                                `}
                                            >
                                                <span className="text-xl">{cmd.icon}</span>
                                                <span className={`flex-1 ${isSelected ? 'text-yellow-400 font-medium' : 'text-white/60'}`}>
                                                    {cmd.label}
                                                </span>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Search Results */}
                            {Object.entries(groupedCommands).map(([category, commands]) => (
                                <div key={category} className="mb-4">
                                    <div className="px-3 py-2 text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest opacity-80">
                                        {category}
                                    </div>
                                    {commands.map((cmd) => {
                                        const baseIndex = query === '' ? recentItems.length : 0
                                        const globalIndex = baseIndex + filteredCommands.indexOf(cmd)
                                        const isSelected = globalIndex === selectedIndex
                                        const isActive = pathname === cmd.path

                                        return (
                                            <motion.div
                                                key={cmd.id}
                                                onClick={() => executeCommand(cmd)}
                                                whileHover={{ x: 4 }}
                                                className={`
                                                    flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200
                                                    ${isSelected ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/5 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'hover:bg-white/5 border border-transparent'}
                                                    ${isActive ? 'border-l-4 !border-l-cyan-500 bg-white/5' : ''}
                                                `}
                                            >
                                                <span className="text-2xl filter drop-shadow-sm">{cmd.icon}</span>
                                                <span className={`flex-1 font-medium text-lg ${isSelected ? 'text-cyan-300' : 'text-white/80'}`}>
                                                    {highlightMatch(cmd.label, query)}
                                                </span>
                                                {isActive && (
                                                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 tracking-wider">
                                                        ACTIVE
                                                    </span>
                                                )}
                                                {/* Keyword match indicator could go here */}
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            ))}

                            {filteredCommands.length === 0 && (
                                <div className="py-16 text-center text-white/30">
                                    <div className="text-4xl mb-4 opacity-50">🔭</div>
                                    <p className="text-lg mb-2 font-medium">No results for "{query}"</p>
                                    <p className="text-xs tracking-wide">
                                        Try searching for hubs, actions, or specific keywords...
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/10 p-3 flex gap-6 text-[10px] uppercase font-bold text-white/30 bg-black/40 backdrop-blur-md justify-center tracking-wider">
                            <span className="flex items-center gap-2"><kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">↑↓</kbd> Navigate</span>
                            <span className="flex items-center gap-2"><kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">Enter</kbd> Select</span>
                            <span className="flex items-center gap-2"><kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">Esc</kbd> Close</span>
                            <span className="ml-auto text-cyan-500/50 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse" />
                                {filteredCommands.length} results
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
