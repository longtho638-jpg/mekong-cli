'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useEmployees } from '@/hooks/useHR';

import React from 'react';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface, MD3Text } from '@/components/md3-dna';
import { Users, Briefcase, TrendingUp, Heart, AlertTriangle, UserPlus, FileText, Calendar, Loader2 } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Tenant ID - in production, get from auth context
const TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'demo-tenant';

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 HR HUB - MD3 DNA Standardized
// DNA: MD3AppShell + MD3SupportingPaneLayout (matches /revenue gold standard)
// ═══════════════════════════════════════════════════════════════════════════════

// Headcount by Department
const headcountByDept = [
    { name: 'Engineering', value: 45, color: '#3b82f6' },
    { name: 'Marketing', value: 28, color: '#ec4899' },
    { name: 'Sales', value: 35, color: '#22c55e' },
    { name: 'Operations', value: 22, color: '#f59e0b' },
    { name: 'Finance', value: 15, color: '#a855f7' },
    { name: 'HR', value: 11, color: '#06b6d4' },
];

// Hiring Trend (12 months)
const hiringTrend = [
    { name: 'Jan', value: 5 },
    { name: 'Feb', value: 8 },
    { name: 'Mar', value: 12 },
    { name: 'Apr', value: 7 },
    { name: 'May', value: 15 },
    { name: 'Jun', value: 10 },
    { name: 'Jul', value: 9 },
    { name: 'Aug', value: 14 },
    { name: 'Sep', value: 11 },
    { name: 'Oct', value: 18 },
    { name: 'Nov', value: 13 },
    { name: 'Dec', value: 8 },
];

// Attrition Risk
const attritionRisk = [
    { name: 'Low', value: 120, color: '#22c55e' },
    { name: 'Medium', value: 25, color: '#f59e0b' },
    { name: 'High', value: 8, color: '#ef4444' },
    { name: 'Critical', value: 3, color: '#7f1d1d' },
];

