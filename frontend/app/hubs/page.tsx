'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import PremiumHubCard from '@/components/PremiumHubCard'

interface Hub {
    id: string
    name: string
    icon: string
    path: string
    description: string
    color: string
    stats: { label: string; value: string }[]
}

const HUBS: Hub[] = [
    // Command Center
    { id: 'warroom', name: 'War Room', icon: '🏯', path: '/warroom', description: 'Strategic Command Center', color: '#ff0000', stats: [{ label: 'MRR', value: '$85K' }, { label: 'Runway', value: '18mo' }] },
    { id: 'executive', name: 'Executive', icon: '👑', path: '/executive', description: 'CEO Command', color: '#ffd700', stats: [{ label: 'Depts', value: '6' }, { label: 'Score', value: '87%' }] },
    { id: 'agentops', name: 'AgentOps', icon: '🎯', path: '/agentops', description: '50 AI Agents Unified', color: '#00bfff', stats: [{ label: 'Agents', value: '156' }, { label: 'Active', value: '50' }] },
    // Sales & BD
    { id: 'sales', name: 'Sales', icon: '💰', path: '/sales', description: 'Pipeline & Deals', color: '#ffd700', stats: [{ label: 'Pipeline', value: '$2.5M' }, { label: 'Deals', value: '42' }] },
    { id: 'crm', name: 'CRM', icon: '💼', path: '/crm', description: 'Contacts & Deals', color: '#ff69b4', stats: [{ label: 'Contacts', value: '4' }, { label: 'Pipeline', value: '$235K' }] },
    { id: 'realestate', name: 'Real Estate', icon: '🏠', path: '/realestate', description: 'Property Portfolio', color: '#4caf50', stats: [{ label: 'Listings', value: '8' }, { label: 'Value', value: '$12M' }] },
    // Growth
    { id: 'marketing', name: 'Marketing', icon: '📢', path: '/marketing', description: 'Campaigns & Social', color: '#e4405f', stats: [{ label: 'Reach', value: '410K' }, { label: 'Followers', value: '49K' }] },
    { id: 'social', name: 'Social', icon: '📱', path: '/social', description: 'Social Media', color: '#1DA1F2', stats: [{ label: 'Followers', value: '49K' }, { label: 'Eng', value: '5.4%' }] },
    { id: 'analytics', name: 'Analytics', icon: '📊', path: '/analytics', description: 'Business Intelligence', color: '#00ff41', stats: [{ label: 'Users', value: '12.5K' }, { label: 'Views', value: '85K' }] },
    // Operations
    { id: 'operations', name: 'Operations', icon: '⚙️', path: '/operations', description: 'Process Management', color: '#ff9800', stats: [{ label: 'Processes', value: '4' }, { label: 'Efficiency', value: '89%' }] },
    { id: 'data', name: 'Data', icon: '🔄', path: '/data', description: 'Automation & ETL', color: '#00bfff', stats: [{ label: 'Pipelines', value: '3' }, { label: 'Success', value: '99.6%' }] },
    { id: 'it', name: 'IT Ops', icon: '🖥️', path: '/it', description: 'Infrastructure', color: '#8a2be2', stats: [{ label: 'Servers', value: '4' }, { label: 'Uptime', value: '99.9%' }] },
    { id: 'inventory', name: 'Inventory', icon: '📦', path: '/inventory', description: 'Stock Management', color: '#795548', stats: [{ label: 'Items', value: '4' }, { label: 'Value', value: '$283K' }] },
    // Finance & Legal
    { id: 'finops', name: 'FinOps', icon: '💵', path: '/finops', description: 'Budget & Invoices', color: '#00ff41', stats: [{ label: 'Budget', value: '$110K' }, { label: 'Burn', value: '66%' }] },
    { id: 'legal', name: 'Legal', icon: '⚖️', path: '/legal', description: 'Contracts & Compliance', color: '#9e9e9e', stats: [{ label: 'Contracts', value: '12' }, { label: 'Compliance', value: '67%' }] },
    { id: 'security', name: 'Security', icon: '🔐', path: '/security', description: 'CISO Command', color: '#ff6347', stats: [{ label: 'Alerts', value: '3' }, { label: 'Score', value: '85%' }] },
    { id: 'shield', name: 'Shield', icon: '🛡️', path: '/shield', description: 'Anti-Dilution', color: '#ffd700', stats: [{ label: 'Protection', value: 'Active' }, { label: 'Chapters', value: '13' }] },
    // Product
    { id: 'product', name: 'Product', icon: '🚀', path: '/product', description: 'Roadmap & Features', color: '#00bfff', stats: [{ label: 'Products', value: '4' }, { label: 'MRR', value: '$115K' }] },
    { id: 'projects', name: 'Projects', icon: '📂', path: '/projects', description: 'Task Management', color: '#00bfff', stats: [{ label: 'Active', value: '3' }, { label: 'Progress', value: '60%' }] },
    { id: 'startup', name: 'Startup', icon: '🦄', path: '/startup', description: 'Venture Portfolio', color: '#8a2be2', stats: [{ label: 'Ventures', value: '4' }, { label: 'Value', value: '$5.7M' }] },
    // People & Learning
    { id: 'hr', name: 'HR', icon: '👥', path: '/hr', description: 'Team & Recruitment', color: '#8a2be2', stats: [{ label: 'Team', value: '28' }, { label: 'Open', value: '5' }] },
    { id: 'learning', name: 'Learning', icon: '🎓', path: '/learning', description: 'Courses & Skills', color: '#9c27b0', stats: [{ label: 'Courses', value: '4' }, { label: 'Skills', value: '24' }] },
    // Support & Retail
    { id: 'support', name: 'Support', icon: '💬', path: '/support', description: 'Customer Service', color: '#00bfff', stats: [{ label: 'Tickets', value: '4' }, { label: 'CSAT', value: '97%' }] },
    { id: 'retail', name: 'Retail', icon: '🏪', path: '/retail', description: 'E-commerce', color: '#ff69b4', stats: [{ label: 'Revenue', value: '$188K' }, { label: 'Orders', value: '1K+' }] },
    // Admin & Tools
    { id: 'admin', name: 'Admin', icon: '📋', path: '/admin', description: 'Operations', color: '#8bc34a', stats: [{ label: 'Tasks', value: '15' }, { label: 'Meetings', value: '3' }] },
    { id: 'calendar', name: 'Calendar', icon: '📅', path: '/calendar', description: 'Events & Schedule', color: '#ffd700', stats: [{ label: 'Events', value: '5' }, { label: 'Total', value: '49' }] },
    { id: 'documents', name: 'Documents', icon: '📄', path: '/documents', description: 'Files & Folders', color: '#00bfff', stats: [{ label: 'Files', value: '247' }, { label: 'Storage', value: '24GB' }] },
    { id: 'assistant', name: 'Assistant', icon: '🤖', path: '/assistant', description: 'AI Commands', color: '#00bfff', stats: [{ label: 'Commands', value: '822' }, { label: 'Success', value: '96%' }] },
    { id: 'settings', name: 'Settings', icon: '⚙️', path: '/settings', description: 'Configuration', color: '#8a2be2', stats: [{ label: 'Integrations', value: '4/5' }, { label: 'Team', value: '3' }] },
    // Entrepreneur
    { id: 'entrepreneur', name: 'Entrepreneur', icon: '🚀', path: '/entrepreneur', description: 'Ventures & OKRs', color: '#ff69b4', stats: [{ label: 'Ventures', value: '3' }, { label: 'Revenue', value: '$85K' }] },
    // VC Studio
    { id: 'binhphap', name: 'Binh Pháp', icon: '🏯', path: '/binhphap', description: '13 Chapters Wisdom', color: '#ff0000', stats: [{ label: 'Chapters', value: '13' }, { label: 'Services', value: '$85K+' }] },
    { id: 'dealflow', name: 'Deal Flow', icon: '🎯', path: '/dealflow', description: 'Startup Pipeline', color: '#8a2be2', stats: [{ label: 'Pipeline', value: '$1.5M' }, { label: 'Deals', value: '5' }] },
    { id: 'portfolio', name: 'Portfolio', icon: '💎', path: '/portfolio', description: 'Venture Metrics', color: '#00ff41', stats: [{ label: 'AUM', value: '$400K' }, { label: 'IRR', value: '85%' }] },
]

