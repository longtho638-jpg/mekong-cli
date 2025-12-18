'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Pipeline {
    id: string
    name: string
    source: string
    destination: string
    status: 'running' | 'paused' | 'failed'
    lastRun: string
    recordsProcessed: number
}

interface Workflow {
    id: string
    name: string
    type: 'etl' | 'sync' | 'backup' | 'report'
    schedule: string
    successRate: number
}

interface DataSource {
    id: string
    name: string
    type: 'database' | 'api' | 'file' | 'stream'
    connected: boolean
    recordCount: number
}

// Sample data
const PIPELINES: Pipeline[] = [
    { id: '1', name: 'CRM → DWH Sync', source: 'Salesforce', destination: 'BigQuery', status: 'running', lastRun: '2 min ago', recordsProcessed: 15420 },
    { id: '2', name: 'Daily Revenue ETL', source: 'Stripe', destination: 'Supabase', status: 'running', lastRun: '5 min ago', recordsProcessed: 8750 },
    { id: '3', name: 'Lead Enrichment', source: 'Clearbit', destination: 'HubSpot', status: 'paused', lastRun: '1 hour ago', recordsProcessed: 2340 },
]

const WORKFLOWS: Workflow[] = [
    { id: '1', name: 'Nightly Data Warehouse Refresh', type: 'etl', schedule: '0 2 * * *', successRate: 98.5 },
    { id: '2', name: 'Real-time Event Streaming', type: 'stream', schedule: 'Continuous', successRate: 99.9 },
    { id: '3', name: 'Weekly Analytics Report', type: 'report', schedule: '0 9 * * MON', successRate: 100 },
    { id: '4', name: 'Database Backup', type: 'backup', schedule: '0 0 * * *', successRate: 100 },
]

const DATA_SOURCES: DataSource[] = [
    { id: '1', name: 'PostgreSQL - Production', type: 'database', connected: true, recordCount: 2500000 },
    { id: '2', name: 'Supabase - App Data', type: 'database', connected: true, recordCount: 850000 },
    { id: '3', name: 'Stripe API', type: 'api', connected: true, recordCount: 45000 },
    { id: '4', name: 'Google Analytics', type: 'api', connected: false, recordCount: 0 },
]

const STATUS_COLORS: Record<string, string> = {
    running: '#00ff41',
    paused: '#ffd700',
    failed: '#ff0000',
}

const TYPE_COLORS: Record<string, string> = {
    etl: '#00bfff',
    sync: '#00ff41',
    backup: '#ffd700',
    report: '#e4405f',
    stream: '#8a2be2',
    database: '#00bfff',
    api: '#00ff41',
    file: '#ffd700',
}

export default function DataHubPage() {
    const [pipelines] = useState(PIPELINES)
    const [workflows] = useState(WORKFLOWS)
    const [sources] = useState(DATA_SOURCES)

    // Metrics
    const activePipelines = pipelines.filter(p => p.status === 'running').length
    const totalRecords = pipelines.reduce((sum, p) => sum + p.recordsProcessed, 0)
    const avgSuccessRate = (workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)
    const connectedSources = sources.filter(s => s.connected).length

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
                left: '30%',
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
                        <span style={{ color: '#00bfff' }}>🔄</span> Data Automation Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Pipelines • Workflows • Sources</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Active Pipelines', value: activePipelines, color: '#00ff41' },
                        { label: 'Records Processed', value: `${(totalRecords / 1000).toFixed(1)}K`, color: '#00bfff' },
                        { label: 'Success Rate', value: `${avgSuccessRate}%`, color: '#ffd700' },
                        { label: 'Connected Sources', value: `${connectedSources}/${sources.length}`, color: '#e4405f' },
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

                    {/* Pipelines */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>🔄 Data Pipelines</h3>

                        {pipelines.map((pipeline, i) => (
                            <motion.div
                                key={pipeline.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STATUS_COLORS[pipeline.status]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{pipeline.name}</p>
                                        <p style={{ color: '#888', fontSize: '0.75rem' }}>
                                            {pipeline.source} → {pipeline.destination}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.65rem',
                                            background: `${STATUS_COLORS[pipeline.status]}20`,
                                            color: STATUS_COLORS[pipeline.status],
                                        }}>
                                            {pipeline.status}
                                        </span>
                                        <p style={{ color: '#00ff41', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                            {pipeline.recordsProcessed.toLocaleString()} records
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Workflows + Sources */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Workflows */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>⚙️ Workflows</h3>

                            {workflows.map((wf, i) => (
                                <div
                                    key={wf.id}
                                    style={{
                                        padding: '0.5rem 0',
                                        borderBottom: i < workflows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '0.85rem' }}>{wf.name}</p>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                <span style={{
                                                    padding: '1px 4px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.55rem',
                                                    background: `${TYPE_COLORS[wf.type]}20`,
                                                    color: TYPE_COLORS[wf.type],
                                                }}>
                                                    {wf.type}
                                                </span>
                                                <span style={{ color: '#888', fontSize: '0.65rem' }}>{wf.schedule}</span>
                                            </div>
                                        </div>
                                        <span style={{ color: '#00ff41', fontSize: '0.85rem' }}>{wf.successRate}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Data Sources */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,255,65,0.2)',
                            borderTop: '3px solid #00ff41',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00ff41' }}>🔌 Data Sources</h3>

                            {sources.map((src, i) => (
                                <div
                                    key={src.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.5rem 0',
                                        borderBottom: i < sources.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: src.connected ? '#00ff41' : '#ff0000',
                                        }} />
                                        <span style={{ fontSize: '0.85rem' }}>{src.name}</span>
                                    </div>
                                    <span style={{
                                        padding: '1px 4px',
                                        borderRadius: '4px',
                                        fontSize: '0.55rem',
                                        background: `${TYPE_COLORS[src.type]}20`,
                                        color: TYPE_COLORS[src.type],
                                    }}>
                                        {src.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Data Excellence
                </footer>
            </div>
        </div>
    )
}
