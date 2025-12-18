'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Product {
    id: string
    name: string
    version: string
    status: 'live' | 'beta' | 'development' | 'deprecated'
    users: number
    revenue: number
    nps: number
}

interface Feature {
    id: string
    name: string
    product: string
    status: 'shipped' | 'in_progress' | 'planned' | 'blocked'
    priority: 'p0' | 'p1' | 'p2'
    dueDate: string
}

interface Roadmap {
    id: string
    quarter: string
    theme: string
    progress: number
    items: number
}

// Sample data
const PRODUCTS: Product[] = [
    { id: '1', name: 'AgencyOS Core', version: '2.0.0', status: 'live', users: 1250, revenue: 85000, nps: 72 },
    { id: '2', name: 'Binh Pháp Strategy', version: '1.5.0', status: 'live', users: 450, revenue: 22000, nps: 85 },
    { id: '3', name: 'Mekong CLI', version: '0.9.0', status: 'beta', users: 120, revenue: 0, nps: 68 },
    { id: '4', name: 'Shield Calculator', version: '1.0.0', status: 'live', users: 380, revenue: 8000, nps: 78 },
]

const FEATURES: Feature[] = [
    { id: '1', name: 'AI Agent Orchestration', product: 'AgencyOS', status: 'in_progress', priority: 'p0', dueDate: 'Dec 2024' },
    { id: '2', name: 'Multi-tenant Support', product: 'AgencyOS', status: 'shipped', priority: 'p0', dueDate: 'Shipped' },
    { id: '3', name: 'Real-time Collaboration', product: 'AgencyOS', status: 'planned', priority: 'p1', dueDate: 'Q1 2025' },
    { id: '4', name: 'Mobile App', product: 'AgencyOS', status: 'planned', priority: 'p2', dueDate: 'Q2 2025' },
]

const ROADMAP: Roadmap[] = [
    { id: '1', quarter: 'Q4 2024', theme: 'AI Foundation', progress: 85, items: 12 },
    { id: '2', quarter: 'Q1 2025', theme: 'Scale & Growth', progress: 25, items: 8 },
    { id: '3', quarter: 'Q2 2025', theme: 'Mobile & API', progress: 0, items: 6 },
]

const STATUS_COLORS: Record<string, string> = {
    live: '#00ff41',
    beta: '#ffd700',
    development: '#00bfff',
    deprecated: '#888',
    shipped: '#00ff41',
    in_progress: '#00bfff',
    planned: '#ffd700',
    blocked: '#ff0000',
}

const PRIORITY_COLORS: Record<string, string> = {
    p0: '#ff0000',
    p1: '#ffd700',
    p2: '#00bfff',
}

export default function ProductHubPage() {
    const [products] = useState(PRODUCTS)
    const [features] = useState(FEATURES)
    const [roadmap] = useState(ROADMAP)

    // Metrics
    const totalUsers = products.reduce((sum, p) => sum + p.users, 0)
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
    const avgNPS = (products.reduce((sum, p) => sum + p.nps, 0) / products.length).toFixed(0)
    const liveProducts = products.filter(p => p.status === 'live').length

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            {/* Ambient */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '40%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(0,191,255,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#00bfff' }}>🚀</span> Product Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Products • Features • Roadmap</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Users', value: totalUsers.toLocaleString(), color: '#00ff41' },
                        { label: 'MRR', value: `$${(totalRevenue / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Avg NPS', value: avgNPS, color: '#ffd700' },
                        { label: 'Live Products', value: liveProducts, color: '#8a2be2' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Products Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem',
                }}>
                    {products.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${STATUS_COLORS[product.status]}30`,
                                borderTop: `3px solid ${STATUS_COLORS[product.status]}`,
                                borderRadius: '12px',
                                padding: '1.25rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{product.name}</p>
                                    <p style={{ color: '#888', fontSize: '0.7rem' }}>v{product.version}</p>
                                </div>
                                <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    fontSize: '0.6rem',
                                    background: `${STATUS_COLORS[product.status]}20`,
                                    color: STATUS_COLORS[product.status],
                                }}>
                                    {product.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span>👥 {product.users}</span>
                                <span style={{ color: '#00ff41' }}>${(product.revenue / 1000).toFixed(0)}K</span>
                                <span style={{ color: product.nps >= 70 ? '#00ff41' : '#ffd700' }}>NPS {product.nps}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Features */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>🎯 Feature Backlog</h3>

                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STATUS_COLORS[feature.status]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{feature.name}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '1px 4px',
                                            borderRadius: '4px',
                                            fontSize: '0.55rem',
                                            background: `${PRIORITY_COLORS[feature.priority]}20`,
                                            color: PRIORITY_COLORS[feature.priority],
                                        }}>
                                            {feature.priority}
                                        </span>
                                        <span style={{ color: '#888', fontSize: '0.65rem' }}>{feature.dueDate}</span>
                                    </div>
                                </div>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.65rem',
                                    background: `${STATUS_COLORS[feature.status]}20`,
                                    color: STATUS_COLORS[feature.status],
                                }}>
                                    {feature.status.replace('_', ' ')}
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Roadmap */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        borderTop: '3px solid #ffd700',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ffd700' }}>🗓️ Roadmap</h3>

                        {roadmap.map((item, i) => (
                            <div key={item.id} style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.quarter}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{item.theme}</p>
                                    </div>
                                    <span style={{ color: '#888', fontSize: '0.7rem' }}>{item.items} items</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${item.progress}%`,
                                            height: '100%',
                                            background: item.progress >= 70 ? '#00ff41' : item.progress >= 30 ? '#ffd700' : '#00bfff',
                                            borderRadius: 4,
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#fff' }}>{item.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Product Excellence
                </footer>
            </div>
        </div>
    )
}
