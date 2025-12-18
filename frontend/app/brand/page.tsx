'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface BrandColors {
    primary: string
    secondary: string
    accent: string
}

interface AssetItem {
    id: string
    name: string
    type: 'logo' | 'icon' | 'image' | 'template'
    status: 'draft' | 'approved'
    usage: number
    version: string
}

// Sample data
const BRAND_COLORS: BrandColors = {
    primary: '#00ff41',
    secondary: '#00bfff',
    accent: '#ffd700',
}

const ASSETS: AssetItem[] = [
    { id: '1', name: 'Primary Logo', type: 'logo', status: 'approved', usage: 50, version: '2.0' },
    { id: '2', name: 'Icon Set', type: 'icon', status: 'approved', usage: 120, version: '1.5' },
    { id: '3', name: 'Email Template', type: 'template', status: 'approved', usage: 35, version: '1.2' },
    { id: '4', name: 'Product Hero', type: 'image', status: 'draft', usage: 0, version: '1.0' },
]

const TYPE_COLORS = {
    logo: '#00ff41',
    icon: '#00bfff',
    image: '#ffd700',
    template: '#9b59b6',
}

const STATUS_COLORS = {
    draft: '#888',
    approved: '#00ff41',
}

export default function BrandDashboard() {
    const [assets] = useState<AssetItem[]>(ASSETS)
    const brandHealth = 85

    const totalAssets = assets.length
    const approved = assets.filter(a => a.status === 'approved').length
    const totalUsage = assets.reduce((sum, a) => sum + a.usage, 0)

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
                        <span style={{ color: '#ffd700' }}>🎨</span> Brand Manager
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Identity & Assets</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Brand Health', value: `${brandHealth}%`, color: '#00ff41' },
                        { label: 'Total Assets', value: totalAssets, color: '#00bfff' },
                        { label: 'Approved', value: approved, color: '#ffd700' },
                        { label: 'Total Usage', value: totalUsage, color: '#9b59b6' },
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

                    {/* Brand Identity */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>BRAND IDENTITY</h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.75rem' }}>COLOR PALETTE</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {Object.entries(BRAND_COLORS).map(([name, color]) => (
                                    <motion.div
                                        key={name}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: '8px',
                                            background: color,
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            padding: '0.25rem',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.5rem', color: '#000', background: 'rgba(255,255,255,0.9)', padding: '2px 4px', borderRadius: '2px' }}>
                                            {name}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem' }}>TYPOGRAPHY</p>
                            <div style={{ fontSize: '0.8rem' }}>
                                <p style={{ marginBottom: '0.25rem' }}>Headings: <span style={{ color: '#00bfff' }}>JetBrains Mono</span></p>
                                <p style={{ marginBottom: '0.25rem' }}>Body: <span style={{ color: '#00bfff' }}>Inter</span></p>
                                <p>Display: <span style={{ color: '#00bfff' }}>Outfit</span></p>
                            </div>
                        </div>

                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem' }}>TONE OF VOICE</p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['Professional', 'Approachable', 'Innovative'].map(trait => (
                                    <span key={trait} style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        background: 'rgba(0,255,65,0.1)',
                                        color: '#00ff41',
                                    }}>
                                        {trait}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Asset Library */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>ASSET LIBRARY</h3>

                        {assets.map((asset, i) => (
                            <motion.div
                                key={asset.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[asset.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{asset.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[asset.type]}20`,
                                            color: TYPE_COLORS[asset.type],
                                        }}>
                                            {asset.type}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[asset.status]}20`,
                                        color: STATUS_COLORS[asset.status],
                                    }}>
                                        {asset.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>v{asset.version}</span>
                                    <span style={{ color: '#00bfff' }}>📥 {asset.usage} uses</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
