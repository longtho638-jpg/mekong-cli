'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface SecurityAlert { id: string; type: 'critical' | 'warning' | 'info'; title: string; source: string; timestamp: string }
interface Vulnerability { id: string; name: string; severity: 'critical' | 'high' | 'medium' | 'low'; status: 'open' | 'patching' | 'resolved'; asset: string }
interface Compliance { id: string; framework: string; score: number; status: 'compliant' | 'partial' | 'non_compliant' }

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

const SEVERITY_COLORS: Record<string, string> = { critical: '#ff0000', high: '#ff6347', medium: '#ffd700', low: '#00ff41', warning: '#ffd700', info: '#00bfff' }

export default function SecurityHubPage() {
    const [alerts] = useState(ALERTS)
    const [vulnerabilities] = useState(VULNERABILITIES)
    const [compliance] = useState(COMPLIANCE)

    const criticalAlerts = alerts.filter(a => a.type === 'critical').length
    const openVulns = vulnerabilities.filter(v => v.status !== 'resolved').length
    const avgCompliance = compliance.reduce((sum, c) => sum + c.score, 0) / compliance.length

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono p-8">
            <div className="fixed -top-[20%] left-1/2 -translate-x-1/2 w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(255,0,0,0.05)_0%,transparent_60%)] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-8">
                    <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl mb-2">
                        <span className="text-red-500">🔐</span> Security Hub (CISO)
                    </motion.h1>
                    <p className="text-gray-500">Threats • Vulnerabilities • Compliance</p>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Critical Alerts', value: criticalAlerts, color: criticalAlerts > 0 ? 'text-red-500' : 'text-green-400' },
                        { label: 'Open Vulns', value: openVulns, color: openVulns > 2 ? 'text-red-400' : 'text-yellow-400' },
                        { label: 'Compliance Score', value: `${avgCompliance.toFixed(0)}%`, color: avgCompliance >= 90 ? 'text-green-400' : 'text-yellow-400' },
                        { label: 'Security Grade', value: 'B+', color: 'text-cyan-400' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white/[0.02] border border-white/5 rounded-xl p-5 text-center">
                            <p className="text-gray-500 text-xs mb-2 uppercase">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Alerts */}
                    <div className="bg-white/[0.02] border border-red-500/20 border-t-[3px] border-t-red-500 rounded-xl p-6">
                        <h3 className="text-red-500 mb-6">🚨 Security Alerts</h3>
                        {alerts.map((alert, i) => (
                            <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                className="bg-black/30 border-l-[3px] rounded-r-lg p-4 mb-3" style={{ borderLeftColor: SEVERITY_COLORS[alert.type] }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold mb-1">{alert.title}</p>
                                        <p className="text-gray-500 text-xs">{alert.source}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase" style={{ backgroundColor: `${SEVERITY_COLORS[alert.type]}20`, color: SEVERITY_COLORS[alert.type] }}>{alert.type}</span>
                                        <p className="text-gray-500 text-xs mt-1">{alert.timestamp}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Vulnerabilities */}
                        <div className="bg-white/[0.02] border border-red-400/20 border-t-[3px] border-t-red-400 rounded-xl p-5">
                            <h3 className="text-red-400 text-sm mb-4">🐛 Vulnerabilities</h3>
                            {vulnerabilities.map((vuln, i) => (
                                <div key={vuln.id} className={`flex justify-between items-center py-2 ${i < vulnerabilities.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div>
                                        <p className="text-sm">{vuln.name}</p>
                                        <p className="text-gray-500 text-xs">{vuln.asset}</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="px-2 py-0.5 rounded-md text-[10px]" style={{ backgroundColor: `${SEVERITY_COLORS[vuln.severity]}20`, color: SEVERITY_COLORS[vuln.severity] }}>{vuln.severity}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${vuln.status === 'resolved' ? 'bg-green-400/10 text-green-400' : 'bg-cyan-400/10 text-cyan-400'}`}>{vuln.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Compliance */}
                        <div className="bg-white/[0.02] border border-green-400/20 border-t-[3px] border-t-green-400 rounded-xl p-5">
                            <h3 className="text-green-400 text-sm mb-4">✅ Compliance</h3>
                            {compliance.map((comp, i) => (
                                <div key={comp.id} className={`${i < compliance.length - 1 ? 'mb-3' : ''}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm">{comp.framework}</p>
                                        <span className={`text-sm ${comp.score >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>{comp.score}%</span>
                                    </div>
                                    <div className="h-1 bg-gray-700 rounded overflow-hidden">
                                        <div className={`h-full ${comp.score >= 90 ? 'bg-green-400' : comp.score >= 80 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${comp.score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="mt-8 text-center text-gray-500 text-sm">🏯 agencyos.network - Security First</footer>
            </div>
        </div>
    )
}
