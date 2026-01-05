'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DollarSign, Users, TrendingUp, BarChart3, Loader2, Percent, FileText, FolderKanban } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, FunnelChart, Funnel, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { AnimatedCurrency, AnimatedNumber, AnimatedPercent, PulseIndicator } from '@/components/ui/AnimatedNumber';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ANALYTICS DASHBOARD - NOW WITH REAL DATA FROM SUPABASE
// Aggregates: clients, invoices, projects for comprehensive insights
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnalyticsPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');
    const { analytics, loading, error } = useAnalytics();

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const formatNumber = (num: number) => {
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <MD3AppShell title="Analytics Dashboard 📊" subtitle="Revenue • Clients • Projects • Insights">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - REAL DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <AnimatedCurrency value={analytics.totalRevenue} duration={1500} />}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: analytics.revenueGrowth >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {analytics.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(analytics.revenueGrowth).toFixed(1)}% vs last month
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Clients</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <AnimatedNumber value={analytics.activeClients} duration={1000} />}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    {analytics.totalClients} total clients
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <FolderKanban className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Projects</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <AnimatedNumber value={analytics.activeProjects} duration={1200} />}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    {analytics.projectCompletionRate.toFixed(0)}% completion rate
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Percent className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collection Rate</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <AnimatedPercent value={analytics.collectionRate} duration={1400} decimals={0} />}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    {formatCurrency(analytics.outstandingAmount)} outstanding
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
                            </div>
                        )}

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            {/* Traffic Sources */}
                            <MD3Card headline="Traffic Sources" subhead="Client Acquisition Channels">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={analytics.trafficSources}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={80}
                                                        dataKey="value"
                                                        paddingAngle={3}
                                                    >
                                                        {analytics.trafficSources.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {analytics.trafficSources.map((source) => (
                                                <div key={source.name} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface)' }}>{source.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: source.color }}>{source.value}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </MD3Card>

                            {/* Conversion Funnel */}
                            <MD3Card headline="Conversion Funnel" subhead="Client Journey (Real Data)">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    </div>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <FunnelChart>
                                                <Tooltip
                                                    content={({ payload }) => {
                                                        if (!payload || !payload[0]) return null;
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div style={{
                                                                background: 'var(--md-sys-color-surface-container-high)',
                                                                border: '1px solid var(--md-sys-color-outline)',
                                                                borderRadius: '8px',
                                                                padding: '8px 12px',
                                                            }}>
                                                                <div style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>{data.stage}</div>
                                                                <div style={{ color: data.fill }}>{data.value} clients</div>
                                                            </div>
                                                        );
                                                    }}
                                                />
                                                <Funnel dataKey="value" data={analytics.conversionFunnel} isAnimationActive>
                                                    {analytics.conversionFunnel.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Funnel>
                                            </FunnelChart>
                                        </ResponsiveContainer>
                                        <div className="grid grid-cols-4 gap-2 mt-4">
                                            {analytics.conversionFunnel.map((stage) => (
                                                <div key={stage.stage} className="text-center p-2 rounded" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)' }}>{stage.stage}</div>
                                                    <div style={{ fontWeight: 600, color: stage.fill }}>{stage.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </MD3Card>
                        </div>

                        {/* Monthly Trends */}
                        <MD3Card headline="Revenue Trends" subhead="Monthly Performance (6 Months)">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={analytics.monthlyTrends}>
                                        <XAxis dataKey="month" stroke="var(--md-sys-color-outline)" fontSize={12} />
                                        <YAxis stroke="var(--md-sys-color-outline)" fontSize={12} />
                                        <Tooltip
                                            content={({ payload }) => {
                                                if (!payload || !payload[0]) return null;
                                                const data = payload[0].payload;
                                                return (
                                                    <div style={{
                                                        background: 'var(--md-sys-color-surface-container-high)',
                                                        border: '1px solid var(--md-sys-color-outline)',
                                                        borderRadius: '8px',
                                                        padding: '8px 12px',
                                                    }}>
                                                        <div style={{ color: '#22c55e' }}>Revenue: {formatCurrency(data.revenue)}</div>
                                                        <div style={{ color: '#3b82f6' }}>Clients: {data.clients}</div>
                                                        <div style={{ color: '#a855f7' }}>Projects: {data.projects}</div>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <MD3Card headline="Key Metrics" subhead="Real-Time Summary">
                        <div className="space-y-4">
                            {/* Revenue Section */}
                            <div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-label-small-size)', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px', textTransform: 'uppercase' }}>Revenue</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Monthly MRR</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{formatCurrency(analytics.totalMRR)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Paid Invoices</span>
                                        <span style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>{analytics.paidInvoices}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Overdue</span>
                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{analytics.overdueInvoices}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', margin: '16px 0' }} />

                            {/* Clients Section */}
                            <div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-label-small-size)', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px', textTransform: 'uppercase' }}>Clients</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Active</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{analytics.activeClients}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Churned</span>
                                        <span style={{ fontWeight: 600, color: '#ef4444' }}>{analytics.churnedClients}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Churn Rate</span>
                                        <span style={{ fontWeight: 600, color: analytics.churnRate > 10 ? '#ef4444' : '#22c55e' }}>{analytics.churnRate.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', margin: '16px 0' }} />

                            {/* Projects Section */}
                            <div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-label-small-size)', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px', textTransform: 'uppercase' }}>Projects</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total</span>
                                        <span style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>{analytics.totalProjects}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Completed</span>
                                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{analytics.completedProjects}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </MD3Card>
                }
            />
        </MD3AppShell>
    );
}
