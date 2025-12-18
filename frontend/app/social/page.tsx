'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface SocialPostItem {
    id: string
    content: string
    platforms: ('twitter' | 'linkedin' | 'facebook' | 'instagram')[]
    scheduledTime: string
    status: 'draft' | 'scheduled' | 'published'
    engagement?: {
        likes: number
        shares: number
        comments: number
    }
}

interface InboxItem {
    id: string
    handle: string
    platform: 'twitter' | 'linkedin' | 'facebook'
    content: string
    sentiment: 'positive' | 'neutral' | 'negative'
    time: string
}

// Sample data
const POSTS: SocialPostItem[] = [
    {
        id: '1',
        content: 'Excited to announce the new Mekong CLI update! 🚀 #DevTools',
        platforms: ['twitter', 'linkedin'],
        scheduledTime: 'Today, 2:00 PM',
        status: 'scheduled'
    },
    {
        id: '2',
        content: '5 Tips for better PPC campaigns. Thread 🧵👇',
        platforms: ['twitter'],
        scheduledTime: 'Tomorrow, 9:00 AM',
        status: 'draft'
    },
    {
        id: '3',
        content: 'We just hit 10,000 users! Thank you all! 🎉',
        platforms: ['twitter', 'linkedin', 'facebook'],
        scheduledTime: 'Yesterday, 4:00 PM',
        status: 'published',
        engagement: { likes: 1250, shares: 340, comments: 85 }
    },
]

const INBOX: InboxItem[] = [
    { id: '1', handle: '@dev_guru', platform: 'twitter', content: 'Mekong CLI is awesome! Loved the new update.', sentiment: 'positive', time: '10m ago' },
    { id: '2', handle: '@recruiter_jane', platform: 'linkedin', content: 'Can you DM me about enterprise pricing?', sentiment: 'neutral', time: '1h ago' },
    { id: '3', handle: '@angry_user', platform: 'twitter', content: 'My build is broken. This sucks.', sentiment: 'negative', time: '2h ago' },
]

const PLATFORM_ICONS: Record<string, string> = {
    twitter: '🐦',
    linkedin: '💼',
    facebook: '📘',
    instagram: '📸',
}

const SENTIMENT_COLORS = {
    positive: '#00ff41',
    neutral: '#00bfff',
    negative: '#ff5f56',
}

export default function SocialMediaDashboard() {
    const [posts] = useState<SocialPostItem[]>(POSTS)
    const [inbox] = useState<InboxItem[]>(INBOX)

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
                        <span style={{ color: '#00bfff' }}>📱</span> Social Media Manager
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Content Calendar & Community</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>

                    {/* Content Calendar/Feed */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CONTENT FEED</h3>

                        {posts.map((post, i) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '1.25rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {post.platforms.map(p => (
                                            <span key={p} style={{ fontSize: '1rem' }}>{PLATFORM_ICONS[p]}</span>
                                        ))}
                                    </div>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: post.status === 'published' ? '#00ff41' : '#00bfff',
                                        border: `1px solid ${post.status === 'published' ? '#00ff41' : '#00bfff'}`,
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        {post.status.toUpperCase()}
                                    </span>
                                </div>

                                <p style={{ marginBottom: '1rem', lineHeight: '1.5', fontSize: '0.9rem' }}>{post.content}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>📅 {post.scheduledTime}</span>
                                    {post.engagement && (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <span style={{ color: '#ff5f56' }}>❤️ {post.engagement.likes}</span>
                                            <span style={{ color: '#00bfff' }}>💬 {post.engagement.comments}</span>
                                            <span style={{ color: '#ffd700' }}>🔄 {post.engagement.shares}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Unified Inbox */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#888' }}>UNIFIED INBOX</h3>
                            <span style={{ background: '#ff5f56', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>
                                {inbox.length} new
                            </span>
                        </div>

                        {inbox.map((msg, i) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    borderLeft: `3px solid ${SENTIMENT_COLORS[msg.sentiment]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>{PLATFORM_ICONS[msg.platform]}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{msg.handle}</span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{msg.time}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.75rem' }}>{msg.content}</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#fff',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                    }}>
                                        Reply
                                    </button>
                                    <button style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#fff',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                    }}>
                                        Ignore
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
