'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface SecurityAlert {
    id: string
    type: 'critical' | 'warning' | 'info'
    title: string
    source: string
    timestamp: string
}

interface Vulnerability {
    id: string
    name: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    status: 'open' | 'patching' | 'resolved'
    asset: string
}

interface Compliance {
    id: string
    framework: string
    score: number
    status: 'compliant' | 'partial' | 'non_compliant'
}

// Sample data
const ALERTS: SecurityAlert[] = [
    { id: '1', type: 'critical', title: 'Unusual login attempt', source: 'Auth System', timestamp: '2 min ago' },
    { id: '2', type: 'warning', title: 'SSL certificate expiring', source: 'Infra Monitor', timestamp: '1 hour ago' },
    { id: '3', type: 'info', title: 'Backup completed', source: 'Backup System', timestamp: '3 hours ago' },
]

const VULNERABILITIES: Vulnerability[] = [
    { id: '1', name: 'CVE-2024-1234', severity: 'high', status: 'patching', asset: 'API Server' },
    { id: '2', name: 'Outdated Dependencies', severity: 'medium', status: 'open', asset: 'Frontend' },
    { id: '3', name: 'Weak Passwords', severity: 'low', status: 'resolved', asset: 'User Accounts' },
]

const COMPLIANCE: Compliance[] = [
    { id: '1', framework: 'SOC 2', score: 85, status: 'partial' },
    { id: '2', framework: 'GDPR', score: 92, status: 'compliant' },
    { id: '3', framework: 'ISO 27001', score: 78, status: 'partial' },
]

const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ff0000',
    high: '#ff6347',
    medium: '#ffd700',
    low: '#00ff41',
    warning: '#ffd700',
    info: '#00bfff',
}

export default function SecurityHubPage() {
    const [alerts] = useState(ALERTS)
    const [vulnerabilities] = useState(VULNERABILITIES)
    const [compliance] = useState(COMPLIANCE)

    // Metrics
    const criticalAlerts = alerts.filter(a => a.type === 'critical').length
    const openVulns = vulnerabilities.filter(v => v.status !== 'resolved').length
    const avgCompliance = compliance.reduce((sum, c) => sum + c.score, 0) / compliance.length

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            {/* Ambient */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '50%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(255,0,0,0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
                transform: 'translateX(-50%)',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#ff0000' }}>🔐</span> Security Hub (CISO)
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Threats • Vulnerabilities • Compliance</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Critical Alerts', value: criticalAlerts, color: criticalAlerts > 0 ? '#ff0000' : '#00ff41' },
                        { label: 'Open Vulns', value: openVulns, color: openVulns > 2 ? '#ff6347' : '#ffd700' },
                        { label: 'Compliance Score', value: `${avgCompliance.toFixed(0)}%`, color: avgCompliance >= 90 ? '#00ff41' : '#ffd700' },
                        { label: 'Security Grade', value: 'B+', color: '#00bfff' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Alerts */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,0,0,0.2)',
                        borderTop: '3px solid #ff0000',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#ff0000' }}>🚨 Security Alerts</h3>

                        {alerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${SEVERITY_COLORS[alert.type]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{alert.title}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{alert.source}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.65rem',
                                            textTransform: 'uppercase',
                                            background: `${SEVERITY_COLORS[alert.type]}20`,
                                            color: SEVERITY_COLORS[alert.type],
                                        }}>
                                            {alert.type}
                                        </span>
                                        <p style={{ color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>{alert.timestamp}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Vulnerabilities + Compliance */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Vulnerabilities */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,99,71,0.2)',
                            borderTop: '3px solid #ff6347',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ff6347' }}>🐛 Vulnerabilities</h3>

                            {vulnerabilities.map((vuln, i) => (
                                <div
                                    key={vuln.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < vulnerabilities.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{vuln.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{vuln.asset}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${SEVERITY_COLORS[vuln.severity]}20`,
                                            color: SEVERITY_COLORS[vuln.severity],
                                        }}>
                                            {vuln.severity}
                                        </span>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: vuln.status === 'resolved' ? 'rgba(0,255,65,0.1)' : 'rgba(0,191,255,0.1)',
                                            color: vuln.status === 'resolved' ? '#00ff41' : '#00bfff',
                                        }}>
                                            {vuln.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Compliance */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,255,65,0.2)',
                            borderTop: '3px solid #00ff41',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00ff41' }}>✅ Compliance</h3>

                            {compliance.map((comp, i) => (
                                <div
                                    key={comp.id}
                                    style={{
                                        marginBottom: i < compliance.length - 1 ? '0.75rem' : 0,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <p style={{ fontSize: '0.85rem' }}>{comp.framework}</p>
                                        <span style={{ color: comp.score >= 90 ? '#00ff41' : '#ffd700', fontSize: '0.85rem' }}>{comp.score}%</span>
                                    </div>
                                    <div style={{
                                        height: 4,
                                        background: '#333',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${comp.score}%`,
                                            height: '100%',
                                            background: comp.score >= 90 ? '#00ff41' : comp.score >= 80 ? '#ffd700' : '#ff6347',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Security First
                </footer>
            </div>
        </div>
    )
}
