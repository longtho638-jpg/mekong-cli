'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Contract {
    id: string
    title: string
    client: string
    type: 'service' | 'nda' | 'employment' | 'partnership'
    value: number
    status: 'active' | 'pending' | 'expired'
    expiryDate: string
}

interface ComplianceItem {
    id: string
    requirement: string
    framework: string
    status: 'compliant' | 'in_progress' | 'non_compliant'
    dueDate: string
}

interface IPAsset {
    id: string
    name: string
    type: 'trademark' | 'patent' | 'copyright'
    status: 'registered' | 'pending' | 'expired'
    filingDate: string
}

// Sample data
const CONTRACTS: Contract[] = [
    { id: 'CTR-001', title: 'Enterprise SLA', client: 'Mekong Corp', type: 'service', value: 120000, status: 'active', expiryDate: 'Dec 2025' },
    { id: 'CTR-002', title: 'NDA - Tech Partner', client: 'Saigon AI', type: 'nda', value: 0, status: 'active', expiryDate: 'Jun 2024' },
    { id: 'CTR-003', title: 'Consulting Agreement', client: 'Delta Farms', type: 'partnership', value: 45000, status: 'pending', expiryDate: 'Mar 2025' },
]

const COMPLIANCE: ComplianceItem[] = [
    { id: '1', requirement: 'Data Privacy Policy Update', framework: 'GDPR', status: 'compliant', dueDate: 'Completed' },
    { id: '2', requirement: 'Security Audit', framework: 'SOC 2', status: 'in_progress', dueDate: 'Jan 2025' },
    { id: '3', requirement: 'Financial Reporting', framework: 'VAS', status: 'compliant', dueDate: 'Q4 2024' },
]

const IP_ASSETS: IPAsset[] = [
    { id: '1', name: 'AgencyOS', type: 'trademark', status: 'registered', filingDate: 'Sep 2024' },
    { id: '2', name: 'Binh Phap Framework', type: 'copyright', status: 'registered', filingDate: 'Oct 2024' },
    { id: '3', name: 'AI Agent Orchestration', type: 'patent', status: 'pending', filingDate: 'Nov 2024' },
]

const STATUS_COLORS: Record<string, string> = {
    active: '#00ff41',
    pending: '#ffd700',
    expired: '#ff6347',
    compliant: '#00ff41',
    in_progress: '#00bfff',
    non_compliant: '#ff0000',
    registered: '#00ff41',
}

const TYPE_COLORS: Record<string, string> = {
    service: '#00bfff',
    nda: '#ffd700',
    employment: '#8a2be2',
    partnership: '#00ff41',
    trademark: '#e4405f',
    patent: '#ffd700',
    copyright: '#00bfff',
}

export default function LegalHubPage() {
    const [contracts] = useState(CONTRACTS)
    const [compliance] = useState(COMPLIANCE)
    const [ipAssets] = useState(IP_ASSETS)

    // Metrics
    const activeContracts = contracts.filter(c => c.status === 'active').length
    const totalContractValue = contracts.reduce((sum, c) => sum + c.value, 0)
    const complianceRate = (compliance.filter(c => c.status === 'compliant').length / compliance.length * 100).toFixed(0)
    const registeredIP = ipAssets.filter(ip => ip.status === 'registered').length

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
                right: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(158,158,158,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#9e9e9e' }}>⚖️</span> Legal Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Contracts • Compliance • IP</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Active Contracts', value: activeContracts, color: '#00ff41' },
                        { label: 'Contract Value', value: `$${(totalContractValue / 1000).toFixed(0)}K`, color: '#00bfff' },
                        { label: 'Compliance Rate', value: `${complianceRate}%`, color: parseInt(complianceRate) >= 80 ? '#00ff41' : '#ffd700' },
                        { label: 'Registered IP', value: registeredIP, color: '#e4405f' },
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

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Contracts */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(158,158,158,0.2)',
                        borderTop: '3px solid #9e9e9e',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#9e9e9e' }}>📄 Contracts</h3>

                        {contracts.map((contract, i) => (
                            <motion.div
                                key={contract.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${TYPE_COLORS[contract.type]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{contract.title}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{contract.client} • {contract.id}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {contract.value > 0 && <p style={{ color: '#00ff41', fontSize: '0.9rem' }}>${contract.value.toLocaleString()}</p>}
                                        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                fontSize: '0.6rem',
                                                background: `${TYPE_COLORS[contract.type]}20`,
                                                color: TYPE_COLORS[contract.type],
                                            }}>
                                                {contract.type}
                                            </span>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                fontSize: '0.6rem',
                                                background: `${STATUS_COLORS[contract.status]}20`,
                                                color: STATUS_COLORS[contract.status],
                                            }}>
                                                {contract.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Compliance + IP */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Compliance */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,255,65,0.2)',
                            borderTop: '3px solid #00ff41',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00ff41' }}>✅ Compliance</h3>

                            {compliance.map((item, i) => (
                                <div
                                    key={item.id}
                                    style={{
                                        padding: '0.5rem 0',
                                        borderBottom: i < compliance.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ fontSize: '0.85rem' }}>{item.requirement}</p>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[item.status]}20`,
                                            color: STATUS_COLORS[item.status],
                                        }}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p style={{ color: '#888', fontSize: '0.7rem' }}>{item.framework} • {item.dueDate}</p>
                                </div>
                            ))}
                        </div>

                        {/* IP Assets */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(228,64,95,0.2)',
                            borderTop: '3px solid #e4405f',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#e4405f' }}>🛡️ IP Assets</h3>

                            {ipAssets.map((ip, i) => (
                                <div
                                    key={ip.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < ipAssets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.85rem' }}>{ip.name}</p>
                                        <span style={{
                                            padding: '1px 4px',
                                            borderRadius: '4px',
                                            fontSize: '0.55rem',
                                            background: `${TYPE_COLORS[ip.type]}20`,
                                            color: TYPE_COLORS[ip.type],
                                        }}>
                                            {ip.type}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[ip.status]}20`,
                                        color: STATUS_COLORS[ip.status],
                                    }}>
                                        {ip.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Legal Protection
                </footer>
            </div>
        </div>
    )
}
