'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { TrendingUp, DollarSign, Users, Target, RefreshCw, Loader2, ChevronRight, Award, Zap, BarChart3 } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useMRR, formatCurrency, formatPercentage } from '@/hooks/useMRR';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Plan breakdown colors
const PLAN_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function InvestorPortalPage() {
    const { metrics, loading, error, isMock, lastUpdated, growthRate, churnRate, refresh } = useMRR(true, 30000); // Auto-refresh every 30s
    const locale = useLocale();

    // Unit economics
    const ltv = metrics ? (metrics.averageRevenuePerUser / 0.05) : 0; // Assuming 5% churn
    const cac = 150; // Example CAC
    const ltvCacRatio = cac > 0 ? (ltv / cac).toFixed(1) : '0';

    // Magic number (SaaS growth efficiency)
    const magicNumber = metrics ? ((metrics.netNewMRR * 4) / 50000).toFixed(2) : '0'; // Example spend

    return (
        <MD3AppShell title="Investor Portal 🏆" subtitle="Real-time SaaS Metrics • Series A Ready">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* Hero Metrics - REAL STRIPE DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MRR</span>
                                    {!isMock && <Zap className="w-3 h-3" style={{ color: '#22c55e' }} />}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(metrics?.mrr || 0)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: growthRate >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {formatPercentage(growthRate)} MoM
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ARR</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(metrics?.arr || 0)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Annual Run Rate
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customers</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : metrics?.activeSubscriptions || 0}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Active subscriptions
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ARPU</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(metrics?.averageRevenuePerUser || 0)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Avg Revenue/User
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
                            </div>
                        )}

                        {/* MRR Growth Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            <MD3Surface shape="large" className="auto-safe">
                                <h3 style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)', marginBottom: '16px' }}>
                                    MRR Growth Trend
                                </h3>
                                {metrics?.growth && metrics.growth.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <AreaChart data={metrics.growth}>
                                            <defs>
                                                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" stroke="var(--md-sys-color-outline)" fontSize={10} />
                                            <YAxis stroke="var(--md-sys-color-outline)" fontSize={10} tickFormatter={(v) => `$${v / 1000}K`} />
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
                                                            <div style={{ color: '#3b82f6', fontWeight: 600 }}>
                                                                {formatCurrency(payload[0].value as number)}
                                                            </div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Area type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2} fill="url(#mrrGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-gray-500">
                                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : 'No growth data'}
                                    </div>
                                )}
                            </MD3Surface>

                            {/* Plan Breakdown */}
                            <MD3Surface shape="large" className="auto-safe">
                                <h3 style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)', marginBottom: '16px' }}>
                                    Revenue by Plan
                                </h3>
                                {metrics?.breakdown && metrics.breakdown.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={150}>
                                            <PieChart>
                                                <Pie
                                                    data={metrics.breakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={60}
                                                    dataKey="mrr"
                                                    paddingAngle={3}
                                                >
                                                    {metrics.breakdown.map((entry, i) => (
                                                        <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="space-y-2">
                                            {metrics.breakdown.map((plan, i) => (
                                                <div key={plan.plan} className="flex justify-between items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                                                        <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{plan.plan}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>{formatCurrency(plan.mrr)}</div>
                                                        <div style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '10px' }}>{plan.count} subs</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-gray-500">
                                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : 'No plan data'}
                                    </div>
                                )}
                            </MD3Surface>
                        </div>

                        {/* Net MRR Movement */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="text-xs mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>New MRR</div>
                                <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                                    {loading ? '...' : `+${formatCurrency(metrics?.newMRR || 0)}`}
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="text-xs mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>Churned MRR</div>
                                <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                                    {loading ? '...' : `-${formatCurrency(metrics?.churnedMRR || 0)}`}
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="text-xs mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>Net New MRR</div>
                                <div className="text-2xl font-bold" style={{ color: (metrics?.netNewMRR || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {loading ? '...' : formatCurrency(metrics?.netNewMRR || 0)}
                                </div>
                            </MD3Surface>
                        </div>
                    </>
                }
                supportingContent={
                    <>
                        {/* Data Source */}
                        <MD3Card headline="Data Source" subhead={isMock ? 'Demo Mode' : 'Stripe Live'}>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isMock ? '#f59e0b' : '#22c55e' }} />
                                    <span style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        {isMock ? 'Demo Data' : 'Live from Stripe'}
                                    </span>
                                </div>
                                {lastUpdated && (
                                    <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        Updated: {lastUpdated.toLocaleTimeString()}
                                    </div>
                                )}
                                <button
                                    onClick={refresh}
                                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors"
                                    style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'white' }}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Refresh Now</span>
                                </button>
                            </div>
                        </MD3Card>

                        {/* Unit Economics */}
                        <MD3Card headline="Unit Economics" subhead="SaaS Fundamentals" className="mt-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>LTV</span>
                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{formatCurrency(ltv)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>CAC</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(cac)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>LTV:CAC</span>
                                    <span style={{
                                        fontWeight: 600,
                                        color: parseFloat(ltvCacRatio) >= 3 ? '#22c55e' : parseFloat(ltvCacRatio) >= 1 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {ltvCacRatio}:1
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Churn Rate</span>
                                    <span style={{
                                        fontWeight: 600,
                                        color: churnRate <= 5 ? '#22c55e' : churnRate <= 10 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {churnRate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Magic Number</span>
                                    <span style={{
                                        fontWeight: 600,
                                        color: parseFloat(magicNumber) >= 0.75 ? '#22c55e' : parseFloat(magicNumber) >= 0.5 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {magicNumber}
                                    </span>
                                </div>
                            </div>
                        </MD3Card>

                        {/* Quick Links */}
                        <MD3Card headline="VC Dashboard" subhead="More Metrics" className="mt-4">
                            <div className="space-y-2">
                                {[
                                    { label: 'Portfolio', href: '/vc/portfolio', icon: '💎' },
                                    { label: 'Cap Table', href: '/vc/cap-table', icon: '📊' },
                                    { label: 'Valuation', href: '/vc/valuation', icon: '🎯' },
                                    { label: 'Deal Flow', href: '/vc/dealflow', icon: '🚀' },
                                ].map((link) => (
                                    <a
                                        key={link.label}
                                        href={`/${locale}${link.href}`}
                                        className="flex items-center justify-between p-3 rounded-lg transition-colors"
                                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span>{link.icon}</span>
                                            <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{link.label}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
                                    </a>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
