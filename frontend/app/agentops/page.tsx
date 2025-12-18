'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Types
interface OpsItem {
    name: string
    category: string
    status: string
    agents_count: number
}

interface Department {
    name: string
    icon: string
    color: string
    ops: OpsItem[]
}

// Department config
const DEPARTMENTS: Record<string, { icon: string; color: string }> = {
    sales: { icon: '💰', color: '#ffd700' },
    marketing: { icon: '📢', color: '#ff6b6b' },
    creative: { icon: '🎨', color: '#a855f7' },
    hr: { icon: '👥', color: '#e91e63' },
    finance: { icon: '💵', color: '#00ff41' },
    engineering: { icon: '⚙️', color: '#00bfff' },
    support: { icon: '🎧', color: '#ff9800' },
    legal: { icon: '⚖️', color: '#9e9e9e' },
    admin: { icon: '📋', color: '#8bc34a' },
    ecommerce: { icon: '🛒', color: '#ff5722' },
}

export default function AgentOpsHubPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [totalOps, setTotalOps] = useState(0)
    const [totalAgents, setTotalAgents] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAgentOps()
    }, [])

    const fetchAgentOps = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/agentops/')
            if (!res.ok) throw new Error('Failed to fetch AgentOps')

            const data = await res.json()

            // Transform data
            const depts: Department[] = Object.entries(data.categories).map(([key, ops]: [string, any]) => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                icon: DEPARTMENTS[key]?.icon || '📦',
                color: DEPARTMENTS[key]?.color || '#888',
                ops: ops as OpsItem[]
            }))

            setDepartments(depts)
            setTotalOps(data.total_ops)
            setTotalAgents(data.total_agents)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setError('Backend not available. Start with: uvicorn backend.main:app --reload')
            setLoading(false)
            // Set mock data
            setMockData()
        }
    }

    const setMockData = () => {
        const mockDepts: Department[] = [
            {
                name: 'Sales', icon: '💰', color: '#ffd700', ops: [
                    { name: 'SDR', category: 'sdrops', status: 'ready', agents_count: 2 },
                    { name: 'AE', category: 'aeops', status: 'ready', agents_count: 2 },
                    { name: 'BDM', category: 'bdmops', status: 'ready', agents_count: 2 },
                ]
            },
            {
                name: 'Marketing', icon: '📢', color: '#ff6b6b', ops: [
                    { name: 'SEO', category: 'seoops', status: 'ready', agents_count: 2 },
                    { name: 'PPC', category: 'ppcops', status: 'ready', agents_count: 2 },
                    { name: 'Social Media', category: 'socialmediaops', status: 'ready', agents_count: 2 },
                ]
            },
            {
                name: 'HR', icon: '👥', color: '#e91e63', ops: [
                    { name: 'Recruiter', category: 'recruiterops', status: 'ready', agents_count: 2 },
                    { name: 'L&D', category: 'ldops', status: 'ready', agents_count: 2 },
                ]
            },
            {
                name: 'Finance', icon: '💵', color: '#00ff41', ops: [
                    { name: 'FinOps', category: 'finops', status: 'ready', agents_count: 2 },
                    { name: 'Tax', category: 'taxops', status: 'ready', agents_count: 2 },
                ]
            },
        ]
        setDepartments(mockDepts)
        setTotalOps(50)
        setTotalAgents(100)
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '50%',
                width: '60%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(0,191,255,0.08) 0%, transparent 60%)',
                pointerEvents: 'none',
                transform: 'translateX(-50%)',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#00bfff' }}>🏯</span> AgentOps Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '1rem', letterSpacing: '0.1em' }}>
                        agencyos.network • 50 Ops • {totalAgents} Agents
                    </p>
                </header>

                {/* Error banner */}
                {error && (
                    <div style={{
                        background: 'rgba(255,99,71,0.1)',
                        border: '1px solid rgba(255,99,71,0.3)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        color: '#ff6347',
                        fontSize: '0.85rem',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Ops', value: totalOps, color: '#00bfff' },
                        { label: 'Total Agents', value: totalAgents, color: '#00ff41' },
                        { label: 'Departments', value: departments.length || 10, color: '#ffd700' },
                        { label: 'Status', value: 'All Ready', color: '#00ff41' },
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

                {/* Departments Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    {departments.map((dept, i) => (
                        <motion.div
                            key={dept.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${dept.color}30`,
                                borderTop: `3px solid ${dept.color}`,
                                borderRadius: '12px',
                                padding: '1.5rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem' }}>
                                    <span style={{ marginRight: '0.5rem' }}>{dept.icon}</span>
                                    {dept.name}
                                </h3>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    background: `${dept.color}20`,
                                    color: dept.color,
                                }}>
                                    {dept.ops.length} ops
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {dept.ops.map(ops => (
                                    <div
                                        key={ops.category}
                                        style={{
                                            background: 'rgba(0,0,0,0.3)',
                                            borderRadius: '6px',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <span style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: ops.status === 'ready' ? '#00ff41' : '#ffd700',
                                        }} />
                                        {ops.name}
                                        <span style={{ color: '#888', fontSize: '0.65rem' }}>({ops.agents_count})</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Binh Phap Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        marginTop: '2rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}
                >
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#00bfff' }}>
                        🏯 Binh Pháp 13 Chapters - Strategic Layer
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                        {[
                            { ch: 1, name: 'Kế Hoạch' },
                            { ch: 2, name: 'Tác Chiến' },
                            { ch: 3, name: 'Mưu Công' },
                            { ch: 4, name: 'Hình Thế' },
                            { ch: 5, name: 'Thế Trận' },
                            { ch: 6, name: 'Hư Thực' },
                            { ch: 7, name: 'Quân Tranh' },
                            { ch: 8, name: 'Cửu Biến' },
                            { ch: 9, name: 'Hành Quân' },
                            { ch: 10, name: 'Địa Hình' },
                            { ch: 11, name: 'Cửu Địa' },
                            { ch: 12, name: 'Hỏa Công' },
                            { ch: 13, name: 'Dụng Gián' },
                        ].map(chapter => (
                            <div
                                key={chapter.ch}
                                style={{
                                    background: 'rgba(0,191,255,0.05)',
                                    borderRadius: '6px',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                            >
                                <span style={{ color: '#00bfff', fontWeight: 'bold' }}>Ch.{chapter.ch}</span>
                                <span>{chapter.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - "Không đánh mà thắng"
                </footer>
            </div>
        </div>
    )
}
