'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CopyItem {
    id: string
    name: string
    type: 'headline' | 'tagline' | 'cta' | 'email_subject'
    status: 'draft' | 'testing' | 'winner'
    variants: { id: string; text: string; ctr: number; cvr: number }[]
    winnerId?: string
}

interface VoiceCheck {
    id: string
    text: string
    score: 'excellent' | 'good' | 'needs_work'
    feedback: string
}

// Sample data
const COPIES: CopyItem[] = [
    {
        id: '1', name: 'Homepage Hero', type: 'headline', status: 'winner', winnerId: 'B',
        variants: [
            { id: 'A', text: 'Transform Your Business Today', ctr: 5.0, cvr: 10.0 },
            { id: 'B', text: 'Grow Your Business 10x Faster', ctr: 8.0, cvr: 15.0 },
            { id: 'C', text: 'The Future of Business Starts Here', ctr: 6.0, cvr: 13.3 },
        ]
    },
    {
        id: '2', name: 'CTA Button', type: 'cta', status: 'testing',
        variants: [
            { id: 'A', text: 'Get Started Free', ctr: 4.5, cvr: 8.5 },
            { id: 'B', text: 'Start Your Journey', ctr: 3.8, cvr: 7.2 },
        ]
    },
    {
        id: '3', name: 'Email Campaign', type: 'email_subject', status: 'draft',
        variants: [
            { id: 'A', text: 'Your exclusive offer awaits', ctr: 0, cvr: 0 },
        ]
    },
]

const CHECKS: VoiceCheck[] = [
    { id: '1', text: 'Transform your business with our solution', score: 'good', feedback: 'Aligns with brand voice' },
    { id: '2', text: 'BUY NOW!!! LIMITED OFFER!!!', score: 'needs_work', feedback: 'Too aggressive, avoid all caps' },
    { id: '3', text: 'We help you succeed, together.', score: 'excellent', feedback: 'Perfect brand tone' },
]

const TYPE_COLORS = {
    headline: '#00bfff',
    tagline: '#9b59b6',
    cta: '#00ff41',
    email_subject: '#ffd700',
}

const STATUS_COLORS = {
    draft: '#888',
    testing: '#ffd700',
    winner: '#00ff41',
}

const SCORE_COLORS = {
    excellent: '#00ff41',
    good: '#00bfff',
    needs_work: '#ff5f56',
}

export default function CopywriterDashboard() {
    const [copies] = useState<CopyItem[]>(COPIES)
    const [checks] = useState<VoiceCheck[]>(CHECKS)

    const winners = copies.filter(c => c.status === 'winner').length
    const testing = copies.filter(c => c.status === 'testing').length
    const totalVariants = copies.reduce((sum, c) => sum + c.variants.length, 0)
    const goodChecks = checks.filter(c => c.score === 'excellent' || c.score === 'good').length

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
                        <span style={{ color: '#ffd700' }}>✍️</span> Copywriter
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Copy & Brand Voice</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Winners', value: winners, color: '#00ff41' },
                        { label: 'Testing', value: testing, color: '#ffd700' },
                        { label: 'Variants', value: totalVariants, color: '#00bfff' },
                        { label: 'Voice Score', value: `${Math.round(goodChecks / checks.length * 100)}%`, color: '#9b59b6' },
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

                    {/* Copy Library */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>A/B TESTING</h3>

                        {copies.map((copy, i) => (
                            <motion.div
                                key={copy.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[copy.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{copy.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[copy.type]}20`,
                                            color: TYPE_COLORS[copy.type],
                                        }}>
                                            {copy.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[copy.status]}20`,
                                        color: STATUS_COLORS[copy.status],
                                    }}>
                                        {copy.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                    {copy.variants.map(v => (
                                        <div key={v.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.25rem 0',
                                            borderLeft: copy.winnerId === v.id ? '2px solid #00ff41' : '2px solid transparent',
                                            paddingLeft: '0.5rem',
                                            marginBottom: '0.25rem',
                                        }}>
                                            <span style={{ color: copy.winnerId === v.id ? '#fff' : '#888' }}>{v.id}: {v.text.slice(0, 25)}...</span>
                                            <span style={{ color: '#00bfff' }}>{v.cvr.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Voice Checks */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>BRAND VOICE CHECKS</h3>

                        {checks.map((check, i) => (
                            <motion.div
                                key={check.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${SCORE_COLORS[check.score]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem' }}>"{check.text.slice(0, 30)}..."</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${SCORE_COLORS[check.score]}20`,
                                        color: SCORE_COLORS[check.score],
                                    }}>
                                        {check.score.replace('_', ' ')}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#888' }}>{check.feedback}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
