'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Activity,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Database,
    Play,
    Pause,
    MoreHorizontal
} from 'lucide-react'
import { AgencyCard } from '@/components/ui/agency-card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Separator } from '@/components/ui/separator'

// Mock Data (until API is connected)
const MOCK_METRICS = {
    high: 5,
    normal: 42,
    low: 128,
    dlq: 2,
    scheduled: 15
}

const MOCK_WORKERS = [
    { id: 'worker-email-01', queues: ['high'], status: 'active', last_heartbeat: '2s ago' },
    { id: 'worker-report-01', queues: ['normal'], status: 'active', last_heartbeat: '5s ago' },
    { id: 'worker-export-01', queues: ['low'], status: 'idle', last_heartbeat: '30s ago' },
]

const MOCK_JOBS = [
    { id: 'job-123', type: 'send_email', status: 'completed', priority: 'high', created_at: '2 mins ago', duration: '120ms' },
    { id: 'job-124', type: 'generate_report', status: 'processing', priority: 'normal', created_at: '5 mins ago', duration: '-' },
    { id: 'job-125', type: 'export_data', status: 'pending', priority: 'low', created_at: '1 hour ago', duration: '-' },
    { id: 'job-126', type: 'process_webhook', status: 'failed', priority: 'normal', created_at: '3 hours ago', duration: '500ms' },
    { id: 'job-127', type: 'send_email', status: 'scheduled', priority: 'high', created_at: '10 mins ago', duration: '-' },
]

export default function JobsDashboard() {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')

    const refreshData = () => {
        setIsLoading(true)
        // Simulate API call
        setTimeout(() => setIsLoading(false), 800)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Job Queues</h1>
                    <p className="text-neutral-400 text-sm">Monitor background workers and async tasks</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outlined" onClick={refreshData} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard label="High Priority" value={MOCK_METRICS.high} color="text-red-400" icon={Activity} />
                <MetricCard label="Normal" value={MOCK_METRICS.normal} color="text-blue-400" icon={Database} />
                <MetricCard label="Low Priority" value={MOCK_METRICS.low} color="text-neutral-400" icon={Clock} />
                <MetricCard label="Scheduled" value={MOCK_METRICS.scheduled} color="text-purple-400" icon={Clock} />
                <MetricCard label="Dead Letter" value={MOCK_METRICS.dlq} color="text-orange-400" icon={AlertTriangle} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Jobs List */}
                <div className="lg:col-span-2 space-y-6">
                    <AgencyCard className="p-0 overflow-hidden min-h-[500px]">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="font-semibold text-white">Recent Jobs</h3>
                            <div className="flex gap-2">
                                {['All', 'Active', 'Failed'].map(filter => (
                                    <button
                                        key={filter}
                                        className="text-xs px-2 py-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {MOCK_JOBS.map((job) => (
                                <div key={job.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <StatusIcon status={job.status} />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium text-sm">{job.type}</span>
                                                <span className="text-xs text-neutral-500 font-mono">{job.id}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                                                <span className={`px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 ${getPriorityColor(job.priority)}`}>
                                                    {job.priority}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {job.created_at}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-neutral-400">Duration</div>
                                            <div className="text-sm text-white font-mono">{job.duration}</div>
                                        </div>
                                        <Button variant="text" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AgencyCard>
                </div>

                {/* Sidebar: Workers & Controls */}
                <div className="space-y-6">
                    {/* Worker Status */}
                    <AgencyCard className="p-5">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            Active Workers ({MOCK_WORKERS.length})
                        </h3>
                        <div className="space-y-3">
                            {MOCK_WORKERS.map(worker => (
                                <div key={worker.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-white truncate max-w-[120px]">{worker.id}</span>
                                        <StatusBadge status={(worker.status === 'active' ? 'active' : 'inactive') as any} />
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {worker.queues.map(q => (
                                            <span key={q} className="text-[10px] px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400 border border-white/5">
                                                {q}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-[10px] text-neutral-500 text-right">
                                        Heartbeat: {worker.last_heartbeat}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AgencyCard>

                    {/* Quick Actions */}
                    <AgencyCard className="p-5">
                        <h3 className="font-bold text-white mb-4">Actions</h3>
                        <div className="space-y-2">
                            <Button variant="outlined" className="w-full justify-start text-xs h-8">
                                <Play className="w-3 h-3 mr-2 text-emerald-400" />
                                Resume All Queues
                            </Button>
                            <Button variant="outlined" className="w-full justify-start text-xs h-8">
                                <Pause className="w-3 h-3 mr-2 text-yellow-400" />
                                Pause Processing
                            </Button>
                            <Button variant="outlined" className="w-full justify-start text-xs h-8">
                                <RefreshCw className="w-3 h-3 mr-2 text-blue-400" />
                                Retry Failed Jobs
                            </Button>
                            <Button variant="outlined" className="w-full justify-start text-xs h-8 text-red-400 hover:text-red-300">
                                <XCircle className="w-3 h-3 mr-2" />
                                Purge Dead Letter Queue
                            </Button>
                        </div>
                    </AgencyCard>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, color, icon: Icon }: any) {
    return (
        <AgencyCard variant="glass" className="p-4 flex flex-col items-center justify-center text-center">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-neutral-400">{label}</div>
        </AgencyCard>
    )
}

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />
        case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
        case 'processing': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
        case 'scheduled': return <Clock className="w-5 h-5 text-purple-500" />
        default: return <div className="w-5 h-5 rounded-full border-2 border-neutral-600" />
    }
}

function getPriorityColor(priority: string) {
    switch (priority) {
        case 'high': return 'text-red-400 border-red-400/20'
        case 'low': return 'text-neutral-400 border-neutral-400/20'
        default: return 'text-blue-400 border-blue-400/20'
    }
}
