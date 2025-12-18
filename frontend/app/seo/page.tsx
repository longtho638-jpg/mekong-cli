'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface KeywordItem {
    keyword: string
    volume: number
    difficulty: number
    rank: number | null
    change: number
}

interface IssueItem {
    id: string
    type: string
    url: string
    severity: 'critical' | 'warning' | 'info'
}

interface Vitals {
    lcp: number
    fid: number
    cls: number
}

// Sample data
const KEYWORDS: KeywordItem[] = [
    { keyword: 'marketing automation', volume: 22000, difficulty: 65, rank: 3, change: 2 },
    { keyword: 'crm software', volume: 40500, difficulty: 78, rank: 8, change: -1 },
    { keyword: 'lead generation tools', volume: 12000, difficulty: 45, rank: 5, change: 5 },
    { keyword: 'email marketing', volume: 33000, difficulty: 82, rank: 12, change: 0 },
]

const ISSUES: IssueItem[] = [
    { id: '1', type: 'broken_link', url: '/products/old-item', severity: 'critical' },
    { id: '2', type: 'missing_meta', url: '/blog/post-45', severity: 'warning' },
    { id: '3', type: 'slow_page', url: '/features', severity: 'warning' },
    { id: '4', type: 'missing_alt', url: '/about', severity: 'info' },
]

const VITALS: Vitals = { lcp: 2.1, fid: 85, cls: 0.08 }

const SEVERITY_COLORS = {
    critical: '#ff5f56',
    warning: '#ffd700',
    info: '#00bfff',
}

const getVitalStatus = (metric: string, value: number): { status: string; color: string } => {
    if (metric === 'lcp') {
        if (value <= 2.5) return { status: 'Good', color: '#00ff41' }
        if (value <= 4.0) return { status: 'Needs Work', color: '#ffd700' }
        return { status: 'Poor', color: '#ff5f56' }
    }
    if (metric === 'fid') {
        if (value <= 100) return { status: 'Good', color: '#00ff41' }
        if (value <= 300) return { status: 'Needs Work', color: '#ffd700' }
        return { status: 'Poor', color: '#ff5f56' }
    }
    if (metric === 'cls') {
        if (value <= 0.1) return { status: 'Good', color: '#00ff41' }
        if (value <= 0.25) return { status: 'Needs Work', color: '#ffd700' }
        return { status: 'Poor', color: '#ff5f56' }
    }
    return { status: 'Unknown', color: '#888' }
}

export default function SEODashboard() {
    const [keywords] = useState<KeywordItem[]>(KEYWORDS)
    const [issues] = useState<IssueItem[]>(ISSUES)
    const [vitals] = useState<Vitals>(VITALS)

    const healthScore = 100 - (issues.filter(i => i.severity === 'critical').length * 15) - (issues.filter(i => i.severity === 'warning').length * 5)
    const top10 = keywords.filter(k => k.rank && k.rank <= 10).length

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
                        <span style={{ color: '#00ff41' }}>🔍</span> SEO Dashboard
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Keywords, Rankings & Technical Health</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Health Score', value: `${healthScore}%`, color: healthScore >= 80 ? '#00ff41' : '#ffd700' },
                        { label: 'Top 10 Rankings', value: top10, color: '#00bfff' },
                        { label: 'Tracked Keywords', value: keywords.length, color: '#888' },
                        { label: 'Issues', value: issues.length, color: '#ff5f56' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Keywords & Rankings */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>KEYWORD RANKINGS</h3>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <thead>
                                <tr style={{ color: '#888', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Keyword</th>
                                    <th style={{ textAlign: 'right' }}>Volume</th>
                                    <th style={{ textAlign: 'right' }}>Diff</th>
                                    <th style={{ textAlign: 'right' }}>Rank</th>
                                    <th style={{ textAlign: 'right' }}>Δ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keywords.map((kw, i) => (
                                    <motion.tr
                                        key={kw.keyword}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                    >
                                        <td style={{ padding: '0.75rem 0' }}>{kw.keyword}</td>
                                        <td style={{ textAlign: 'right', color: '#888' }}>{kw.volume.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', color: kw.difficulty > 60 ? '#ff5f56' : '#00ff41' }}>{kw.difficulty}%</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>#{kw.rank}</td>
                                        <td style={{ textAlign: 'right', color: kw.change > 0 ? '#00ff41' : kw.change < 0 ? '#ff5f56' : '#888' }}>
                                            {kw.change > 0 ? `↑${kw.change}` : kw.change < 0 ? `↓${Math.abs(kw.change)}` : '→'}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Core Web Vitals */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>CORE WEB VITALS</h3>

                            {[
                                { name: 'LCP', value: vitals.lcp, unit: 's', metric: 'lcp' },
                                { name: 'FID', value: vitals.fid, unit: 'ms', metric: 'fid' },
                                { name: 'CLS', value: vitals.cls, unit: '', metric: 'cls' },
                            ].map((v, i) => {
                                const status = getVitalStatus(v.metric, v.value)
                                return (
                                    <div key={v.name} style={{ marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                            <span>{v.name}</span>
                                            <span style={{ color: status.color }}>{v.value}{v.unit} ({status.status})</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ width: '100%', height: '100%', background: status.color }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Issues */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            flex: 1,
                        }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>AUDIT ISSUES</h3>

                            {issues.map((issue, i) => (
                                <motion.div
                                    key={issue.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity]}`,
                                        padding: '0.5rem 0.75rem',
                                        marginBottom: '0.5rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '0 4px 4px 0',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{issue.type.replace('_', ' ')}</div>
                                    <div style={{ color: '#888' }}>{issue.url}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
