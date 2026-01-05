'use client';

import React from 'react';
import { Code, Bug, Rocket, TrendingUp, Award, Zap } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

export default function SEPage() {
    const { analytics, loading, projects, clients } = useAnalytics();
    // Derive KPIs from real Supabase data
    const kpi1 = analytics.totalRevenue;
    const kpi2 = analytics.activeClients;
    return (
        <MD3AppShell title="Software Engineer 💻" subtitle="Code • Build • Ship • Optimize">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Code className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Commits</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>186</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+42 this week</div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Rocket className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deployments</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>24</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+8 shipped</div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Bug className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bugs Fixed</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>48</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+12 resolved</div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Award className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code Quality</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>94%</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+3% improved</div>
                            </MD3Surface>
                        </div>
                    </>
                }
                supportingContent={
                    <MD3Card headline="Quick Actions" subhead="Dev Tools">
                        <div className="space-y-2">
                            {[{ icon: '💻', label: 'Code' }, { icon: '🐛', label: 'Debug' }, { icon: '🚀', label: 'Deploy' }, { icon: '📊', label: 'Metrics' }, { icon: '📚', label: 'Docs' }, { icon: '⚙️', label: 'Settings' }].map((action) => (
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