const COLUMNS = 5 // Approximate grid columns

export default function HubsIndexPage() {
    const router = useRouter()
    const [filter, setFilter] = useState('')
    const [focusIndex, setFocusIndex] = useState(-1)
    const [showKeyboardHints, setShowKeyboardHints] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Filter hubs based on search
    const filteredHubs = HUBS.filter(hub =>
        hub.name.toLowerCase().includes(filter.toLowerCase()) ||
        hub.description.toLowerCase().includes(filter.toLowerCase()) ||
        hub.id.toLowerCase().includes(filter.toLowerCase())
    )

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if typing in input or other elements
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            if (e.key === 'Escape') {
                setFilter('')
                inputRef.current?.blur()
                setFocusIndex(0)
            } else if (e.key === 'Enter' && focusIndex >= 0 && focusIndex < filteredHubs.length) {
                e.preventDefault()
                router.push(filteredHubs[focusIndex].path)
            }
            return
        }

        const total = filteredHubs.length

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault()
                setFocusIndex(prev => (prev + 1) % total)
                break
            case 'ArrowLeft':
                e.preventDefault()
                setFocusIndex(prev => (prev - 1 + total) % total)
                break
            case 'ArrowDown':
                e.preventDefault()
                setFocusIndex(prev => Math.min(prev + COLUMNS, total - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setFocusIndex(prev => Math.max(prev - COLUMNS, 0))
                break
            case 'Enter':
                if (focusIndex >= 0 && focusIndex < total) {
                    e.preventDefault()
                    router.push(filteredHubs[focusIndex].path)
                }
                break
            case 'Escape':
                setFilter('')
                setFocusIndex(-1)
                break
            case '/':
                e.preventDefault()
                inputRef.current?.focus()
                break
            default:
                // Start typing to filter
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                    inputRef.current?.focus()
                }
        }
    }, [filteredHubs, focusIndex, router])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        // Show hints after a delay
        const timer = setTimeout(() => setShowKeyboardHints(true), 2000)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            clearTimeout(timer)
        }
    }, [handleKeyDown])

    // Reset focus when filter changes
    useEffect(() => {
        if (filter && focusIndex === -1) {
            setFocusIndex(0)
        }
    }, [filter, focusIndex])

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #050505 0%, #0a0a1a 50%, #050510 100%)',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Ambient effects */}
            <div style={{
                position: 'fixed',
                top: '-10%',
                left: '30%',
                width: '40%',
                height: '30%',
                background: 'radial-gradient(circle, rgba(0,191,255,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed',
                bottom: '10%',
                right: '20%',
                width: '30%',
                height: '30%',
                background: 'radial-gradient(circle, rgba(255,0,0,0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1600, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '3rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}
                    >
                        <span style={{ color: '#ff0000' }}>🏯</span> AGENCY OS
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ color: '#888', fontSize: '1rem', letterSpacing: '0.2em' }}
                    >
                        WIN-WIN-WIN COMMAND CENTER • {filteredHubs.length} DEPARTMENTS
                    </motion.p>

                    {/* Search Filter */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ marginTop: '1.5rem', display: 'inline-block', position: 'relative' }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="🔍 Type to filter hubs... (or press /)"
                            style={{
                                width: 360,
                                padding: '0.75rem 1.25rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: filter ? '1px solid rgba(0,191,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />
                        {filter && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setFilter('')}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                }}
                            >
                                ESC
                            </motion.button>
                        )}
                    </motion.div>
                </header>

                {/* Premium Hub Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '1.25rem',
                }}>
                    <AnimatePresence mode="popLayout">
                        {filteredHubs.map((hub, i) => (
                            <motion.div
                                key={hub.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{ position: 'relative' }}
                            >
                                {/* Focus ring */}
                                {focusIndex === i && (
                                    <motion.div
                                        layoutId="focus-ring"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            position: 'absolute',
                                            inset: -4,
                                            border: `2px solid ${hub.color}`,
                                            borderRadius: '20px',
                                            boxShadow: `0 0 20px ${hub.color}50`,
                                            pointerEvents: 'none',
                                            zIndex: 10,
                                        }}
                                    />
                                )}
                                <PremiumHubCard {...hub} index={i} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty state */}
                {filteredHubs.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            textAlign: 'center',
                            padding: '4rem',
                            color: '#666',
                        }}
                    >
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
                        <p>No hubs found for &quot;{filter}&quot;</p>
                        <button
                            onClick={() => setFilter('')}
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                background: 'rgba(255,0,0,0.1)',
                                border: '1px solid rgba(255,0,0,0.3)',
                                borderRadius: '8px',
                                color: '#ff6347',
                                cursor: 'pointer',
                            }}
                        >
                            Clear Filter
                        </button>
                    </motion.div>
                )}

                {/* Keyboard Hints */}
                <AnimatePresence>
                    {showKeyboardHints && !filter && focusIndex === -1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            style={{
                                position: 'fixed',
                                bottom: '2rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '1.5rem',
                                padding: '0.75rem 1.5rem',
                                background: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                color: '#888',
                            }}
                        >
                            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', marginRight: '4px' }}>↑↓←→</kbd> Navigate</span>
                            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', marginRight: '4px' }}>Enter</kbd> Open</span>
                            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', marginRight: '4px' }}>/</kbd> Search</span>
                            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', marginRight: '4px' }}>⌘K</kbd> Command</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <footer style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                        🏯 agencyos.network • 168 Modules • 156 Agents • 13 Binh Pháp Chapters
                    </p>
                    <p style={{ color: '#ff0000', fontSize: '0.75rem' }}>
                        &quot;Bách chiến bách thắng, phi thiện chi thiện giả dã&quot;
                    </p>
                </footer>
            </div>
        </div>
    )
}
