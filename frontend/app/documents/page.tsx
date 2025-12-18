'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Document {
    id: string
    name: string
    type: 'pdf' | 'doc' | 'sheet' | 'slide' | 'image'
    size: string
    modified: string
    owner: string
    shared: boolean
}

interface Folder {
    id: string
    name: string
    files: number
    color: string
}

interface RecentActivity {
    id: string
    action: 'created' | 'edited' | 'shared' | 'deleted'
    document: string
    user: string
    time: string
}

// Sample data
const DOCUMENTS: Document[] = [
    { id: '1', name: 'Q4 Strategy Report.pdf', type: 'pdf', size: '2.4 MB', modified: '2 hours ago', owner: 'CEO', shared: true },
    { id: '2', name: 'Product Roadmap 2025.doc', type: 'doc', size: '845 KB', modified: 'Yesterday', owner: 'CPO', shared: true },
    { id: '3', name: 'Financial Forecast.sheet', type: 'sheet', size: '1.2 MB', modified: '3 days ago', owner: 'CFO', shared: false },
    { id: '4', name: 'Investor Pitch Deck.slide', type: 'slide', size: '15.8 MB', modified: 'Last week', owner: 'CEO', shared: true },
    { id: '5', name: 'Team Photo 2024.image', type: 'image', size: '4.2 MB', modified: 'Last month', owner: 'HR', shared: true },
]

const FOLDERS: Folder[] = [
    { id: '1', name: 'Strategy', files: 24, color: '#ff0000' },
    { id: '2', name: 'Finance', files: 45, color: '#00ff41' },
    { id: '3', name: 'Marketing', files: 38, color: '#00bfff' },
    { id: '4', name: 'Engineering', files: 112, color: '#ffd700' },
    { id: '5', name: 'Legal', files: 28, color: '#8a2be2' },
]

const ACTIVITIES: RecentActivity[] = [
    { id: '1', action: 'edited', document: 'Q4 Strategy Report', user: 'CEO', time: '2 hours ago' },
    { id: '2', action: 'shared', document: 'Investor Pitch Deck', user: 'COO', time: '4 hours ago' },
    { id: '3', action: 'created', document: 'December Budget', user: 'CFO', time: 'Yesterday' },
]

const TYPE_ICONS: Record<string, string> = {
    pdf: '📕',
    doc: '📘',
    sheet: '📗',
    slide: '📙',
    image: '🖼️',
}

const ACTION_COLORS: Record<string, string> = {
    created: '#00ff41',
    edited: '#00bfff',
    shared: '#ffd700',
    deleted: '#ff0000',
}

export default function DocumentsHubPage() {
    const [documents] = useState(DOCUMENTS)
    const [folders] = useState(FOLDERS)
    const [activities] = useState(ACTIVITIES)

    const totalFiles = folders.reduce((sum, f) => sum + f.files, 0)
    const sharedDocs = documents.filter(d => d.shared).length
    const totalStorage = 24.1 // GB used

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '25%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(0,191,255,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#00bfff' }}>📄</span> Documents Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Files • Folders • Collaboration</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Files', value: totalFiles, color: '#00bfff' },
                        { label: 'Shared Docs', value: sharedDocs, color: '#ffd700' },
                        { label: 'Folders', value: folders.length, color: '#8a2be2' },
                        { label: 'Storage Used', value: `${totalStorage}GB`, color: '#00ff41' },
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
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem',
                }}>
                    {folders.map((folder, i) => (
                        <motion.div
                            key={folder.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${folder.color}40`,
                                borderTop: `3px solid ${folder.color}`,
                                borderRadius: '12px',
                                padding: '1.25rem',
                                textAlign: 'center',
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>📁</span>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>{folder.name}</p>
                            <p style={{ color: '#888', fontSize: '0.7rem' }}>{folder.files} files</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>📋 Recent Documents</h3>
                        {documents.map((doc, i) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{TYPE_ICONS[doc.type]}</span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{doc.name}</p>
                                    <p style={{ color: '#888', fontSize: '0.7rem' }}>{doc.size} • {doc.owner} • {doc.modified}</p>
                                </div>
                                {doc.shared && (
                                    <span style={{ color: '#00ff41', fontSize: '0.8rem' }}>🔗</span>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        borderTop: '3px solid #ffd700',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ffd700' }}>⚡ Recent Activity</h3>
                        {activities.map((activity, i) => (
                            <div
                                key={activity.id}
                                style={{
                                    padding: '0.75rem 0',
                                    borderBottom: i < activities.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                    <span style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: ACTION_COLORS[activity.action],
                                        marginTop: '0.25rem',
                                    }} />
                                    <div>
                                        <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                            <span style={{ color: ACTION_COLORS[activity.action] }}>{activity.action}</span> {activity.document}
                                        </p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{activity.user} • {activity.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Document Excellence
                </footer>
            </div>
        </div>
    )
}