export default function HRPage() {
    const t = useTranslations('HR');
    const { analytics, loading, projects, clients } = useAnalytics();
    const { employees, loading: empLoading } = useEmployees(TENANT_ID);

    // Use real employee data if available, otherwise derive from analytics
    const realHeadcount = employees.length > 0 ? employees.length : Math.max(10, analytics.activeClients * 2 + analytics.totalProjects);
    const derivedHeadcount = realHeadcount;

    // Dynamic headcount by department
    const headcountByDept = [
        { name: 'Delivery', value: analytics.activeProjects + 5, color: '#3b82f6' },
        { name: 'Sales', value: analytics.activeClients, color: '#22c55e' },
        { name: 'Finance', value: Math.max(5, analytics.paidInvoices), color: '#a855f7' },
        { name: 'Operations', value: Math.max(3, Math.round(analytics.totalProjects * 0.3)), color: '#f59e0b' },
        { name: 'HR', value: Math.max(2, Math.round(derivedHeadcount * 0.1)), color: '#06b6d4' },
    ];

    const totalHeadcount = headcountByDept.reduce((sum, d) => sum + d.value, 0);
    const openPositions = Math.max(3, analytics.activeProjects - analytics.activeClients);
    const turnoverRate = analytics.churnRate > 0 ? analytics.churnRate.toFixed(1) : '5.0';
    const eNPS = Math.round(analytics.collectionRate * 0.5);

    return (
        <MD3AppShell title="HR Hub" subtitle="People Operations">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <KPICard
                                icon={<Users className="w-5 h-5" />}
                                label="Headcount"
                                value={totalHeadcount.toString()}
                                trend={`+${analytics.activeClients}`}
                                color="var(--md-sys-color-primary)"
                            />
                            <KPICard
                                icon={<Briefcase className="w-5 h-5" />}
                                label="Open Positions"
                                value={openPositions.toString()}
                                trend={`${analytics.activeProjects} projects`}
                                color="var(--md-sys-color-tertiary)"
                            />
                            <KPICard
                                icon={<Heart className="w-5 h-5" />}
                                label="eNPS Score"
                                value={`+${eNPS}`}
                                trend="based on collection"
                                color="var(--md-sys-color-secondary)"
                            />
                            <KPICard
                                icon={<TrendingUp className="w-5 h-5" />}
                                label="Turnover Rate"
                                value={`${turnoverRate}%`}
                                trend="from churn"
                                color="var(--md-sys-color-primary)"
                            />
                        </div>

                        {/* Charts Row */}
                        <div
                            className="grid grid-cols-1 lg:grid-cols-2"
                            style={{ gap: 'var(--md-sys-spacing-gap-lg, 16px)' }}
                        >
                            {/* Headcount by Dept */}
                            <MD3Card headline="Headcount by Department">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={headcountByDept}>
                                        <XAxis dataKey="name" stroke="var(--md-sys-color-outline)" fontSize={10} />
                                        <YAxis stroke="var(--md-sys-color-outline)" fontSize={10} />
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
                                                        <div style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>{data.name}</div>
                                                        <div style={{ color: data.color }}>{data.value} employees</div>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {headcountByDept.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </MD3Card>

                            {/* Hiring Trend */}
                            <MD3Card headline="Hiring Trend" subhead="12-Month View">
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={hiringTrend}>
                                        <defs>
                                            <linearGradient id="hiringGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="var(--md-sys-color-outline)" fontSize={10} />
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
                                                        <div style={{ color: 'var(--md-sys-color-primary)' }}>{payload[0].value} hires</div>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="var(--md-sys-color-primary)" strokeWidth={2} fill="url(#hiringGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </MD3Card>
                        </div>

                        {/* Attrition Risk */}
                        <MD3Card headline="Attrition Risk Distribution">
                            <div className="flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={attritionRisk}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {attritionRisk.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div
                                className="grid grid-cols-4 mt-4"
                                style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}
                            >
                                {attritionRisk.map((risk) => (
                                    <div key={risk.name} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)' }}>{risk.name}</div>
                                        <div className="text-lg font-bold" style={{ color: risk.color }}>{risk.value}</div>
                                    </div>
                                ))}
                            </div>
                        </MD3Card>

                        {/* Today's Priorities */}
                        <MD3Card headline="Today's HR Priorities">
                            <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                {[
                                    { emoji: '🔴', text: '3 employees at critical attrition risk', bg: 'rgba(239, 68, 68, 0.1)' },
                                    { emoji: '🟡', text: '5 pending interview schedules', bg: 'rgba(234, 179, 8, 0.1)' },
                                    { emoji: '🟢', text: '2 new hires starting Monday', bg: 'rgba(34, 197, 94, 0.1)' },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center p-3 rounded-lg"
                                        style={{ backgroundColor: item.bg, gap: '12px' }}
                                    >
                                        <span>{item.emoji}</span>
                                        <span style={{ color: 'var(--md-sys-color-on-surface)', fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        {/* Quick Actions */}
                        <MD3Card headline="Quick Actions">
                            <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                {[
                                    { icon: <FileText className="w-4 h-4" />, label: 'Post Job' },
                                    { icon: <UserPlus className="w-4 h-4" />, label: 'Add Employee' },
                                    { icon: <Calendar className="w-4 h-4" />, label: 'Schedule Review' },
                                    { icon: <AlertTriangle className="w-4 h-4" />, label: 'Run Report' },
                                ].map((action, i) => (
                                    <button
                                        key={i}
                                        className="flex items-center w-full p-3 rounded-lg transition-all"
                                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)', gap: '12px' }}
                                    >
                                        <div style={{ color: 'var(--md-sys-color-primary)' }}>{action.icon}</div>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface)' }}>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>

                        {/* Department Summary */}
                        <MD3Card headline="Department Summary">
                            <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                {headcountByDept.slice(0, 4).map((dept, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="flex items-center" style={{ gap: '8px' }}>
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                                            <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>{dept.name}</span>
                                        </div>
                                        <span style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 600 }}>{dept.value}</span>
                                    </div>
                                ))}
                            </div>
                        </MD3Card>

                        {/* Key Metrics */}
                        <MD3Card headline="This Month">
                            <div className="flex flex-col" style={{ gap: 'var(--md-sys-spacing-gap-sm, 8px)' }}>
                                {[
                                    { label: 'New Hires', value: '8' },
                                    { label: 'Departures', value: '2' },
                                    { label: 'Interviews', value: '24' },
                                    { label: 'Offers Made', value: '6' },
                                ].map((stat, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>{stat.label}</span>
                                        <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600, fontSize: 'var(--md-sys-typescale-title-medium-size)' }}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}

function KPICard({ icon, label, value, trend, color }: { icon: React.ReactNode; label: string; value: string; trend: string; color: string }) {
    return (
        <MD3Surface shape="large" color="surface-container" interactive={true}>
            {/* Header Row - Icon + Label */}
            <div className="flex items-center gap-2 mb-3">
                <div
                    className="p-1.5 rounded-lg"
                    style={{
                        backgroundColor: 'var(--md-sys-color-primary-container)',
                        color,
                    }}
                >
                    {icon}
                </div>
                <MD3Text variant="label-small" color="on-surface-variant" transform="uppercase">
                    {label}
                </MD3Text>
            </div>

            {/* Value */}
            <MD3Text variant="headline-small" color="on-surface">
                {value}
            </MD3Text>

            {/* Trend */}
            <div className="flex items-center gap-1 mt-1">
                <MD3Text variant="label-small" color="tertiary">
                    {trend}
                </MD3Text>
            </div>

            {/* Pulse Indicator */}
            <div
                className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: color }}
            />
        </MD3Surface>
    );
}
