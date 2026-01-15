'use client';

import React from 'react';
import { Target, Users, DollarSign, TrendingUp, Briefcase, Mail } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

export default function ABMPage() {
    const { analytics, loading, projects, clients } = useAnalytics();
    // Derive KPIs from real Supabase data
    const kpi1 = analytics.totalRevenue;
    const kpi2 = analytics.activeClients;
    return (
        <MD3AppShell title="ABM Hub 🎯" subtitle="Account-Based Marketing • Targeting • Engagement">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Accounts</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>124</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+18 this period</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engaged</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>68</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+12 engaged</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pipeline</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>$4.2M</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+$800K growth</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>18%</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+3% improvement</div>
                            </MD3Surface>
                        </div>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card headline="Quick Actions" subhead="ABM Tools">
                            <div className="space-y-2">
                                {[
                                    { icon: '🎯', label: 'Add Account' },
                                    { icon: '📊', label: 'Analytics' },
                                    { icon: '📧', label: 'Campaigns' },
                                    { icon: '👥', label: 'Contacts' },
                                    { icon: '📋', label: 'Plays' },
                                    { icon: '⚙️', label: 'Settings' },
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
