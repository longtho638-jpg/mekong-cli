'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Contact {
    id: string
    name: string
    outlet: string
    type: string
    beat: string
    status: 'active' | 'contacted' | 'covered'
}

interface PressRelease {
    id: string
    headline: string
    type: string
    status: 'draft' | 'distributed'
    coverage: number
    date: string
}

// Sample data
const CONTACTS: Contact[] = [
    { id: '1', name: 'Ngọc Anh', outlet: 'TechInAsia', type: 'journalist', beat: 'Startups, AI', status: 'covered' },
    { id: '2', name: 'Minh Tuấn', outlet: 'GDG Saigon', type: 'partner', beat: 'Developer events', status: 'contacted' },
    { id: '3', name: 'Thanh Hà', outlet: 'Viblo', type: 'blogger', beat: 'Developer tools', status: 'active' },
    { id: '4', name: 'Văn Khoa', outlet: 'VnExpress', type: 'journalist', beat: 'Technology', status: 'active' },
]

const RELEASES: PressRelease[] = [
    { id: 'PR-001', headline: 'Mekong-CLI Ra Mắt: Triển Khai Agency Trong 15 Phút', type: 'product_launch', status: 'distributed', coverage: 5, date: '2024-12-15' },
    { id: 'PR-002', headline: 'Hợp Tác với GDG Vietnam', type: 'partnership', status: 'distributed', coverage: 3, date: '2024-12-10' },
    { id: 'PR-003', headline: 'Mekong-CLI Đạt 1000 Users', type: 'milestone', status: 'draft', coverage: 0, date: '2024-12-20' },
]

const STATUS_COLORS = {
    active: '#888',
    contacted: '#ffd700',
    covered: '#00ff41',
    draft: '#888',
    distributed: '#00bfff',
}

export default function PRDashboard() {
    const [activeTab, setActiveTab] = useState<'contacts' | 'releases'>('contacts')

    const metrics = {
        contacts: CONTACTS.length,
        pitchesSent: 12,
        coverage: 8,
        responseRate: '33%',
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
                        <span style={{ color: '#9b59b6' }}>📰</span> PR Dashboard
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Public Relations & Media Outreach</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Media Contacts', value: metrics.contacts, color: '#fff' },
                        { label: 'Pitches Sent', value: metrics.pitchesSent, color: '#ffd700' },
                        { label: 'Coverage', value: metrics.coverage, color: '#00ff41' },
                        { label: 'Response Rate', value: metrics.responseRate, color: '#00bfff' },
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
                    {['contacts', 'releases'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'contacts' | 'releases')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: activeTab === tab ? 'rgba(155,89,182,0.2)' : 'transparent',
                                border: `1px solid ${activeTab === tab ? '#9b59b6' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '8px',
                                color: activeTab === tab ? '#9b59b6' : '#888',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                fontFamily: 'inherit',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}>
                    {activeTab === 'contacts' ? (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 2fr 1fr 2fr 1fr',
                                padding: '0.75rem 1rem',
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '0.75rem',
                                color: '#888',
                                textTransform: 'uppercase',
                            }}>
                                <span>Name</span>
                                <span>Outlet</span>
                                <span>Type</span>
                                <span>Beat</span>
                                <span>Status</span>
                            </div>

                            {CONTACTS.map((contact, i) => (
                                <motion.div
                                    key={contact.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 2fr 1fr 2fr 1fr',
                                        padding: '0.75rem 1rem',
                                        borderTop: '1px solid rgba(255,255,255,0.05)',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span>{contact.name}</span>
                                    <span style={{ color: '#9b59b6' }}>{contact.outlet}</span>
                                    <span style={{ color: '#888' }}>{contact.type}</span>
                                    <span style={{ color: '#888' }}>{contact.beat}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        background: `${STATUS_COLORS[contact.status]}20`,
                                        color: STATUS_COLORS[contact.status],
                                    }}>
                                        {contact.status}
                                    </span>
                                </motion.div>
                            ))}
                        </>
                    ) : (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
                                padding: '0.75rem 1rem',
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '0.75rem',
                                color: '#888',
                                textTransform: 'uppercase',
                            }}>
                                <span>Headline</span>
                                <span>Type</span>
                                <span>Status</span>
                                <span>Coverage</span>
                                <span>Date</span>
                            </div>

                            {RELEASES.map((release, i) => (
                                <motion.div
                                    key={release.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
                                        padding: '0.75rem 1rem',
                                        borderTop: '1px solid rgba(255,255,255,0.05)',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span>{release.headline.slice(0, 40)}...</span>
                                    <span style={{ color: '#888' }}>{release.type}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        background: `${STATUS_COLORS[release.status]}20`,
                                        color: STATUS_COLORS[release.status],
                                    }}>
                                        {release.status}
                                    </span>
                                    <span style={{ color: '#00ff41' }}>{release.coverage} articles</span>
                                    <span style={{ color: '#888' }}>{release.date}</span>
                                </motion.div>
                            ))}
                        </>
                    )}
                </div>

                {/* Boilerplate */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(155,89,182,0.05)',
                    border: '1px solid rgba(155,89,182,0.2)',
                    borderRadius: '12px',
                }}>
                    <h4 style={{ color: '#9b59b6', marginBottom: '1rem', fontSize: '0.9rem' }}>BOILERPLATE</h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        "Mekong-CLI là nền tảng mã nguồn mở đầu tiên giúp tự động hóa việc khởi tạo và vận hành Agency,
                        được xây dựng cho nền kinh tế Gig Economy."
                    </p>
                </div>
            </div>
        </div>
    )
}
