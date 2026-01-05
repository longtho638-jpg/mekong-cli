'use client';

import React from 'react';
import { Rocket, DollarSign, Users, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

export default function EntrepreneurPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading } = useAnalytics();
    return (
        <MD3AppShell
            title="Founder Hub 🚀"
            subtitle="Startup Metrics • Experiments • Growth • Fundraising"
        >
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Hero Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Runway
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#22c55e'
                                }}>
                                    18mo
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    Healthy status
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        MRR
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#3b82f6'
                                }}>
                                    $42K
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +15% growth
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Active Users
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#a855f7'
                                }}>
                                    2.4K
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +340 this month
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Lightbulb className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Ideas Validated
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#f59e0b'
                                }}>
                                    12
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +3 this quarter
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Startup Velocity Checklist */}
                        <MD3Card
                            headline="Startup Velocity Checklist"
                            subhead="Critical milestones"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { item: 'Product-Market Fit', status: 'achieved', score: '85%' },
                                    { item: 'Growth Engine', status: 'building', score: '60%' },
                                    { item: 'Unit Economics', status: 'achieved', score: '92%' },
                                    { item: 'Team Scale', status: 'planned', score: '40%' },
                                ].map((check) => (
                                    <MD3Surface key={check.item} shape="medium" className="auto-safe">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span style={{ fontSize: '20px', color: check.status === 'achieved' ? '#22c55e' : check.status === 'building' ? '#f59e0b' : 'var(--md-sys-color-on-surface-variant)' }}>
                                                    {check.status === 'achieved' ? '✅' : check.status === 'building' ? '🔨' : '📋'}
                                                </span>
                                                <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{check.item}</span>
                                            </div>
                                            <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', fontWeight: 600, color: '#f59e0b' }}>
                                                {check.score}
                                            </span>
                                        </div>
                                    </MD3Surface>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card
                            headline="Quick Actions"
                            subhead="Startup Tools"
                        >
                            <div className="space-y-2">
                                {[
                                    { icon: '💡', label: 'New Idea' },
                                    { icon: '🧪', label: 'Experiment' },
                                    { icon: '📊', label: 'Metrics' },
                                    { icon: '🎯', label: 'OKRs' },
                                    { icon: '💰', label: 'Fundraise' },
                                    { icon: '🚀', label: 'Launch' },
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                                        style={{
                                            backgroundColor: 'var(--md-sys-color-surface-container)',
                                            border: '1px solid var(--md-sys-color-outline-variant)',
                                        }}
                                    >
                                        <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>
                                            {action.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>

                        <MD3Card
                            headline="MRR Status"
                            subhead="Monthly Recurring Revenue"
                        >
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🚀</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6', marginBottom: '4px' }}>
                                    $42K
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    +15% Growth
                                </div>
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
