'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface ContentItem {
    id: string
    title: string
    type: 'blog' | 'video' | 'social' | 'email'
    status: 'idea' | 'draft' | 'in_review' | 'approved' | 'published'
    author: string
    version: number
}

interface ScheduledItem {
    id: string
    title: string
    platform: 'linkedin' | 'twitter' | 'youtube' | 'facebook' | 'website'
    scheduledAt: string
    status: 'scheduled' | 'published'
    engagement: number
}

// Sample data
const CONTENT: ContentItem[] = [
    { id: '1', title: '10 Tips for Productivity', type: 'blog', status: 'approved', author: 'Nguyen A', version: 3 },
    { id: '2', title: 'Product Demo Video', type: 'video', status: 'in_review', author: 'Tran B', version: 1 },
    { id: '3', title: 'Weekly Newsletter', type: 'email', status: 'draft', author: 'Le C', version: 2 },
    { id: '4', title: 'Feature Announcement', type: 'social', status: 'idea', author: 'Pham D', version: 1 },
]

const SCHEDULED: ScheduledItem[] = [
    { id: '1', title: '10 Tips for Productivity', platform: 'linkedin', scheduledAt: 'Today 2:00 PM', status: 'published', engagement: 2450 },
    { id: '2', title: '10 Tips for Productivity', platform: 'twitter', scheduledAt: 'Today 3:00 PM', status: 'published', engagement: 890 },
    { id: '3', title: 'Product Demo', platform: 'youtube', scheduledAt: 'Tomorrow 10:00 AM', status: 'scheduled', engagement: 0 },
    { id: '4', title: 'Feature Announcement', platform: 'facebook', scheduledAt: 'Dec 18, 9:00 AM', status: 'scheduled', engagement: 0 },
]

const TYPE_COLORS = {
    blog: '#00bfff',
    video: '#ff5f56',
    social: '#9b59b6',
    email: '#ffd700',
}

const STATUS_COLORS = {
    idea: '#888',
    draft: '#ffd700',
    in_review: '#00bfff',
    approved: '#00ff41',
    published: '#9b59b6',
    scheduled: '#ffd700',
}

const PLATFORM_COLORS = {
    linkedin: '#0077b5',
    twitter: '#1da1f2',
    youtube: '#ff0000',
    facebook: '#1877f2',
    website: '#00ff41',
}

export default function ContentDashboard() {
    const [content] = useState<ContentItem[]>(CONTENT)
    const [scheduled] = useState<ScheduledItem[]>(SCHEDULED)

    const published = scheduled.filter(s => s.status === 'published').length
    const totalEngagement = scheduled.reduce((sum, s) => sum + s.engagement, 0)
    const drafts = content.filter(c => c.status === 'draft').length
    const pending = scheduled.filter(s => s.status === 'scheduled').length

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
                        <span style={{ color: '#9b59b6' }}>🎨</span> Content Creator
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Content & Publishing</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Published', value: published, color: '#00ff41' },
                        { label: 'Engagement', value: totalEngagement.toLocaleString(), color: '#00bfff' },
                        { label: 'Drafts', value: drafts, color: '#ffd700' },
                        { label: 'Scheduled', value: pending, color: '#9b59b6' },
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

                    {/* Content Pipeline */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CONTENT PIPELINE</h3>

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
                                        <span style={{ fontWeight: 600 }}>{item.title}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[item.type]}20`,
                                            color: TYPE_COLORS[item.type],
                                        }}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[item.status]}20`,
                                        color: STATUS_COLORS[item.status],
                                    }}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                    👤 {item.author} • v{item.version}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Publishing Calendar */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>PUBLISHING CALENDAR</h3>

                        {scheduled.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${PLATFORM_COLORS[item.platform]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{item.title}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${PLATFORM_COLORS[item.platform]}20`,
                                        color: PLATFORM_COLORS[item.platform],
                                    }}>
                                        {item.platform}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>📅 {item.scheduledAt}</span>
                                    {item.status === 'published' ? (
                                        <span style={{ color: '#00ff41' }}>📈 {item.engagement.toLocaleString()}</span>
                                    ) : (
                                        <span style={{ color: '#ffd700' }}>⏳ scheduled</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
