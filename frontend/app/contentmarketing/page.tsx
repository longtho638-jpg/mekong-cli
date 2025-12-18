'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface KeywordItem {
    id: string
    term: string
    volume: number
    rank: number
    change: number
    difficulty: 'easy' | 'medium' | 'hard'
}

interface ContentItem {
    id: string
    title: string
    format: 'blog' | 'video' | 'infographic'
    stage: 'ideation' | 'production' | 'published'
    traffic: number
    leads: number
    score: number
}

// Sample data
const KEYWORDS: KeywordItem[] = [
    { id: '1', term: 'content marketing', volume: 5000, rank: 5, change: 3, difficulty: 'medium' },
    { id: '2', term: 'seo tips', volume: 3000, rank: 3, change: 1, difficulty: 'easy' },
    { id: '3', term: 'marketing automation', volume: 8000, rank: 15, change: -2, difficulty: 'hard' },
    { id: '4', term: 'email marketing', volume: 6000, rank: 8, change: 5, difficulty: 'medium' },
]

const CONTENT: ContentItem[] = [
    { id: '1', title: 'Ultimate Guide to Content Marketing', format: 'blog', stage: 'published', traffic: 5000, leads: 150, score: 85 },
    { id: '2', title: 'Content Marketing Tutorial', format: 'video', stage: 'production', traffic: 0, leads: 0, score: 0 },
    { id: '3', title: 'SEO Infographic', format: 'infographic', stage: 'published', traffic: 2500, leads: 75, score: 78 },
]

const DIFFICULTY_COLORS = {
    easy: '#00ff41',
    medium: '#ffd700',
    hard: '#ff5f56',
}

const FORMAT_COLORS = {
    blog: '#00bfff',
    video: '#ff5f56',
    infographic: '#9b59b6',
}

const STAGE_COLORS = {
    ideation: '#888',
    production: '#ffd700',
    published: '#00ff41',
}

export default function ContentMarketingDashboard() {
    const [keywords] = useState<KeywordItem[]>(KEYWORDS)
    const [content] = useState<ContentItem[]>(CONTENT)

    const top10 = keywords.filter(k => k.rank <= 10).length
    const totalTraffic = content.reduce((sum, c) => sum + c.traffic, 0)
    const totalLeads = content.reduce((sum, c) => sum + c.leads, 0)
    const avgScore = content.filter(c => c.score > 0).reduce((sum, c) => sum + c.score, 0) / content.filter(c => c.score > 0).length || 0

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
                        <span style={{ color: '#00bfff' }}>📈</span> Content Marketing
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>SEO & Content Strategy</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Top 10 Keywords', value: top10, color: '#00ff41' },
                        { label: 'Total Traffic', value: totalTraffic.toLocaleString(), color: '#00bfff' },
                        { label: 'Leads', value: totalLeads, color: '#ffd700' },
                        { label: 'Avg Score', value: `${avgScore.toFixed(0)}`, color: '#9b59b6' },
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

                    {/* Keyword Rankings */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>KEYWORD RANKINGS</h3>

                        {keywords.map((kw, i) => (
                            <motion.div
                                key={kw.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${DIFFICULTY_COLORS[kw.difficulty]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{kw.term}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 'bold',
                                            color: kw.rank <= 10 ? '#00ff41' : '#ffd700'
                                        }}>
                                            #{kw.rank}
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: kw.change > 0 ? '#00ff41' : kw.change < 0 ? '#ff5f56' : '#888'
                                        }}>
                                            {kw.change > 0 ? `↑${kw.change}` : kw.change < 0 ? `↓${Math.abs(kw.change)}` : '−'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>Vol: {kw.volume.toLocaleString()}</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${DIFFICULTY_COLORS[kw.difficulty]}20`,
                                        color: DIFFICULTY_COLORS[kw.difficulty],
                                    }}>
                                        {kw.difficulty}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Content Performance */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CONTENT PERFORMANCE</h3>

                        {content.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${FORMAT_COLORS[item.format]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{item.title.slice(0, 30)}...</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${FORMAT_COLORS[item.format]}20`,
                                            color: FORMAT_COLORS[item.format],
                                        }}>
                                            {item.format}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STAGE_COLORS[item.stage]}20`,
                                        color: STAGE_COLORS[item.stage],
                                    }}>
                                        {item.stage}
                                    </span>
                                </div>
                                {item.stage === 'published' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#888' }}>👀 {item.traffic.toLocaleString()}</span>
                                        <span style={{ color: '#00ff41' }}>📈 {item.leads} leads</span>
                                        <span style={{ color: '#ffd700' }}>⭐ {item.score}</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
