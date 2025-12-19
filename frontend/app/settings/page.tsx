'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Setting {
    id: string
    name: string
    description: string
    type: 'toggle' | 'select' | 'input'
    value: boolean | string
    category: string
}

interface Integration {
    id: string
    name: string
    icon: string
    status: 'connected' | 'disconnected'
    lastSync: string
}

interface TeamMember {
    id: string
    name: string
    email: string
    role: 'admin' | 'editor' | 'viewer'
    status: 'active' | 'invited'
}

// Sample data
const SETTINGS: Setting[] = [
    { id: '1', name: 'Dark Mode', description: 'Use dark theme across all hubs', type: 'toggle', value: true, category: 'Appearance' },
    { id: '2', name: 'Email Notifications', description: 'Receive email alerts for important events', type: 'toggle', value: true, category: 'Notifications' },
    { id: '3', name: 'Two-Factor Auth', description: 'Enable 2FA for enhanced security', type: 'toggle', value: true, category: 'Security' },
    { id: '4', name: 'Auto-save', description: 'Automatically save changes', type: 'toggle', value: true, category: 'General' },
    { id: '5', name: 'Language', description: 'Interface language', type: 'select', value: 'English', category: 'General' },
]

const INTEGRATIONS: Integration[] = [
    { id: '1', name: 'Google Workspace', icon: '🔷', status: 'connected', lastSync: '5 min ago' },
    { id: '2', name: 'Slack', icon: '💬', status: 'connected', lastSync: '2 hours ago' },
    { id: '3', name: 'GitHub', icon: '🐙', status: 'connected', lastSync: '1 hour ago' },
    { id: '4', name: 'Stripe', icon: '💳', status: 'connected', lastSync: 'Yesterday' },
    { id: '5', name: 'Notion', icon: '📝', status: 'disconnected', lastSync: 'Never' },
]

const TEAM: TeamMember[] = [
    { id: '1', name: 'Nguyen Anh', email: 'anh@agencyos.vn', role: 'admin', status: 'active' },
    { id: '2', name: 'Tran Binh', email: 'binh@agencyos.vn', role: 'editor', status: 'active' },
    { id: '3', name: 'Le Chi', email: 'chi@agencyos.vn', role: 'viewer', status: 'active' },
    { id: '4', name: 'Pham Dung', email: 'dung@agencyos.vn', role: 'editor', status: 'invited' },
]

const STATUS_COLORS: Record<string, string> = {
    connected: '#00ff41',
    disconnected: '#888',
    active: '#00ff41',
    invited: '#ffd700',
}

const ROLE_COLORS: Record<string, string> = {
    admin: '#ff0000',
    editor: '#00bfff',
    viewer: '#888',
}

export default function SettingsHubPage() {
    const [settings, setSettings] = useState(SETTINGS)
    const [integrations] = useState(INTEGRATIONS)
    const [team] = useState(TEAM)

    const connectedIntegrations = integrations.filter(i => i.status === 'connected').length
    const activeMembers = team.filter(t => t.status === 'active').length

    const toggleSetting = (id: string) => {
        setSettings(settings.map(s =>
            s.id === id && s.type === 'toggle' ? { ...s, value: !s.value } : s
        ))
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary, #050505)',
            color: 'var(--text-primary, #fff)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
            transition: 'background 0.3s ease, color 0.3s ease',
        }}>
            <div style={{
                position: 'fixed',
                top: '-20%',
                right: '30%',
                width: '40%',
                height: '40%',
                background: 'var(--glow-primary, radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 60%))',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#8a2be2' }}>⚙️</span> Settings Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Configuration • Integrations • Team</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Integrations', value: `${connectedIntegrations}/${integrations.length}`, color: '#00ff41' },
                        { label: 'Team Members', value: activeMembers, color: '#00bfff' },
                        { label: 'Settings', value: settings.length, color: '#8a2be2' },
                        { label: 'Plan', value: 'Enterprise', color: '#ffd700' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'var(--bg-card, rgba(255,255,255,0.02))',
                                border: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                textAlign: 'center',
                                transition: 'background 0.3s ease, border-color 0.3s ease',
                            }}
                        >
                            <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div style={{
                        background: 'var(--bg-card, rgba(255,255,255,0.02))',
                        border: '1px solid rgba(138,43,226,0.2)',
                        borderTop: '3px solid #8a2be2',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        transition: 'background 0.3s ease',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#8a2be2' }}>🎛️ Preferences</h3>
                        {settings.map((setting, i) => (
                            <motion.div
                                key={setting.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 0',
                                    borderBottom: i < settings.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                }}
                            >
                                <div>
                                    <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{setting.name}</p>
                                    <p style={{ color: '#888', fontSize: '0.65rem' }}>{setting.description}</p>
                                </div>
                                {setting.type === 'toggle' && (
                                    <button
                                        onClick={() => toggleSetting(setting.id)}
                                        style={{
                                            width: 44,
                                            height: 24,
                                            borderRadius: 12,
                                            border: 'none',
                                            background: setting.value ? '#00ff41' : '#333',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: setting.value ? 22 : 2,
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background: '#fff',
                                            transition: 'left 0.2s',
                                        }} />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,255,65,0.2)',
                        borderTop: '3px solid #00ff41',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00ff41' }}>🔗 Integrations</h3>
                        {integrations.map((integration, i) => (
                            <div
                                key={integration.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 0',
                                    borderBottom: i < integrations.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>{integration.icon}</span>
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{integration.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.65rem' }}>{integration.lastSync}</p>
                                    </div>
                                </div>
                                <span style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: STATUS_COLORS[integration.status],
                                }} />
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>👥 Team</h3>
                        {team.map((member, i) => (
                            <div
                                key={member.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 0',
                                    borderBottom: i < team.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                }}
                            >
                                <div>
                                    <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{member.name}</p>
                                    <p style={{ color: '#888', fontSize: '0.65rem' }}>{member.email}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.55rem',
                                        background: `${ROLE_COLORS[member.role]}20`,
                                        color: ROLE_COLORS[member.role],
                                    }}>
                                        {member.role}
                                    </span>
                                    <span style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: STATUS_COLORS[member.status],
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Configuration Excellence
                </footer>
            </div>
        </div>
    )
}
