'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Asset {
    id: string
    name: string
    type: 'image' | 'video' | 'audio'
    thumbnail: string
    tags: string[]
    usage: number
    size: string
}

interface Channel {
    id: string
    name: string
    type: string
    followers: number
    posts: number
    status: 'connected' | 'disconnected'
}

// Sample data
const ASSETS: Asset[] = [
    { id: '1', name: 'hero_banner.jpg', type: 'image', thumbnail: '🖼️', tags: ['landing', 'hero'], usage: 24, size: '500 KB' },
    { id: '2', name: 'demo_video.mp4', type: 'video', thumbnail: '🎬', tags: ['demo', 'tutorial'], usage: 156, size: '25 MB' },
    { id: '3', name: 'logo_dark.png', type: 'image', thumbnail: '🖼️', tags: ['brand', 'logo'], usage: 89, size: '120 KB' },
    { id: '4', name: 'podcast_ep1.mp3', type: 'audio', thumbnail: '🎧', tags: ['podcast', 'audio'], usage: 12, size: '45 MB' },
    { id: '5', name: 'feature_intro.mp4', type: 'video', thumbnail: '🎬', tags: ['feature', 'promo'], usage: 67, size: '18 MB' },
    { id: '6', name: 'team_photo.jpg', type: 'image', thumbnail: '🖼️', tags: ['team', 'about'], usage: 8, size: '2 MB' },
]

const CHANNELS: Channel[] = [
    { id: '1', name: 'Mekong CLI', type: 'facebook', followers: 5000, posts: 45, status: 'connected' },
    { id: '2', name: 'Mekong CLI', type: 'youtube', followers: 2000, posts: 23, status: 'connected' },
    { id: '3', name: 'Mekong OA', type: 'zalo', followers: 10000, posts: 67, status: 'connected' },
    { id: '4', name: '@mekongcli', type: 'tiktok', followers: 8500, posts: 89, status: 'connected' },
    { id: '5', name: 'Mekong Bot', type: 'telegram', followers: 1200, posts: 34, status: 'disconnected' },
]

const CHANNEL_ICONS: Record<string, string> = {
    facebook: '📘',
    youtube: '📺',
    zalo: '💬',
    tiktok: '🎵',
    telegram: '✈️',
}

export default function MediaDashboard() {
    const [activeTab, setActiveTab] = useState<'library' | 'channels'>('library')

    const metrics = {
        assets: ASSETS.length,
        channels: CHANNELS.filter(c => c.status === 'connected').length,
        reach: CHANNELS.reduce((sum, c) => sum + c.followers, 0),
        publications: CHANNELS.reduce((sum, c) => sum + c.posts, 0),
    }

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
                        <span style={{ color: '#e74c3c' }}>📺</span> Media Center
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Content Library & Channel Management</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Assets', value: metrics.assets, color: '#fff' },
                        { label: 'Channels', value: `${metrics.channels}/5`, color: '#00ff41' },
                        { label: 'Total Reach', value: `${(metrics.reach / 1000).toFixed(1)}K`, color: '#00bfff' },
                        { label: 'Publications', value: metrics.publications, color: '#ffd700' },
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

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    {['library', 'channels'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'library' | 'channels')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: activeTab === tab ? 'rgba(231,76,60,0.2)' : 'transparent',
                                border: `1px solid ${activeTab === tab ? '#e74c3c' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '8px',
                                color: activeTab === tab ? '#e74c3c' : '#888',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                fontFamily: 'inherit',
                            }}
                        >
                            {tab === 'library' ? '📚 Library' : '📺 Channels'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'library' ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                    }}>
                        {ASSETS.map((asset, i) => (
                            <motion.div
                                key={asset.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                }}
                            >
                                {/* Thumbnail */}
                                <div style={{
                                    height: 100,
                                    background: 'rgba(255,255,255,0.03)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                }}>
                                    {asset.thumbnail}
                                </div>

                                {/* Info */}
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {asset.name}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                        {asset.tags.map(tag => (
                                            <span key={tag} style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.65rem',
                                                background: 'rgba(231,76,60,0.1)',
                                                color: '#e74c3c',
                                            }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.75rem' }}>
                                        <span>{asset.size}</span>
                                        <span>Used: {asset.usage}x</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1rem',
                    }}>
                        {CHANNELS.map((channel, i) => (
                            <motion.div
                                key={channel.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${channel.status === 'connected' ? 'rgba(0,255,65,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '2rem' }}>{CHANNEL_ICONS[channel.type]}</span>
                                    <div>
                                        <p style={{ fontSize: '1rem', fontWeight: 600 }}>{channel.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.8rem' }}>{channel.type}</p>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00bfff' }}>
                                        {(channel.followers / 1000).toFixed(1)}K
                                    </p>
                                    <p style={{ color: '#888', fontSize: '0.75rem' }}>{channel.posts} posts</p>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: channel.status === 'connected' ? 'rgba(0,255,65,0.1)' : 'rgba(255,255,255,0.05)',
                                        color: channel.status === 'connected' ? '#00ff41' : '#888',
                                    }}>
                                        {channel.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
