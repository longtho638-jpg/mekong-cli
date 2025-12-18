'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface ContentItem {
    id: string
    title: string
    type: 'whitepaper' | 'report' | 'guide' | 'ebook'
    topic: string
    downloads: number
    leads: number
    status: 'draft' | 'published'
}

interface CaseStudyItem {
    id: string
    customer: string
    industry: string
    title: string
    roiMetrics: number
    views: number
    status: 'draft' | 'published'
}

// Sample data
const CONTENT: ContentItem[] = [
    { id: '1', title: '2024 State of B2B Marketing', type: 'report', topic: 'Marketing Trends', downloads: 850, leads: 620, status: 'published' },
    { id: '2', title: 'Ultimate Guide to ABM', type: 'guide', topic: 'ABM', downloads: 520, leads: 380, status: 'published' },
    { id: '3', title: 'Enterprise Automation Playbook', type: 'ebook', topic: 'Automation', downloads: 0, leads: 0, status: 'draft' },
]

const CASE_STUDIES: CaseStudyItem[] = [
    { id: '1', customer: 'Acme Corp', industry: 'Technology', title: 'How Acme Increased Revenue 3x', roiMetrics: 3, views: 450, status: 'published' },
    { id: '2', customer: 'GlobalTech', industry: 'SaaS', title: 'GlobalTech Saves 20hrs/week', roiMetrics: 4, views: 320, status: 'published' },
    { id: '3', customer: 'Enterprise Inc', industry: 'Enterprise', title: 'Enterprise Inc Case Study', roiMetrics: 2, views: 0, status: 'draft' },
]

const TYPE_COLORS = {
    whitepaper: '#ff5f56',
    report: '#00bfff',
    guide: '#00ff41',
    ebook: '#9b59b6',
}

const STATUS_COLORS = {
    draft: '#888',
    published: '#00ff41',
}

export default function B2BContentDashboard() {
    const [content] = useState<ContentItem[]>(CONTENT)
    const [caseStudies] = useState<CaseStudyItem[]>(CASE_STUDIES)

    const totalDownloads = content.reduce((sum, c) => sum + c.downloads, 0)
    const totalLeads = content.reduce((sum, c) => sum + c.leads, 0)
    const publishedCS = caseStudies.filter(cs => cs.status === 'published').length
    const totalViews = caseStudies.reduce((sum, cs) => sum + cs.views, 0)

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
                        <span style={{ color: '#00bfff' }}>📚</span> B2B Content Hub
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Thought Leadership & Case Studies</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Downloads', value: totalDownloads.toLocaleString(), color: '#00bfff' },
                        { label: 'Leads Generated', value: totalLeads.toLocaleString(), color: '#00ff41' },
                        { label: 'Case Studies', value: publishedCS, color: '#ffd700' },
                        { label: 'Case Views', value: totalViews, color: '#9b59b6' },
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

                    {/* Content Library */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CONTENT LIBRARY</h3>

                        {content.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[item.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.title}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${TYPE_COLORS[item.type]}20`,
                                        color: TYPE_COLORS[item.type],
                                    }}>
                                        {item.type}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>{item.topic}</span>
                                    <span style={{ color: '#00bfff' }}>📥 {item.downloads}</span>
                                    <span style={{ color: '#00ff41' }}>🎯 {item.leads} leads</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Case Studies */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CASE STUDIES</h3>

                        {caseStudies.map((cs, i) => (
                            <motion.div
                                key={cs.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[cs.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{cs.customer}</span>
                                        <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{cs.industry}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[cs.status]}20`,
                                        color: STATUS_COLORS[cs.status],
                                    }}>
                                        {cs.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#00bfff', marginBottom: '0.5rem' }}>{cs.title}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>📊 {cs.roiMetrics} ROI metrics</span>
                                    <span style={{ color: '#ffd700' }}>👁️ {cs.views} views</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
