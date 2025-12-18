'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

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
]

export default function HubsIndexPage() {
    const [hubs] = useState(HUBS)

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
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
                        WIN-WIN-WIN COMMAND CENTER • 30 DEPARTMENTS
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            marginTop: '1rem',
                            display: 'inline-block',
                            padding: '0.5rem 1.5rem',
                            background: 'rgba(255,0,0,0.1)',
                            border: '1px solid rgba(255,0,0,0.3)',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            color: '#ff6347',
                        }}
                    >
                        &quot;Bất chiến nhi khuất nhân chi binh&quot; - Win Without Fighting
                    </motion.div>
                </header>

                {/* Hub Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '1.25rem',
                }}>
                    {hubs.map((hub, i) => (
                        <Link href={hub.path} key={hub.id} style={{ textDecoration: 'none' }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.03, y: -5 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${hub.color}30`,
                                    borderTop: `3px solid ${hub.color}`,
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '1.75rem' }}>{hub.icon}</span>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', color: hub.color, marginBottom: '0.1rem' }}>{hub.name}</h3>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{hub.description}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {hub.stats.map((stat, j) => (
                                        <div key={j}>
                                            <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>{stat.value}</p>
                                            <p style={{ color: '#666', fontSize: '0.6rem', textTransform: 'uppercase' }}>{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

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
