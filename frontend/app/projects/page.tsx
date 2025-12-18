'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Project {
    id: string
    name: string
    status: 'active' | 'completed' | 'on_hold' | 'planned'
    progress: number
    team: number
    dueDate: string
    priority: 'high' | 'medium' | 'low'
}

interface Task {
    id: string
    title: string
    project: string
    assignee: string
    status: 'todo' | 'in_progress' | 'review' | 'done'
    dueDate: string
}

interface Resource {
    id: string
    name: string
    role: string
    utilization: number
    projects: number
}

// Sample data
const PROJECTS: Project[] = [
    { id: '1', name: 'AgencyOS v2.0 Launch', status: 'active', progress: 75, team: 8, dueDate: 'Dec 31', priority: 'high' },
    { id: '2', name: 'Mobile App Development', status: 'active', progress: 45, team: 5, dueDate: 'Feb 15', priority: 'high' },
    { id: '3', name: 'Binh Pháp Course', status: 'active', progress: 90, team: 3, dueDate: 'Dec 20', priority: 'medium' },
    { id: '4', name: 'API Documentation', status: 'on_hold', progress: 30, team: 2, dueDate: 'Jan 30', priority: 'low' },
]

const TASKS: Task[] = [
    { id: '1', title: 'Finalize hub dashboards', project: 'AgencyOS v2.0', assignee: 'Dev Team', status: 'in_progress', dueDate: 'Today' },
    { id: '2', title: 'Record demo video', project: 'AgencyOS v2.0', assignee: 'Marketing', status: 'todo', dueDate: 'Tomorrow' },
    { id: '3', title: 'iOS build setup', project: 'Mobile App', assignee: 'Mobile Team', status: 'review', dueDate: 'Dec 22' },
    { id: '4', title: 'Chapter 13 completion', project: 'Binh Pháp Course', assignee: 'Content', status: 'done', dueDate: 'Done' },
]

const RESOURCES: Resource[] = [
    { id: '1', name: 'Engineering Team', role: 'Development', utilization: 95, projects: 3 },
    { id: '2', name: 'Design Team', role: 'UI/UX', utilization: 80, projects: 2 },
    { id: '3', name: 'Marketing Team', role: 'Growth', utilization: 70, projects: 2 },
]

const STATUS_COLORS: Record<string, string> = {
    active: '#00ff41',
    completed: '#8a2be2',
    on_hold: '#ffd700',
    planned: '#888',
    todo: '#888',
    in_progress: '#00bfff',
    review: '#ffd700',
    done: '#00ff41',
}

const PRIORITY_COLORS: Record<string, string> = {
    high: '#ff0000',
    medium: '#ffd700',
    low: '#00ff41',
}

export default function ProjectHubPage() {
    const [projects] = useState(PROJECTS)
    const [tasks] = useState(TASKS)
    const [resources] = useState(RESOURCES)

    const activeProjects = projects.filter(p => p.status === 'active').length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const avgProgress = (projects.reduce((sum, p) => sum + p.progress, 0) / projects.length).toFixed(0)
    const avgUtilization = (resources.reduce((sum, r) => sum + r.utilization, 0) / resources.length).toFixed(0)

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
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
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#00bfff' }}>📂</span> Project Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Projects • Tasks • Resources</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Active Projects', value: activeProjects, color: '#00bfff' },
                        { label: 'Avg Progress', value: `${avgProgress}%`, color: '#00ff41' },
                        { label: 'Tasks Done', value: `${completedTasks}/${tasks.length}`, color: '#ffd700' },
                        { label: 'Team Utilization', value: `${avgUtilization}%`, color: '#8a2be2' },
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

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem',
                }}>
                    {projects.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${STATUS_COLORS[project.status]}40`,
                                borderTop: `3px solid ${STATUS_COLORS[project.status]}`,
                                borderRadius: '12px',
                                padding: '1.25rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{project.name}</p>
                                <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    fontSize: '0.55rem',
                                    background: `${PRIORITY_COLORS[project.priority]}20`,
                                    color: PRIORITY_COLORS[project.priority],
                                }}>
                                    {project.priority}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ flex: 1, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${project.progress}%`,
                                        height: '100%',
                                        background: project.progress >= 70 ? '#00ff41' : project.progress >= 40 ? '#ffd700' : '#ff6347',
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{project.progress}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#888' }}>
                                <span>👥 {project.team}</span>
                                <span>📅 {project.dueDate}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0,191,255,0.2)',
                        borderTop: '3px solid #00bfff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#00bfff' }}>✅ Tasks</h3>
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
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{task.title}</p>
                                    <p style={{ color: '#888', fontSize: '0.7rem' }}>{task.project} • {task.assignee}</p>
                                </div>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.6rem',
                                    background: `${STATUS_COLORS[task.status]}20`,
                                    color: STATUS_COLORS[task.status],
                                }}>
                                    {task.status.replace('_', ' ')}
                                </span>
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
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#8a2be2' }}>👥 Resources</h3>
                        {resources.map((resource, i) => (
                            <div key={resource.id} style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{resource.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: resource.utilization >= 90 ? '#ff6347' : '#00ff41' }}>
                                        {resource.utilization}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${resource.utilization}%`,
                                            height: '100%',
                                            background: resource.utilization >= 90 ? '#ff6347' : resource.utilization >= 70 ? '#ffd700' : '#00ff41',
                                        }} />
                                    </div>
                                </div>
                                <p style={{ color: '#888', fontSize: '0.65rem', marginTop: '0.25rem' }}>{resource.role} • {resource.projects} projects</p>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Project Excellence
                </footer>
            </div>
        </div>
    )
}
