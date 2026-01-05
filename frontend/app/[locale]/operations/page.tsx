'use client';

import React from 'react';
import { Settings, TrendingUp, Clock, CheckCircle, AlertTriangle, Loader2, FolderKanban, DollarSign, Users } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function OperationsPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading, clients, projects, invoices } = useAnalytics();

    // Compute operational metrics from real data
    const efficiency = analytics.totalProjects > 0
        ? Math.round(analytics.projectCompletionRate)
        : 0;

    // Average project duration (cycle time)
    const completedProjects = projects.filter(p => p.status === 'completed');
    const avgCycleTime = completedProjects.length > 0
        ? completedProjects.reduce((sum, p) => {
            if (p.start_date && p.end_date) {
                const start = new Date(p.start_date);
                const end = new Date(p.end_date);
                return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            }
            return sum + 7; // default 7 days
        }, 0) / completedProjects.length
        : 0;

    // Quality = collection rate
    const quality = analytics.collectionRate;

    // Issues = overdue invoices + at-risk projects
    const atRiskProjects = projects.filter(p => {
        if (p.status !== 'active') return false;
        if (!p.end_date) return true;
        return new Date(p.end_date) < new Date();
    }).length;
    const issues = analytics.overdueInvoices + atRiskProjects;

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    return (
        <MD3AppShell title="Operations Hub ⚙️" subtitle="Processes • Efficiency • Quality • Metrics">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - REAL DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Efficiency</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${efficiency}%`}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Project completion rate
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cycle Time</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${avgCycleTime.toFixed(1)}d`}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Avg project duration
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quality</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${quality.toFixed(1)}%`}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Collection rate
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issues</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : issues}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Overdue + at-risk
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Operational Overview - REAL DATA */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-4">
                                    <FolderKanban className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)', color: 'var(--md-sys-color-on-surface)' }}>Projects</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total</span>
                                        <span style={{ fontWeight: 600 }}>{analytics.totalProjects}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Active</span>
                                        <span style={{ fontWeight: 600, color: '#3b82f6' }}>{analytics.activeProjects}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Completed</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{analytics.completedProjects}</span>
                                    </div>
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-4">
                                    <Users className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)', color: 'var(--md-sys-color-on-surface)' }}>Clients</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total</span>
                                        <span style={{ fontWeight: 600 }}>{analytics.totalClients}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Active</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{analytics.activeClients}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Churned</span>
                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{analytics.churnedClients}</span>
                                    </div>
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-4">
                                    <DollarSign className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)', color: 'var(--md-sys-color-on-surface)' }}>Invoices</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total</span>
                                        <span style={{ fontWeight: 600 }}>{analytics.totalInvoices}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Paid</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{analytics.paidInvoices}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Overdue</span>
                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{analytics.overdueInvoices}</span>
                                    </div>
                                </div>
                            </MD3Surface>
                        </div>
                    </>
                }
                supportingContent={
                    <MD3Card headline="Quick Actions" subhead="Ops Tools">
                        <div className="space-y-2">
                            {[{ icon: '📊', label: 'Dashboard' }, { icon: '⚙️', label: 'Processes' }, { icon: '📋', label: 'Tasks' }, { icon: '⚠️', label: 'Issues' }, { icon: '📈', label: 'Reports' }, { icon: '🔧', label: 'Settings' }].map((action) => (
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
