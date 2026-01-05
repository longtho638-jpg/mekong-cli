'use client';

import React from 'react';
import { Users, Building, Settings, Shield, Briefcase, Award } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

export default function AgencyPortalPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading } = useAnalytics();
    return (
        <MD3AppShell
            title="Agency Portal 🏢"
            subtitle="Clients • Projects • Team • Revenue"
        >
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Hero Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Building className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Active Clients
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#3b82f6'
                                }}>
                                    48
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +6 vs last period
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Team Members
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#22c55e'
                                }}>
                                    24
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +3 vs last period
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Briefcase className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Projects
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#a855f7'
                                }}>
                                    86
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +12 vs last period
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Award className="w-5 h-5" style={{ color: '#f59e0b' }} />
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
                                    color: '#f59e0b'
                                }}>
                                    $42K
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +$5K vs last period
                                </div>
                            </MD3Surface>
                        </div>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card
                            headline="Quick Actions"
                            subhead="Agency Tools"
                        >
                            <div className="space-y-2">
                                {[
                                    { icon: '🏢', label: 'Clients' },
                                    { icon: '👥', label: 'Team' },
                                    { icon: '📋', label: 'Projects' },
                                    { icon: '💰', label: 'Billing' },
                                    { icon: '📊', label: 'Reports' },
                                    { icon: '⚙️', label: 'Settings' },
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
                    </>
                }
            />
        </MD3AppShell>
    );
}
