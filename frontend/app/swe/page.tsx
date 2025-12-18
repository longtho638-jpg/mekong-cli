'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface TaskItem {
    id: string
    title: string
    points: number
    assignee: string
    status: 'todo' | 'in_progress' | 'in_review' | 'done'
}

interface PRItem {
    id: string
    title: string
    author: string
    additions: number
    deletions: number
    reviews: number
    status: 'open' | 'in_review' | 'approved' | 'merged'
}

// Sample data
const TASKS: TaskItem[] = [
    { id: '1', title: 'Implement user auth', points: 5, assignee: 'Nguyen A', status: 'done' },
    { id: '2', title: 'Build dashboard UI', points: 8, assignee: 'Tran B', status: 'in_progress' },
    { id: '3', title: 'API integration', points: 3, assignee: 'Le C', status: 'in_review' },
    { id: '4', title: 'Database optimization', points: 5, assignee: 'Pham D', status: 'todo' },
    { id: '5', title: 'Unit tests', points: 3, assignee: 'Nguyen A', status: 'todo' },
]

const PRS: PRItem[] = [
    { id: 'PR-101', title: 'feat: add user auth', author: 'nguyen_a', additions: 250, deletions: 30, reviews: 2, status: 'merged' },
    { id: 'PR-102', title: 'fix: dashboard bug', author: 'tran_b', additions: 15, deletions: 8, reviews: 1, status: 'approved' },
    { id: 'PR-103', title: 'refactor: api layer', author: 'le_c', additions: 180, deletions: 120, reviews: 2, status: 'in_review' },
    { id: 'PR-104', title: 'feat: notifications', author: 'pham_d', additions: 320, deletions: 45, reviews: 0, status: 'open' },
]

const TASK_COLORS = {
    todo: '#888',
    in_progress: '#00bfff',
    in_review: '#ffd700',
    done: '#00ff41',
}

const PR_COLORS = {
    open: '#888',
    in_review: '#ffd700',
    approved: '#00ff41',
    merged: '#9b59b6',
}

export default function SWEDashboard() {
    const [tasks] = useState<TaskItem[]>(TASKS)
    const [prs] = useState<PRItem[]>(PRS)

    const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0)
    const completedPoints = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + t.points, 0)
    const velocity = Math.round((completedPoints / totalPoints) * 100)
    const openPRs = prs.filter(p => p.status !== 'merged').length

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#00bfff' }}>💻</span> Software Engineering
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Sprint 24 • Sprints & Code Reviews</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Sprint Progress', value: `${velocity}%`, color: '#00ff41' },
                        { label: 'Completed', value: `${completedPoints}/${totalPoints} pts`, color: '#00bfff' },
                        { label: 'Open PRs', value: openPRs, color: '#ffd700' },
                        { label: 'Days Left', value: 7, color: '#ff5f56' },
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
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Sprint Board */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>SPRINT BOARD</h3>

                        {tasks.map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TASK_COLORS[task.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${TASK_COLORS[task.status]}20`,
                                        color: TASK_COLORS[task.status],
                                    }}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>👤 {task.assignee}</span>
                                    <span style={{ color: '#00bfff', fontWeight: 'bold' }}>{task.points} pts</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* PR Queue */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>PULL REQUESTS</h3>

                        {prs.map((pr, i) => (
                            <motion.div
                                key={pr.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${PR_COLORS[pr.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ color: '#888', fontSize: '0.75rem' }}>{pr.id}</span>
                                        <span style={{ fontWeight: 600, marginLeft: '0.5rem' }}>{pr.title}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${PR_COLORS[pr.status]}20`,
                                        color: PR_COLORS[pr.status],
                                    }}>
                                        {pr.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>👤 {pr.author}</span>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ color: '#00ff41' }}>+{pr.additions}</span>
                                        <span style={{ color: '#ff5f56' }}>-{pr.deletions}</span>
                                        <span>💬 {pr.reviews}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
