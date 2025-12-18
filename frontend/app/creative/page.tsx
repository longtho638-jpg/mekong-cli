'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface ConceptItem {
    id: string
    name: string
    campaign: string
    status: 'ideation' | 'review' | 'approved'
    ideas: number
    score: number
}

interface DesignItem {
    id: string
    name: string
    type: 'graphic' | 'video' | 'web' | 'animation'
    status: 'in_progress' | 'review' | 'delivered'
    revisions: number
    deliverables: number
}

// Sample data
const CONCEPTS: ConceptItem[] = [
    { id: '1', name: 'Summer Splash', campaign: 'Q3 Launch', status: 'approved', ideas: 5, score: 85 },
    { id: '2', name: 'Tech Forward', campaign: 'Product Update', status: 'review', ideas: 3, score: 0 },
    { id: '3', name: 'Holiday Magic', campaign: 'Q4 Season', status: 'ideation', ideas: 2, score: 0 },
]

const DESIGNS: DesignItem[] = [
    { id: '1', name: 'Summer Splash Video', type: 'video', status: 'delivered', revisions: 1, deliverables: 2 },
    { id: '2', name: 'Tech Banner Set', type: 'graphic', status: 'review', revisions: 0, deliverables: 0 },
    { id: '3', name: 'Landing Page', type: 'web', status: 'in_progress', revisions: 0, deliverables: 0 },
    { id: '4', name: 'Logo Animation', type: 'animation', status: 'in_progress', revisions: 0, deliverables: 0 },
]

const STATUS_COLORS = {
    ideation: '#888',
    review: '#ffd700',
    approved: '#00ff41',
    in_progress: '#00bfff',
    delivered: '#00ff41',
}

const TYPE_COLORS = {
    graphic: '#00bfff',
    video: '#ff5f56',
    web: '#00ff41',
    animation: '#9b59b6',
}

export default function CreativeDashboard() {
    const [concepts] = useState<ConceptItem[]>(CONCEPTS)
    const [designs] = useState<DesignItem[]>(DESIGNS)

    const approved = concepts.filter(c => c.status === 'approved').length
    const totalIdeas = concepts.reduce((sum, c) => sum + c.ideas, 0)
    const inProgress = designs.filter(d => d.status === 'in_progress').length
    const delivered = designs.filter(d => d.status === 'delivered').length

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#ffd700' }}>💡</span> Creative Strategist
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Concepts & Design Pipeline</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Approved Concepts', value: approved, color: '#00ff41' },
                        { label: 'Total Ideas', value: totalIdeas, color: '#00bfff' },
                        { label: 'In Progress', value: inProgress, color: '#ffd700' },
                        { label: 'Delivered', value: delivered, color: '#9b59b6' },
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
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Concepts */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CONCEPT BOARD</h3>

                        {concepts.map((concept, i) => (
                            <motion.div
                                key={concept.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[concept.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{concept.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{concept.campaign}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[concept.status]}20`,
                                        color: STATUS_COLORS[concept.status],
                                    }}>
                                        {concept.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>💡 {concept.ideas} ideas</span>
                                    {concept.score > 0 && <span style={{ color: '#00ff41' }}>⭐ {concept.score}</span>}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Design Pipeline */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>DESIGN PIPELINE</h3>

                        {designs.map((design, i) => (
                            <motion.div
                                key={design.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[design.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{design.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[design.type]}20`,
                                            color: TYPE_COLORS[design.type],
                                        }}>
                                            {design.type}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[design.status]}20`,
                                        color: STATUS_COLORS[design.status],
                                    }}>
                                        {design.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>🔄 {design.revisions} revisions</span>
                                    <span style={{ color: '#00bfff' }}>📦 {design.deliverables} files</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
