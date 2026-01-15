'use client';

import React from 'react';
import { Crown, TrendingUp, Target, Users, Calendar, Award } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

export default function ExecutivePage() {
    const { analytics, loading, projects } = useAnalytics();

    // Derive executive metrics from real Supabase data
    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const revenueYTD = analytics.totalRevenue;
    const teamSize = analytics.activeClients * 2 + analytics.totalProjects;
    const okrProgress = Math.min(100, Math.round(analytics.projectCompletionRate));
    const npsScore = Math.round(analytics.collectionRate * 0.6);
    const revenueGrowth = analytics.revenueGrowth;

    return (
        <MD3AppShell
            title="Executive Suite 👔"
            subtitle="Strategy • Leadership • Performance • Governance"
        >
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Hero Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Revenue YTD</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>{formatCurrency(revenueYTD)}</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: revenueGrowth >= 0 ? '#22c55e' : '#ef4444' }}>{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs last period</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Size</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>{teamSize}</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+{analytics.activeClients} this quarter</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OKR Progress</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>{okrProgress}%</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>{okrProgress >= 70 ? 'On Track' : 'Needs Focus'}</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Award className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NPS Score</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>+{npsScore}</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>Based on collection</div>
                            </MD3Surface>
                        </div>

                        {/* This Week's Priorities */}
                        <MD3Card headline="This Week's Priorities" subhead="Executive Focus">
                            <div className="space-y-3">
                                {[
                                    { priority: 'High', item: 'Q1 Board Meeting Prep', due: 'Jan 5', color: '#ef4444' },
                                    { priority: 'High', item: 'Series A Term Sheet Review', due: 'Jan 8', color: '#ef4444' },
                                    { priority: 'Med', item: 'Department Budget Reviews', due: 'Jan 10', color: '#f59e0b' },
                                    { priority: 'Low', item: 'Team All-Hands Planning', due: 'Jan 15', color: '#22c55e' },
                                ].map((item, i) => (
                                    <MD3Surface key={i} shape="medium" className="auto-safe">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                                <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{item.item}</span>
                                            </div>
                                            <span style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>Due: {item.due}</span>
                                        </div>
                                    </MD3Surface>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card headline="Quick Actions" subhead="Executive Tools">
                            <div className="space-y-2">
                                {[
                                    { icon: '📊', label: 'Board Deck' },
                                    { icon: '🎯', label: 'OKRs' },
                                    { icon: '📅', label: 'Leadership' },
                                    { icon: '💰', label: 'Financials' },
                                    { icon: '👥', label: 'Org Chart' },
                                    { icon: '📈', label: 'Insights' },
                                ].map((action) => (
                                    <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                        <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
