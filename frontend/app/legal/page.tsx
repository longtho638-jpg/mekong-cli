'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Contract { id: string; title: string; client: string; type: 'service' | 'nda' | 'employment' | 'partnership'; value: number; status: 'active' | 'pending' | 'expired'; expiryDate: string }
interface ComplianceItem { id: string; requirement: string; framework: string; status: 'compliant' | 'in_progress' | 'non_compliant'; dueDate: string }
interface IPAsset { id: string; name: string; type: 'trademark' | 'patent' | 'copyright'; status: 'registered' | 'pending' | 'expired'; filingDate: string }

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

const TYPE_COLORS: Record<string, string> = { service: '#00bfff', nda: '#ffd700', employment: '#8a2be2', partnership: '#00ff41', trademark: '#e4405f', patent: '#ffd700', copyright: '#00bfff' }

export default function LegalHubPage() {
    const [contracts] = useState(CONTRACTS)
    const [compliance] = useState(COMPLIANCE)
    const [ipAssets] = useState(IP_ASSETS)

    const activeContracts = contracts.filter(c => c.status === 'active').length
    const totalContractValue = contracts.reduce((sum, c) => sum + c.value, 0)
    const complianceRate = (compliance.filter(c => c.status === 'compliant').length / compliance.length * 100).toFixed(0)
    const registeredIP = ipAssets.filter(ip => ip.status === 'registered').length

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono p-8">
            <div className="fixed -top-[20%] right-[30%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(158,158,158,0.06)_0%,transparent_60%)] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-8">
                    <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl mb-2">
                        <span className="text-gray-400">⚖️</span> Legal Hub
                    </motion.h1>
                    <p className="text-gray-500">Contracts • Compliance • IP</p>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Active Contracts', value: activeContracts, color: 'text-green-400' },
                        { label: 'Contract Value', value: `$${(totalContractValue / 1000).toFixed(0)}K`, color: 'text-cyan-400' },
                        { label: 'Compliance Rate', value: `${complianceRate}%`, color: parseInt(complianceRate) >= 80 ? 'text-green-400' : 'text-yellow-400' },
                        { label: 'Registered IP', value: registeredIP, color: 'text-pink-500' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white/[0.02] border border-white/5 rounded-xl p-5 text-center">
                            <p className="text-gray-500 text-xs mb-2 uppercase">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-[2fr_1fr] gap-6">
                    {/* Contracts */}
                    <div className="bg-white/[0.02] border border-gray-500/20 border-t-[3px] border-t-gray-400 rounded-xl p-6">
                        <h3 className="text-gray-400 mb-6">📄 Contracts</h3>
                        {contracts.map((contract, i) => (
                            <motion.div key={contract.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                className="bg-black/30 border-l-[3px] rounded-r-lg p-4 mb-3" style={{ borderLeftColor: TYPE_COLORS[contract.type] }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold mb-1">{contract.title}</p>
                                        <p className="text-gray-500 text-xs">{contract.client} • {contract.id}</p>
                                    </div>
                                    <div className="text-right">
                                        {contract.value > 0 && <p className="text-green-400 text-sm">${contract.value.toLocaleString()}</p>}
                                        <div className="flex gap-1 mt-1">
                                            <span className="px-2 py-0.5 rounded-md text-[10px]" style={{ backgroundColor: `${TYPE_COLORS[contract.type]}20`, color: TYPE_COLORS[contract.type] }}>{contract.type}</span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${contract.status === 'active' ? 'bg-green-400/10 text-green-400' : contract.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'}`}>{contract.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Compliance */}
                        <div className="bg-white/[0.02] border border-green-400/20 border-t-[3px] border-t-green-400 rounded-xl p-5">
                            <h3 className="text-green-400 text-sm mb-4">✅ Compliance</h3>
                            {compliance.map((item, i) => (
                                <div key={item.id} className={`py-2 ${i < compliance.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm">{item.requirement}</p>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${item.status === 'compliant' ? 'bg-green-400/10 text-green-400' : item.status === 'in_progress' ? 'bg-cyan-400/10 text-cyan-400' : 'bg-red-400/10 text-red-400'}`}>{item.status.replace('_', ' ')}</span>
                                    </div>
                                    <p className="text-gray-500 text-xs">{item.framework} • {item.dueDate}</p>
                                </div>
                            ))}
                        </div>

                        {/* IP Assets */}
                        <div className="bg-white/[0.02] border border-pink-500/20 border-t-[3px] border-t-pink-500 rounded-xl p-5">
                            <h3 className="text-pink-500 text-sm mb-4">🛡️ IP Assets</h3>
                            {ipAssets.map((ip, i) => (
                                <div key={ip.id} className={`flex justify-between items-center py-2 ${i < ipAssets.length - 1 ? 'border-b border-white/5' : ''}`}>
                                    <div>
                                        <p className="text-sm">{ip.name}</p>
                                        <span className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${TYPE_COLORS[ip.type]}20`, color: TYPE_COLORS[ip.type] }}>{ip.type}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${ip.status === 'registered' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>{ip.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <footer className="mt-8 text-center text-gray-500 text-sm">🏯 agencyos.network - Legal Protection</footer>
            </div>
        </div>
    )
}
