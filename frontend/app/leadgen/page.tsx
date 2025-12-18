'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface FormItem {
    id: string
    name: string
    type: 'demo' | 'contact' | 'newsletter' | 'download'
    views: number
    submissions: number
    conversionRate: number
}

interface LeadItem {
    id: string
    email: string
    company: string
    status: 'new' | 'enriched' | 'routed' | 'synced'
    score: number
    assignedTo: string
}

// Sample data
const FORMS: FormItem[] = [
    { id: '1', name: 'Demo Request', type: 'demo', views: 2500, submissions: 150, conversionRate: 6.0 },
    { id: '2', name: 'Contact Form', type: 'contact', views: 1800, submissions: 85, conversionRate: 4.7 },
    { id: '3', name: 'Newsletter Signup', type: 'newsletter', views: 5000, submissions: 420, conversionRate: 8.4 },
    { id: '4', name: 'Ebook Download', type: 'download', views: 1200, submissions: 95, conversionRate: 7.9 },
]

const LEADS: LeadItem[] = [
    { id: '1', email: 'john@acme.com', company: 'Acme Corp', status: 'synced', score: 85, assignedTo: 'Rep A' },
    { id: '2', email: 'sarah@tech.io', company: 'TechIO', status: 'routed', score: 72, assignedTo: 'Rep B' },
    { id: '3', email: 'mike@startup.co', company: 'Startup Co', status: 'enriched', score: 65, assignedTo: '' },
    { id: '4', email: 'lisa@enterprise.com', company: 'Enterprise Inc', status: 'new', score: 45, assignedTo: '' },
]

const TYPE_COLORS = {
    demo: '#ff5f56',
    contact: '#00bfff',
    newsletter: '#00ff41',
    download: '#ffd700',
}

const STATUS_COLORS = {
    new: '#888',
    enriched: '#ffd700',
    routed: '#00bfff',
    synced: '#00ff41',
}

export default function LeadGenDashboard() {
    const [forms] = useState<FormItem[]>(FORMS)
    const [leads] = useState<LeadItem[]>(LEADS)

    const totalViews = forms.reduce((sum, f) => sum + f.views, 0)
    const totalLeads = leads.length
    const avgConversion = forms.reduce((sum, f) => sum + f.conversionRate, 0) / forms.length
    const syncedLeads = leads.filter(l => l.status === 'synced').length

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
                        <span style={{ color: '#00ff41' }}>🧲</span> Lead Generation
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Capture & Management</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Form Views', value: (totalViews / 1000).toFixed(1) + 'K', color: '#00bfff' },
                        { label: 'Total Leads', value: totalLeads, color: '#00ff41' },
                        { label: 'Avg Conversion', value: `${avgConversion.toFixed(1)}%`, color: '#ffd700' },
                        { label: 'Synced to CRM', value: syncedLeads, color: '#9b59b6' },
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

                    {/* Forms */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>CAPTURE FORMS</h3>

                        {forms.map((form, i) => (
                            <motion.div
                                key={form.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[form.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{form.name}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[form.type]}20`,
                                            color: TYPE_COLORS[form.type],
                                        }}>
                                            {form.type}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#888' }}>👁️ {form.views.toLocaleString()}</span>
                                    <span style={{ color: '#00ff41' }}>📝 {form.submissions}</span>
                                    <span style={{ color: '#ffd700' }}>📈 {form.conversionRate}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Leads */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>LEAD PIPELINE</h3>

                        {leads.map((lead, i) => (
                            <motion.div
                                key={lead.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${STATUS_COLORS[lead.status]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{lead.email}</span>
                                        <span style={{ color: '#888', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{lead.company}</span>
                                    </div>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        background: `${STATUS_COLORS[lead.status]}20`,
                                        color: STATUS_COLORS[lead.status],
                                    }}>
                                        {lead.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#00bfff' }}>⭐ Score: {lead.score}</span>
                                    {lead.assignedTo && <span style={{ color: '#00ff41' }}>👤 {lead.assignedTo}</span>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
