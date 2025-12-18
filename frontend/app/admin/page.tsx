'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Task {
    id: string
    title: string
    assignee: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'todo' | 'in_progress' | 'review' | 'done'
    dueDate: string
}

interface Report {
    id: string
    title: string
    type: string
    date: string
    status: 'generated' | 'pending'
}

// Sample data
const TASKS: Task[] = [
    { id: '1', title: 'Implement Hybrid Router', assignee: 'Dev A', priority: 'high', status: 'done', dueDate: 'Dec 15' },
    { id: '2', title: 'Write documentation', assignee: 'Dev B', priority: 'medium', status: 'in_progress', dueDate: 'Dec 20' },
    { id: '3', title: 'Setup CI/CD pipeline', assignee: 'Dev A', priority: 'high', status: 'review', dueDate: 'Dec 18' },
    { id: '4', title: 'Design landing page', assignee: 'Designer', priority: 'medium', status: 'todo', dueDate: 'Dec 22' },
    { id: '5', title: 'Fix deployment bug', assignee: 'Dev C', priority: 'urgent', status: 'in_progress', dueDate: 'Dec 16' },
    { id: '6', title: 'Add unit tests', assignee: 'Dev B', priority: 'low', status: 'todo', dueDate: 'Dec 25' },
]

const REPORTS: Report[] = [
    { id: '1', title: 'Weekly Marketing Report', type: 'weekly', date: 'Dec 15', status: 'generated' },
    { id: '2', title: 'Monthly KPI Summary', type: 'monthly', date: 'Dec 1', status: 'generated' },
    { id: '3', title: 'Sales Pipeline Review', type: 'weekly', date: 'Dec 22', status: 'pending' },
]

const PRIORITY_COLORS = {
    low: '#888',
    medium: '#ffd700',
    high: '#ff9500',
    urgent: '#ff5f56',
}

const STATUS_COLUMNS = ['todo', 'in_progress', 'review', 'done']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'tasks' | 'reports'>('tasks')

    const metrics = {
        totalTasks: TASKS.length,
        done: TASKS.filter(t => t.status === 'done').length,
        inProgress: TASKS.filter(t => t.status === 'in_progress').length,
        overdue: 1,
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#3498db' }}>⚙️</span> Admin Console
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Task Management & Reports</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Tasks', value: metrics.totalTasks, color: '#fff' },
                        { label: 'In Progress', value: metrics.inProgress, color: '#00bfff' },
                        { label: 'Completed', value: metrics.done, color: '#00ff41' },
                        { label: 'Overdue', value: metrics.overdue, color: '#ff5f56' },
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

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    {['tasks', 'reports'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'tasks' | 'reports')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: activeTab === tab ? 'rgba(52,152,219,0.2)' : 'transparent',
                                border: `1px solid ${activeTab === tab ? '#3498db' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '8px',
                                color: activeTab === tab ? '#3498db' : '#888',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                fontFamily: 'inherit',
                            }}
                        >
                            {tab === 'tasks' ? '📋 Tasks' : '📊 Reports'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'tasks' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {STATUS_COLUMNS.map((status, colIdx) => (
                            <div key={status} style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1rem',
                            }}>
                                <h3 style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS]} ({TASKS.filter(t => t.status === status).length})
                                </h3>

                                {TASKS.filter(t => t.status === status).map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: colIdx * 0.1 + i * 0.05 }}
                                        whileHover={{ scale: 1.02 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            padding: '0.75rem',
                                            marginBottom: '0.5rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{task.title}</span>
                                            <span style={{
                                                width: 8, height: 8,
                                                borderRadius: '50%',
                                                background: PRIORITY_COLORS[task.priority],
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#888' }}>
                                            <span>{task.assignee}</span>
                                            <span>{task.dueDate}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '3fr 1fr 1fr 1fr',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255,255,255,0.03)',
                            fontSize: '0.75rem',
                            color: '#888',
                            textTransform: 'uppercase',
                        }}>
                            <span>Report</span>
                            <span>Type</span>
                            <span>Date</span>
                            <span>Status</span>
                        </div>

                        {REPORTS.map((report, i) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '3fr 1fr 1fr 1fr',
                                    padding: '0.75rem 1rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                }}
                            >
                                <span>{report.title}</span>
                                <span style={{ color: '#888' }}>{report.type}</span>
                                <span style={{ color: '#888' }}>{report.date}</span>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    background: report.status === 'generated' ? 'rgba(0,255,65,0.1)' : 'rgba(255,215,0,0.1)',
                                    color: report.status === 'generated' ? '#00ff41' : '#ffd700',
                                }}>
                                    {report.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
