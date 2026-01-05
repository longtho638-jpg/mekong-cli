'use client';

import React from 'react';
import { Scale, FileText, Shield as ShieldIcon, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

export default function LegalPage() {
    const { analytics, loading, projects, clients } = useAnalytics();

    // Derive legal metrics from real Supabase data
    const activeContracts = analytics.activeClients + analytics.activeProjects;
    const pendingReviews = Math.max(0, analytics.overdueInvoices + Math.round(analytics.totalProjects * 0.1));
    const complianceScore = Math.round(analytics.collectionRate);
    const riskItems = analytics.overdueInvoices + analytics.churnedClients;

    return (
        <MD3AppShell title="Legal Hub ⚖️" subtitle="Contracts • Compliance • Risk Management">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Contracts</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>{activeContracts}</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>+{analytics.activeClients} clients</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Reviews</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>{pendingReviews}</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>{pendingReviews === 0 ? 'All clear' : 'Need attention'}</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldIcon className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compliance Score</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: complianceScore >= 80 ? '#22c55e' : '#f59e0b' }}>{complianceScore}%</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>Based on collection</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Items</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: riskItems > 0 ? '#ef4444' : '#22c55e' }}>{riskItems}</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>{riskItems === 0 ? 'No risks' : 'Need resolution'}</div>
                            </MD3Surface>
                        </div>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card headline="Quick Actions" subhead="Legal Tools">
                            <div className="space-y-2">
                                {[
                                    { icon: '📝', label: 'New Contract' },
                                    { icon: '🔍', label: 'Review Queue' },
                                    { icon: '⚖️', label: 'Compliance' },
                                    { icon: '📋', label: 'Templates' },
                                    { icon: '🔔', label: 'Alerts' },
                                    { icon: '📊', label: 'Reports' },
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
