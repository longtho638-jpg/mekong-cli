'use client';

import React from 'react';
import { DollarSign, PieChart, TrendingDown, AlertTriangle, Loader2, Receipt, FileText, FolderKanban } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function CostsPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading, projects } = useAnalytics();

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    // Derive cost metrics from projects (budget) and invoices (what's collected)
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const budgetUsed = analytics.totalRevenue > 0 && totalBudget > 0
        ? Math.round((analytics.totalRevenue / totalBudget) * 100)
        : 0;

    // Savings = Outstanding (money coming in)
    const savings = analytics.outstandingAmount;

    // Overruns = overdue invoices count
    const overruns = analytics.overdueInvoices;

    // Cost breakdown by project type
    const costBreakdown = [
        { name: 'Retainer', value: projects.filter(p => p.type === 'retainer').reduce((s, p) => s + (p.budget || 0), 0), fill: '#3b82f6' },
        { name: 'Project', value: projects.filter(p => p.type === 'project').reduce((s, p) => s + (p.budget || 0), 0), fill: '#10b981' },
        { name: 'Hourly', value: projects.filter(p => p.type === 'hourly').reduce((s, p) => s + (p.budget || 0), 0), fill: '#a855f7' },
        { name: 'Other', value: projects.filter(p => !p.type).reduce((s, p) => s + (p.budget || 0), 0), fill: '#f59e0b' },
    ].filter(c => c.value > 0);

    return (
        <MD3AppShell title="Costs Hub 💰" subtitle="Budget • Expenses • Savings • Optimization">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - REAL DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#ef4444' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Budget</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#ef4444' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(totalBudget)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    From {analytics.totalProjects} projects
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <PieChart className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue Rate</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${budgetUsed}%`}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {budgetUsed >= 80 ? 'On Track' : 'Below Target'}
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingDown className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(savings)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Pending collection
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: overruns > 0 ? '#ef4444' : '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : overruns}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    invoices
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Budget Breakdown Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            <MD3Card headline="Budget by Type" subhead="Project Allocation">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    </div>
                                ) : costBreakdown.length === 0 ? (
                                    <div className="text-center py-16" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        No projects yet
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <ResponsiveContainer width="100%" height={200}>
                                                <RechartsPie>
                                                    <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                                        {costBreakdown.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.9} />
                                                        ))}
                                                    </Pie>
                                                </RechartsPie>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {costBreakdown.map((item) => (
                                                <div key={item.name} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                                        <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: item.fill }}>{formatCurrency(item.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </MD3Card>

                            <MD3Card headline="Financial Summary" subhead="Real-Time Stats">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total Revenue</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{formatCurrency(analytics.totalRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Outstanding</span>
                                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>{formatCurrency(analytics.outstandingAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Collection Rate</span>
                                        <span style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>{analytics.collectionRate.toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Monthly MRR</span>
                                        <span style={{ fontWeight: 600, color: '#3b82f6' }}>{formatCurrency(analytics.totalMRR)}</span>
                                    </div>
                                </div>
                            </MD3Card>
                        </div>
                    </>
                }
                supportingContent={
                    <MD3Card headline="Quick Actions" subhead="Cost Tools">
                        <div className="space-y-2">
                            {[{ icon: '📊', label: 'Budget' }, { icon: '📋', label: 'Expenses' }, { icon: '💹', label: 'Forecast' }, { icon: '🎯', label: 'Optimize' }, { icon: '📈', label: 'Reports' }, { icon: '⚙️', label: 'Settings' }].map((action) => (
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
