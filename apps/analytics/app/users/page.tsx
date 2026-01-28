'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, UserCheck, Clock } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts'
import { analyticsApi, DailyMetric } from '@/lib/api'

// --- Components ---

interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: React.ElementType;
}

function StatCard({ title, value, subtext, icon: Icon }: StatCardProps) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <p className="text-sm font-medium text-neutral-400">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                    {subtext && <p className="text-xs text-neutral-500 mt-1">{subtext}</p>}
                </div>
            </div>
        </div>
    )
}

// --- Page ---

export default function UsersPage() {
    const [activeUsers, setActiveUsers] = useState<DailyMetric[]>([])
    const [newUsers, setNewUsers] = useState<DailyMetric[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const [active, newU] = await Promise.all([
                    analyticsApi.getDailyMetrics('total_users', 30), // Should imply active
                    analyticsApi.getDailyMetrics('new_users', 30)
                ])
                setActiveUsers(active)
                setNewUsers(newU)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) return <div className="p-8 text-center text-neutral-500">Loading User Data...</div>

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">User Behavior</h1>
                <p className="text-neutral-400">Analyze user growth, retention, and engagement patterns.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Users" value="1,240" subtext="All time signups" icon={Users} />
                <StatCard title="New (30d)" value="450" subtext="+12% growth" icon={UserPlus} />
                <StatCard title="Active (DAU)" value="820" subtext="66% stickiness" icon={UserCheck} />
                <StatCard title="Avg. Session" value="4m 32s" subtext="+15s vs prev" icon={Clock} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Users Trend */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white">Active Users</h3>
                        <p className="text-sm text-neutral-400">Daily Active Users (30 days)</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...activeUsers].reverse()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="metric_value" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* New Signups */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white">New Signups</h3>
                        <p className="text-sm text-neutral-400">Daily acquisition</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...newUsers].reverse()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="metric_value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Retention Cohorts (Mock Visual) */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white">Retention Cohorts</h3>
                    <p className="text-sm text-neutral-400">Weekly user retention rates</p>
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-[600px] text-sm">
                        <div className="grid grid-cols-9 gap-1 mb-2 text-neutral-500 font-medium">
                            <div className="col-span-2">Cohort</div>
                            <div>Wk 0</div>
                            <div>Wk 1</div>
                            <div>Wk 2</div>
                            <div>Wk 3</div>
                            <div>Wk 4</div>
                            <div>Wk 5</div>
                            <div>Wk 6</div>
                        </div>
                        {[
                            { date: 'Jan 01', users: 150, ret: [100, 85, 75, 70, 68, 65, 62] },
                            { date: 'Jan 08', users: 180, ret: [100, 82, 74, 68, 65, 60, 0] },
                            { date: 'Jan 15', users: 210, ret: [100, 88, 78, 72, 70, 0, 0] },
                            { date: 'Jan 22', users: 240, ret: [100, 84, 76, 71, 0, 0, 0] },
                            { date: 'Jan 29', users: 200, ret: [100, 86, 79, 0, 0, 0, 0] },
                        ].map((row, i) => (
                            <div key={i} className="grid grid-cols-9 gap-1 mb-1 items-center">
                                <div className="col-span-2 flex items-center gap-2">
                                    <span className="text-white font-medium">{row.date}</span>
                                    <span className="text-xs text-neutral-500">{row.users} users</span>
                                </div>
                                {row.ret.map((val, j) => (
                                    <div key={j} className="h-10 flex items-center justify-center rounded bg-blue-500"
                                        style={{
                                            opacity: val === 0 ? 0.05 : val / 100,
                                            backgroundColor: val === 0 ? 'transparent' : undefined
                                        }}
                                    >
                                        {val > 0 && <span className="text-white font-medium drop-shadow-sm">{val}%</span>}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
