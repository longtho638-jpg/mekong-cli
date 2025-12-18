'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Types
interface AssistantTask {
    id: string
    command: string
    status: 'completed' | 'running' | 'queued' | 'failed'
    result: string
    duration: string
    timestamp: string
}

interface AgentCapability {
    id: string
    name: string
    category: string
    usageCount: number
    successRate: number
    avgTime: string
}

interface Conversation {
    id: string
    topic: string
    messages: number
    lastActive: string
    status: 'active' | 'archived'
}

// Sample data
const TASKS: AssistantTask[] = [
    { id: '1', command: 'Generate weekly sales report', status: 'completed', result: 'Report saved to /reports/weekly-sales.pdf', duration: '2.3s', timestamp: '5 min ago' },
    { id: '2', command: 'Schedule team sync for Friday', status: 'completed', result: 'Meeting created: Fri 3:00 PM', duration: '0.8s', timestamp: '15 min ago' },
    { id: '3', command: 'Analyze competitor pricing', status: 'running', result: 'Gathering data from 5 sources...', duration: '45s', timestamp: 'Now' },
    { id: '4', command: 'Draft email to investors', status: 'queued', result: 'Waiting in queue', duration: '-', timestamp: 'Pending' },
]

const CAPABILITIES: AgentCapability[] = [
    { id: '1', name: 'Report Generation', category: 'Analytics', usageCount: 245, successRate: 98, avgTime: '3.2s' },
    { id: '2', name: 'Meeting Scheduling', category: 'Calendar', usageCount: 189, successRate: 100, avgTime: '1.1s' },
    { id: '3', name: 'Email Drafting', category: 'Communication', usageCount: 156, successRate: 95, avgTime: '4.5s' },
    { id: '4', name: 'Data Analysis', category: 'Analytics', usageCount: 134, successRate: 92, avgTime: '8.7s' },
    { id: '5', name: 'Task Automation', category: 'Operations', usageCount: 98, successRate: 97, avgTime: '2.3s' },
]

const CONVERSATIONS: Conversation[] = [
    { id: '1', topic: 'Q4 Strategy Planning', messages: 24, lastActive: '2 hours ago', status: 'active' },
    { id: '2', topic: 'Product Roadmap Review', messages: 18, lastActive: 'Yesterday', status: 'active' },
    { id: '3', topic: 'Budget Allocation', messages: 12, lastActive: '3 days ago', status: 'archived' },
]

const STATUS_COLORS: Record<string, string> = {
    completed: '#00ff41',
    running: '#00bfff',
    queued: '#ffd700',
    failed: '#ff0000',
    active: '#00ff41',
    archived: '#888',
}

export default function AIAssistantHubPage() {
    const [tasks] = useState(TASKS)
    const [capabilities] = useState(CAPABILITIES)
    const [conversations] = useState(CONVERSATIONS)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const totalCommands = capabilities.reduce((sum, c) => sum + c.usageCount, 0)
    const avgSuccessRate = (capabilities.reduce((sum, c) => sum + c.successRate, 0) / capabilities.length).toFixed(0)
    const runningTasks = tasks.filter(t => t.status === 'running').length

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #050505 0%, #0a0a1a 50%, #050510 100%)',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{
                position: 'fixed',
                top: '-15%',
                left: '25%',
                width: '50%',
                height: '35%',
                background: 'radial-gradient(circle, rgba(0,191,255,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#00bfff' }}>🤖</span> AI Assistant Hub
                        </h1>
                        <p style={{ color: '#888', fontSize: '0.85rem' }}>Commands • Capabilities • Conversations</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            background: 'rgba(0,191,255,0.1)',
                            border: '1px solid rgba(0,191,255,0.3)',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff41', animation: 'pulse 2s infinite' }} />
                        <span style={{ color: '#00bfff', fontSize: '0.85rem' }}>Online • Ready</span>
                    </motion.div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Commands Executed', value: totalCommands.toLocaleString(), color: '#00bfff' },
                        { label: 'Success Rate', value: `${avgSuccessRate}%`, color: '#00ff41' },
                        { label: 'Active Tasks', value: runningTasks, color: '#ffd700' },
                        { label: 'Conversations', value: conversations.length, color: '#8a2be2' },
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,191,255,0.2)',
                            borderTop: '3px solid #00bfff',
                            borderRadius: '12px',
                            padding: '1.5rem',
                        }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>⚡ Recent Commands</h3>
                            {tasks.map((task, i) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        borderLeft: `3px solid ${STATUS_COLORS[task.status]}`,
                                        borderRadius: '0 8px 8px 0',
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{task.command}</p>
                                            <p style={{ color: '#888', fontSize: '0.75rem' }}>{task.result}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                fontSize: '0.6rem',
                                                background: `${STATUS_COLORS[task.status]}20`,
                                                color: STATUS_COLORS[task.status],
                                            }}>
                                                {task.status}
                                            </span>
                                            <p style={{ color: '#888', fontSize: '0.65rem', marginTop: '0.25rem' }}>{task.duration}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(138,43,226,0.2)',
                            borderTop: '3px solid #8a2be2',
                            borderRadius: '12px',
                            padding: '1.5rem',
                        }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#8a2be2' }}>💬 Conversations</h3>
                            {conversations.map((conv, i) => (
                                <div
                                    key={conv.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem 0',
                                        borderBottom: i < conversations.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    }}
                                >
                                    <div>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{conv.topic}</p>
                                        <p style={{ color: '#888', fontSize: '0.7rem' }}>{conv.messages} messages • {conv.lastActive}</p>
                                    </div>
                                    <span style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: STATUS_COLORS[conv.status],
                                    }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,255,65,0.2)',
                        borderTop: '3px solid #00ff41',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00ff41' }}>🎯 Capabilities</h3>
                        {capabilities.map((cap, i) => (
                            <div key={cap.id} style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{cap.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: cap.successRate >= 95 ? '#00ff41' : '#ffd700' }}>
                                        {cap.successRate}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${cap.successRate}%`,
                                            height: '100%',
                                            background: cap.successRate >= 95 ? '#00ff41' : '#ffd700',
                                        }} />
                                    </div>
                                </div>
                                <p style={{ color: '#888', fontSize: '0.65rem', marginTop: '0.25rem' }}>
                                    {cap.usageCount} uses • {cap.avgTime} avg
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - AI Excellence
                </footer>
            </div>
        </div>
    )
}
