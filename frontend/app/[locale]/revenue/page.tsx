'use client';

import React from 'react';
import { DollarSign, TrendingUp, Target, Crown, Loader2, Users, FileText, FolderKanban, RefreshCw, Zap } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useMRR, formatCurrency as formatMRR, formatPercentage } from '@/hooks/useMRR';

export default function RevenuePage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading } = useAnalytics();
    const { metrics: stripeMetrics, loading: mrrLoading, refresh, lastUpdated, growthRate, isMock } = useMRR(true, 60000); // Auto-refresh every 60s

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    // War chest = total revenue + outstanding
    const warChest = analytics.totalRevenue + analytics.outstandingAmount;
    // Target (configurable, default $1M)
    const target = 1000000;
    // Progress
    const progress = target > 0 ? Math.round((warChest / target) * 100) : 0;

    return (
        <MD3AppShell title="Revenue Dashboard 💰" subtitle="Mission Control • War Chest • Growth">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - REAL DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Crown className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>War Chest</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(warChest)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {progress}% of target
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(analytics.totalRevenue)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: analytics.revenueGrowth >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {analytics.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(analytics.revenueGrowth).toFixed(1)}%
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly MRR</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(analytics.totalMRR)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {analytics.activeClients} active clients
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>
                                    {formatCurrency(target)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Annual goal
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Operational Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-4">
                                    <Users className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)' }}>Clients</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Active</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{loading ? '...' : analytics.activeClients}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Churned</span>
                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{loading ? '...' : analytics.churnedClients}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Churn Rate</span>
                                        <span style={{ fontWeight: 600 }}>{loading ? '...' : `${analytics.churnRate.toFixed(1)}%`}</span>
                                    </div>
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-4">
                                    <FolderKanban className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)' }}>Projects</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Active</span>
                                        <span style={{ fontWeight: 600, color: '#3b82f6' }}>{loading ? '...' : analytics.activeProjects}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Completed</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{loading ? '...' : analytics.completedProjects}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Completion</span>
                                        <span style={{ fontWeight: 600 }}>{loading ? '...' : `${analytics.projectCompletionRate.toFixed(0)}%`}</span>
                                    </div>
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-4">
                                    <FileText className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)' }}>Invoices</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Paid</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{loading ? '...' : analytics.paidInvoices}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Overdue</span>
                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{loading ? '...' : analytics.overdueInvoices}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Collection</span>
                                        <span style={{ fontWeight: 600 }}>{loading ? '...' : `${analytics.collectionRate.toFixed(0)}%`}</span>
                                    </div>
                                </div>
                            </MD3Surface>
                        </div>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card headline="Quick Stats" subhead="This Month">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>War Chest</span>
                                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>{formatCurrency(warChest)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Target</span>
                                    <span style={{ color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>{formatCurrency(target)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Progress</span>
                                    <span style={{ fontWeight: 600, color: progress >= 80 ? '#22c55e' : progress >= 50 ? '#f59e0b' : '#ef4444' }}>{progress}%</span>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-4 h-3 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(progress, 100)}%`,
                                        backgroundColor: progress >= 80 ? '#22c55e' : progress >= 50 ? '#f59e0b' : '#ef4444'
                                    }}
                                />
                            </div>
                        </MD3Card>
                        <MD3Card headline="Quick Actions" subhead="Revenue Tools">
                            <div className="space-y-2">
                                {[{ icon: '📈', label: 'Dashboard' }, { icon: '💳', label: 'Invoices' }, { icon: '📊', label: 'Reports' }, { icon: '🎯', label: 'Set Target' }].map((action) => (
                                    <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                        <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>

                        {/* Stripe MRR - Real-time */}
                        <MD3Card headline="Stripe MRR ⚡" subhead={isMock ? 'Demo Mode' : 'Live Data'}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>MRR</span>
                                    <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: 'var(--md-sys-typescale-title-large-size)' }}>
                                        {mrrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : formatMRR(stripeMetrics?.mrr || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>ARR</span>
                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                        {mrrLoading ? '...' : formatMRR(stripeMetrics?.arr || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Active Subs</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {mrrLoading ? '...' : stripeMetrics?.activeSubscriptions || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Growth</span>
                                    <span style={{ fontWeight: 600, color: growthRate >= 0 ? '#22c55e' : '#ef4444' }}>
                                        {formatPercentage(growthRate)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>ARPU</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {mrrLoading ? '...' : formatMRR(stripeMetrics?.averageRevenuePerUser || 0)}
                                    </span>
                                </div>

                                {/* Refresh button */}
                                <button
                                    onClick={refresh}
                                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors"
                                    style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}
                                >
                                    <RefreshCw className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Refresh'}
                                    </span>
                                </button>
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
