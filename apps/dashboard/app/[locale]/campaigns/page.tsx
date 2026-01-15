'use client';

import React from 'react';
import { Target, TrendingUp, DollarSign, Users, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function CampaignsPage() {
    const { analytics, loading, projects, clients } = useAnalytics();

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    // Derive campaign metrics from projects (treating projects as campaigns)
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const avgROI = analytics.collectionRate > 0 ? (analytics.collectionRate / 25).toFixed(1) : '0';

    // Channel distribution (derived from project types)
    const channelDistribution = [
        { name: 'Retainer', value: projects.filter(p => p.type === 'retainer').length, fill: '#3b82f6' },
        { name: 'Project', value: projects.filter(p => p.type === 'project').length, fill: '#10b981' },
        { name: 'Hourly', value: projects.filter(p => p.type === 'hourly').length, fill: '#a855f7' },
        { name: 'Other', value: projects.filter(p => !p.type).length, fill: '#f59e0b' },
    ].filter(c => c.value > 0);

    return (
        <MD3AppShell title="Campaign Dashboard 🎯" subtitle="Campaigns • ROI • Budget • Performance">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - REAL DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#f97316' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Budget</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f97316' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(totalBudget)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    From {analytics.totalProjects} projects
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(analytics.totalRevenue)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Total collected
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clients</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : analytics.activeClients}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Active
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg ROI</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${avgROI}x`}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Return on investment
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            <MD3Card headline="Budget by Project Type" subhead="Real Data">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    </div>
                                ) : channelDistribution.length === 0 ? (
                                    <div className="text-center py-16" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        No projects yet
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie data={channelDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                                        {channelDistribution.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.9} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {channelDistribution.map((item) => (
                                                <div key={item.name} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                                        <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: item.fill }}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </MD3Card>

                            <MD3Card headline="Revenue Trend" subhead="6-Month Performance">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={analytics.monthlyTrends}>
                                            <XAxis dataKey="month" stroke="var(--md-sys-color-outline)" fontSize={10} />
                                            <YAxis stroke="var(--md-sys-color-outline)" fontSize={10} />
                                            <Tooltip
                                                content={({ payload }) => {
                                                    if (!payload || !payload[0]) return null;
                                                    return (
                                                        <div style={{
                                                            background: 'var(--md-sys-color-surface-container-high)',
                                                            border: '1px solid var(--md-sys-color-outline)',
                                                            borderRadius: '8px',
                                                            padding: '8px 12px',
                                                        }}>
                                                            <div style={{ color: '#f97316' }}>{formatCurrency(payload[0].payload.revenue)}</div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </MD3Card>
                        </div>

                        {/* Projects as Campaigns */}
                        <MD3Card headline="Active Campaigns" subhead="Projects from Supabase">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="text-center py-8" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    No campaigns (projects) yet
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                                <th className="text-left p-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Campaign</th>
                                                <th className="text-left p-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Type</th>
                                                <th className="text-right p-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Budget</th>
                                                <th className="text-left p-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projects.slice(0, 10).map((project) => (
                                                <tr key={project.id} style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                                    <td className="p-3" style={{ fontWeight: 600, color: '#f97316' }}>{project.name}</td>
                                                    <td className="p-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{project.type || 'N/A'}</td>
                                                    <td className="p-3 text-right" style={{ fontFamily: 'monospace' }}>{formatCurrency(project.budget || 0)}</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-1 rounded text-xs" style={{
                                                            backgroundColor: project.status === 'active' ? 'rgba(34, 197, 94, 0.2)' :
                                                                project.status === 'completed' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                                                            color: project.status === 'active' ? '#22c55e' :
                                                                project.status === 'completed' ? '#3b82f6' : '#9ca3af'
                                                        }}>
                                                            {project.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <MD3Card headline="Quick Actions" subhead="Campaign Tools">
                        <div className="space-y-2">
                            {[{ icon: '🎯', label: 'New Campaign' }, { icon: '📊', label: 'Analytics' }, { icon: '💰', label: 'Budget' }, { icon: '📈', label: 'Reports' }].map((action) => (
                                <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                    <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                    <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </MD3Card>
                }
            />
        </MD3AppShell>
    );
}
