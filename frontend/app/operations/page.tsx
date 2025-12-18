'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Process {
    id: string
    name: string
    department: string
    status: 'running' | 'idle' | 'error'
    efficiency: number
    lastRun: string
}

interface KPI {
    id: string
    name: string
    current: number
    target: number
    unit: string
    trend: 'up' | 'down' | 'stable'
}

interface Resource {
    id: string
    name: string
    type: 'human' | 'machine' | 'software'
    utilization: number
    status: 'active' | 'idle' | 'maintenance'
}

// Sample data
const PROCESSES: Process[] = [
    { id: '1', name: 'Order Fulfillment', department: 'Logistics', status: 'running', efficiency: 94, lastRun: 'Now' },
    { id: '2', name: 'Customer Onboarding', department: 'Sales', status: 'running', efficiency: 88, lastRun: '5 min ago' },
    { id: '3', name: 'Invoice Generation', department: 'Finance', status: 'idle', efficiency: 100, lastRun: '30 min ago' },
    { id: '4', name: 'Report Compilation', department: 'Analytics', status: 'error', efficiency: 0, lastRun: 'Failed' },
]

const KPIS: KPI[] = [
    { id: '1', name: 'Cycle Time', current: 2.5, target: 3.0, unit: 'days', trend: 'down' },
    { id: '2', name: 'First Pass Yield', current: 96, target: 95, unit: '%', trend: 'up' },
    { id: '3', name: 'OEE', current: 82, target: 85, unit: '%', trend: 'up' },
    { id: '4', name: 'On-Time Delivery', current: 98, target: 99, unit: '%', trend: 'stable' },
]

const RESOURCES: Resource[] = [
    { id: '1', name: 'Development Team', type: 'human', utilization: 85, status: 'active' },
    { id: '2', name: 'Cloud Infrastructure', type: 'machine', utilization: 72, status: 'active' },
    { id: '3', name: 'CI/CD Pipeline', type: 'software', utilization: 45, status: 'active' },
    { id: '4', name: 'Data Warehouse', type: 'machine', utilization: 0, status: 'maintenance' },
]

const STATUS_COLORS: Record<string, string> = {
    running: '#00ff41',
    idle: '#ffd700',
    error: '#ff0000',
    active: '#00ff41',
    maintenance: '#ffd700',
}

const TYPE_COLORS: Record<string, string> = {
    human: '#00bfff',
    machine: '#ffd700',
    software: '#8a2be2',
}

export default function OperationsHubPage() {
    const [processes] = useState(PROCESSES)
    const [kpis] = useState(KPIS)
    const [resources] = useState(RESOURCES)

    // Metrics
    const runningProcesses = processes.filter(p => p.status === 'running').length
    const avgEfficiency = (processes.filter(p => p.status === 'running').reduce((sum, p) => sum + p.efficiency, 0) / runningProcesses).toFixed(0)
    const kpisOnTarget = kpis.filter(k => k.current >= k.target).length
    const avgUtilization = (resources.filter(r => r.status === 'active').reduce((sum, r) => sum + r.utilization, 0) / resources.filter(r => r.status === 'active').length).toFixed(0)

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
                right: '25%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(0,191,255,0.06) 0%, transparent 60%)',
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
                        <span style={{ color: '#00bfff' }}>⚙️</span> Operations Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Processes • KPIs • Resources</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Active Processes', value: `${runningProcesses}/${processes.length}`, color: '#00ff41' },
                        { label: 'Avg Efficiency', value: `${avgEfficiency}%`, color: '#00bfff' },
                        { label: 'KPIs on Target', value: `${kpisOnTarget}/${kpis.length}`, color: '#ffd700' },
                        { label: 'Resource Util', value: `${avgUtilization}%`, color: '#8a2be2' },
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

                    {/* Processes */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>⚙️ Active Processes</h3>

                        {processes.map((process, i) => (
                            <motion.div
                                key={process.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STATUS_COLORS[process.status]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{process.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>{process.department} • {process.lastRun}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: STATUS_COLORS[process.status] }}>
                                            {process.efficiency}%
                                        </p>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[process.status]}20`,
                                            color: STATUS_COLORS[process.status],
                                        }}>
                                            {process.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* KPIs + Resources */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* KPIs */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>📈 Key Performance Indicators</h3>

                            {kpis.map((kpi, i) => (
                                <div key={kpi.id} style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.85rem' }}>{kpi.name}</span>
                                        <span style={{ fontSize: '0.85rem', color: kpi.current >= kpi.target ? '#00ff41' : '#ff6347' }}>
                                            {kpi.current}{kpi.unit} / {kpi.target}{kpi.unit}
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 6,
                                        background: '#333',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%`,
                                            height: '100%',
                                            background: kpi.current >= kpi.target ? '#00ff41' : '#ff6347',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Resources */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(138,43,226,0.2)',
                            borderTop: '3px solid #8a2be2',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#8a2be2' }}>🔧 Resources</h3>

                            {resources.map((res, i) => (
                                <div
                                    key={res.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < resources.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: STATUS_COLORS[res.status],
                                        }} />
                                        <div>
                                            <p style={{ fontSize: '0.85rem' }}>{res.name}</p>
                                            <span style={{
                                                padding: '1px 4px',
                                                borderRadius: '4px',
                                                fontSize: '0.55rem',
                                                background: `${TYPE_COLORS[res.type]}20`,
                                                color: TYPE_COLORS[res.type],
                                            }}>
                                                {res.type}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{ color: res.utilization > 80 ? '#00ff41' : '#888', fontSize: '0.9rem' }}>
                                        {res.utilization}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Operational Excellence
                </footer>
            </div>
        </div>
    )
}
