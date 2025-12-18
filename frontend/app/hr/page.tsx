'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface JobItem {
    id: string
    title: string
    department: string
    location: string
    salary: string
    status: 'open' | 'paused' | 'filled'
    candidates: number
}

interface EmployeeItem {
    id: string
    name: string
    title: string
    department: string
    status: 'active' | 'on_leave' | 'probation'
    performance: number
    tenure: number
}

// Sample data
const JOBS: JobItem[] = [
    { id: '1', title: 'Senior Engineer', department: 'Engineering', location: 'Ho Chi Minh', salary: '$2000-3000', status: 'open', candidates: 12 },
    { id: '2', title: 'Product Manager', department: 'Product', location: 'Ha Noi', salary: '$2500-3500', status: 'open', candidates: 8 },
    { id: '3', title: 'UX Designer', department: 'Design', location: 'Remote', salary: '$1500-2500', status: 'filled', candidates: 5 },
]

const EMPLOYEES: EmployeeItem[] = [
    { id: '1', name: 'Nguyen A', title: 'Senior Engineer', department: 'Engineering', status: 'active', performance: 4.8, tenure: 24 },
    { id: '2', name: 'Tran B', title: 'Product Manager', department: 'Product', status: 'active', performance: 4.5, tenure: 18 },
    { id: '3', name: 'Le C', title: 'Account Executive', department: 'Sales', status: 'on_leave', performance: 4.2, tenure: 12 },
    { id: '4', name: 'Pham D', title: 'Junior Developer', department: 'Engineering', status: 'probation', performance: 3.8, tenure: 2 },
]

const STATUS_COLORS = {
    open: '#00ff41',
    paused: '#ffd700',
    filled: '#888',
    active: '#00ff41',
    on_leave: '#ffd700',
    probation: '#00bfff',
}

export default function HRDashboard() {
    const [jobs] = useState<JobItem[]>(JOBS)
    const [employees] = useState<EmployeeItem[]>(EMPLOYEES)

    const openJobs = jobs.filter(j => j.status === 'open').length
    const totalCandidates = jobs.reduce((sum, j) => sum + j.candidates, 0)
    const activeEmployees = employees.filter(e => e.status === 'active').length
    const avgPerformance = (employees.reduce((sum, e) => sum + e.performance, 0) / employees.length).toFixed(1)

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
                        <span style={{ color: '#e91e63' }}>👥</span> Human Resources
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Recruitment & Employees</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Open Positions', value: openJobs, color: '#00ff41' },
                        { label: 'Candidates', value: totalCandidates, color: '#00bfff' },
                        { label: 'Active Employees', value: activeEmployees, color: '#fff' },
                        { label: 'Avg Performance', value: avgPerformance, color: '#ffd700' },
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

                    {/* Jobs */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>OPEN POSITIONS</h3>

                        {jobs.map((job, i) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[job.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{job.title}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${STATUS_COLORS[job.status]}20`,
                                            color: STATUS_COLORS[job.status],
                                        }}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <span style={{ color: '#00bfff', fontSize: '0.8rem' }}>{job.candidates} candidates</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>{job.department} • {job.location}</span>
                                    <span style={{ color: '#00ff41' }}>{job.salary}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Employees */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>TEAM DIRECTORY</h3>

                        {employees.map((emp, i) => (
                            <motion.div
                                key={emp.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${STATUS_COLORS[emp.status]}, ${STATUS_COLORS[emp.status]}50)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                }}>
                                    {emp.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{emp.name}</p>
                                    <p style={{ color: '#888', fontSize: '0.75rem' }}>{emp.title} • {emp.department}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#ffd700', fontSize: '0.85rem' }}>⭐ {emp.performance}</p>
                                    <p style={{ color: '#888', fontSize: '0.7rem' }}>{emp.tenure}mo tenure</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
