'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface RecordItem {
    id: string
    name: string
    employeeId: string
    department: string
    position: string
    status: 'active' | 'inactive' | 'pending'
    completeness: number
}

interface EnrollmentItem {
    id: string
    employeeName: string
    planName: string
    planType: 'health' | 'dental' | 'vision' | 'retirement'
    monthlyCost: number
    dependents: number
    status: 'enrolled' | 'pending' | 'waived'
}

// Sample data
const RECORDS: RecordItem[] = [
    { id: '1', name: 'Nguyen A', employeeId: 'EMP001', department: 'Engineering', position: 'Senior Engineer', status: 'active', completeness: 100 },
    { id: '2', name: 'Tran B', employeeId: 'EMP002', department: 'Product', position: 'Product Manager', status: 'active', completeness: 100 },
    { id: '3', name: 'Le C', employeeId: 'EMP003', department: 'Sales', position: 'Account Executive', status: 'active', completeness: 67 },
    { id: '4', name: 'Pham D', employeeId: 'EMP004', department: 'Engineering', position: 'Junior Developer', status: 'pending', completeness: 50 },
]

const ENROLLMENTS: EnrollmentItem[] = [
    { id: '1', employeeName: 'Nguyen A', planName: 'Premium Health', planType: 'health', monthlyCost: 500, dependents: 2, status: 'enrolled' },
    { id: '2', employeeName: 'Nguyen A', planName: 'Basic Dental', planType: 'dental', monthlyCost: 50, dependents: 2, status: 'enrolled' },
    { id: '3', employeeName: 'Tran B', planName: 'Premium Health', planType: 'health', monthlyCost: 500, dependents: 1, status: 'enrolled' },
    { id: '4', employeeName: 'Le C', planName: 'Vision Plus', planType: 'vision', monthlyCost: 25, dependents: 0, status: 'pending' },
]

const STATUS_COLORS = {
    active: '#00ff41',
    inactive: '#888',
    pending: '#ffd700',
    enrolled: '#00ff41',
    waived: '#888',
}

const PLAN_COLORS = {
    health: '#e74c3c',
    dental: '#3498db',
    vision: '#9b59b6',
    retirement: '#27ae60',
}

export default function HRISDashboard() {
    const [records] = useState<RecordItem[]>(RECORDS)
    const [enrollments] = useState<EnrollmentItem[]>(ENROLLMENTS)

    const activeRecords = records.filter(r => r.status === 'active').length
    const avgCompleteness = Math.round(records.reduce((sum, r) => sum + r.completeness, 0) / records.length)
    const activeEnrollments = enrollments.filter(e => e.status === 'enrolled').length
    const totalMonthlyCost = enrollments.filter(e => e.status === 'enrolled').reduce((sum, e) => sum + e.monthlyCost * (1 + e.dependents * 0.5), 0)

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
                        <span style={{ color: '#3498db' }}>🖥️</span> HRIS Operations
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>HR Data & Benefits</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Active Records', value: activeRecords, color: '#00ff41' },
                        { label: 'Data Complete', value: `${avgCompleteness}%`, color: '#00bfff' },
                        { label: 'Enrollments', value: activeEnrollments, color: '#9b59b6' },
                        { label: 'Monthly Cost', value: `$${(totalMonthlyCost / 1000).toFixed(1)}K`, color: '#ffd700' },
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

                    {/* Employee Records */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>EMPLOYEE RECORDS</h3>

                        {records.map((record, i) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{record.name}</span>
                                        <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{record.employeeId}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[record.status]}20`,
                                        color: STATUS_COLORS[record.status],
                                    }}>
                                        {record.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>{record.position} • {record.department}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                            <div style={{
                                                width: `${record.completeness}%`,
                                                height: '100%',
                                                background: record.completeness >= 80 ? '#00ff41' : '#ffd700',
                                                borderRadius: 2,
                                            }} />
                                        </div>
                                        <span style={{ color: record.completeness >= 80 ? '#00ff41' : '#ffd700' }}>{record.completeness}%</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Benefits Enrollments */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>BENEFITS ENROLLMENTS</h3>

                        {enrollments.map((enrollment, i) => (
                            <motion.div
                                key={enrollment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${PLAN_COLORS[enrollment.planType]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{enrollment.employeeName}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${PLAN_COLORS[enrollment.planType]}20`,
                                            color: PLAN_COLORS[enrollment.planType],
                                        }}>
                                            {enrollment.planType}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[enrollment.status]}20`,
                                        color: STATUS_COLORS[enrollment.status],
                                    }}>
                                        {enrollment.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                                    <span>{enrollment.planName}</span>
                                    <div>
                                        <span style={{ color: '#00ff41' }}>${enrollment.monthlyCost}/mo</span>
                                        {enrollment.dependents > 0 && (
                                            <span style={{ marginLeft: '0.5rem' }}>+{enrollment.dependents} dep</span>
                                        )}
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
