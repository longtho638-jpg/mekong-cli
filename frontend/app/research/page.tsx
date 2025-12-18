'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface StudyItem {
    id: string
    title: string
    type: 'survey' | 'focus_group' | 'market_sizing'
    status: 'planning' | 'in_progress' | 'completed'
    respondents: number
    target: number
    insights: number
}

interface CompetitorItem {
    id: string
    name: string
    threat: 'low' | 'medium' | 'high' | 'critical'
    marketShare: number
    strengths: number
    weaknesses: number
}

// Sample data
const STUDIES: StudyItem[] = [
    { id: '1', title: 'Customer Satisfaction Survey', type: 'survey', status: 'completed', respondents: 500, target: 500, insights: 5 },
    { id: '2', title: 'Market Size Analysis', type: 'market_sizing', status: 'in_progress', respondents: 35, target: 50, insights: 2 },
    { id: '3', title: 'User Interviews', type: 'focus_group', status: 'planning', respondents: 0, target: 20, insights: 0 },
]

const COMPETITORS: CompetitorItem[] = [
    { id: '1', name: 'CompetitorA', threat: 'high', marketShare: 25, strengths: 3, weaknesses: 2 },
    { id: '2', name: 'CompetitorB', threat: 'medium', marketShare: 15, strengths: 2, weaknesses: 3 },
    { id: '3', name: 'CompetitorC', threat: 'low', marketShare: 8, strengths: 1, weaknesses: 4 },
    { id: '4', name: 'NewEntry', threat: 'critical', marketShare: 5, strengths: 4, weaknesses: 1 },
]

const TYPE_COLORS = {
    survey: '#00bfff',
    focus_group: '#9b59b6',
    market_sizing: '#ffd700',
}

const STATUS_COLORS = {
    planning: '#888',
    in_progress: '#ffd700',
    completed: '#00ff41',
}

const THREAT_COLORS = {
    low: '#00ff41',
    medium: '#ffd700',
    high: '#ff8c00',
    critical: '#ff5f56',
}

export default function ResearchDashboard() {
    const [studies] = useState<StudyItem[]>(STUDIES)
    const [competitors] = useState<CompetitorItem[]>(COMPETITORS)

    const completed = studies.filter(s => s.status === 'completed').length
    const totalInsights = studies.reduce((sum, s) => sum + s.insights, 0)
    const highThreats = competitors.filter(c => c.threat === 'high' || c.threat === 'critical').length
    const totalMarketShare = competitors.reduce((sum, c) => sum + c.marketShare, 0)

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
                        <span style={{ color: '#00bfff' }}>🔍</span> Market Research
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Studies & Competitive Analysis</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Completed', value: completed, color: '#00ff41' },
                        { label: 'Insights', value: totalInsights, color: '#00bfff' },
                        { label: 'High Threats', value: highThreats, color: '#ff5f56' },
                        { label: 'Competitor Share', value: `${totalMarketShare}%`, color: '#ffd700' },
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

                    {/* Research Studies */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>RESEARCH STUDIES</h3>

                        {studies.map((study, i) => (
                            <motion.div
                                key={study.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[study.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{study.title}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[study.type]}20`,
                                            color: TYPE_COLORS[study.type],
                                        }}>
                                            {study.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[study.status]}20`,
                                        color: STATUS_COLORS[study.status],
                                    }}>
                                        {study.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888' }}>Responses</span>
                                        <span style={{ color: '#00bfff' }}>{study.respondents}/{study.target}</span>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(study.respondents / study.target) * 100}%`,
                                            background: '#00ff41',
                                            borderRadius: 2,
                                        }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>💡 {study.insights} insights</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Competitors */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>COMPETITOR MATRIX</h3>

                        {competitors.map((comp, i) => (
                            <motion.div
                                key={comp.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${THREAT_COLORS[comp.threat]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{comp.name}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${THREAT_COLORS[comp.threat]}20`,
                                        color: THREAT_COLORS[comp.threat],
                                    }}>
                                        {comp.threat}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>📊 {comp.marketShare}% share</span>
                                    <div>
                                        <span style={{ color: '#00ff41' }}>S:{comp.strengths}</span>
                                        <span style={{ color: '#ff5f56', marginLeft: '0.5rem' }}>W:{comp.weaknesses}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
