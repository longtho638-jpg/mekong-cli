'use client';

import React from 'react';
import { Shield, Users, TrendingUp, Award, Star, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useGuildStatus, useGuildNetwork } from '@/hooks/useBlueOcean';

export default function GuildPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading } = useAnalytics();
    const { data: status, isLoading: statusLoading } = useGuildStatus();
    const { data: network, isLoading: networkLoading } = useGuildNetwork();

    const isLoading = statusLoading || networkLoading;
    const trustScore = status?.trust_score || 67;
    const trustMax = status?.trust_max || 100;

    return (
        <MD3AppShell
            title="Agency Guild 🏰"
            subtitle="Blue Ocean Protocol • Collective Intelligence • Mutual Protection"
        >
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Hero Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Star className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Trust Score
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#f59e0b'
                                }}>
                                    {status ? `${status.trust_score}/${status.trust_max}` : '...'}
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +5 vs last period
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Network Members
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#3b82f6'
                                }}>
                                    {network ? `${network.members.total}` : '...'}
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +{network?.members.new_this_month || 0} this month
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Contributions
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#22c55e'
                                }}>
                                    {status ? `${status.contributions.reports + status.contributions.verified}` : '...'}
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +8 vs last period
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Protected Value
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#a855f7'
                                }}>
                                    {network ? `$${(network.activity_30d.value_protected / 1000).toFixed(0)}K` : '...'}
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +$18K vs last period
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Guild Status */}
                        <MD3Card
                            headline="Your Guild Status"
                            subhead={isLoading ? 'Loading...' : `${status?.tier || 'Worker Bee'}`}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Trust Score Progress */}
                                <MD3Surface shape="medium" className="auto-safe">
                                    <div className="flex items-center justify-between mb-3">
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            Trust Score
                                        </span>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-title-large-size)', fontWeight: 600, color: '#f59e0b' }}>
                                            {trustScore}/{trustMax}
                                        </span>
                                    </div>
                                    <div style={{ height: '12px', backgroundColor: 'var(--md-sys-color-surface-container-highest)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${(trustScore / trustMax) * 100}%`,
                                                background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                                                borderRadius: '999px',
                                                transition: 'width 0.5s'
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2" style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        <span>Current: {status?.tier_emoji || '🐝'} {status?.tier || 'Worker Bee'}</span>
                                        <span>Next: {status?.next_tier.emoji || '👑'} ({status?.next_tier.required || 85} pts)</span>
                                    </div>
                                </MD3Surface>

                                {/* Score Breakdown */}
                                <MD3Surface shape="medium" className="auto-safe">
                                    <div style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '12px' }}>
                                        Score Breakdown
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Base Score', value: `+${status?.score_breakdown.base || 50}`, icon: '📝' },
                                            { label: 'Contributions', value: `+${status?.score_breakdown.contributions || 10}`, icon: '📊' },
                                            { label: 'Referrals', value: `+${status?.score_breakdown.referrals || 5}`, icon: '🤝' },
                                            { label: 'Tenure', value: `+${status?.score_breakdown.tenure || 2}`, icon: '⏰' },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between">
                                                <span className="flex items-center gap-2" style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>
                                                    <span>{item.icon}</span>
                                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{item.label}</span>
                                                </span>
                                                <span style={{ color: 'var(--md-sys-color-tertiary)', fontWeight: 600 }}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </MD3Surface>
                            </div>
                        </MD3Card>

                        {/* Guild Constitution */}
                        <MD3Card
                            headline="Guild Constitution"
                            subhead="Rights & Responsibilities"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div style={{ fontSize: 'var(--md-sys-typescale-title-small-size)', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px' }}>
                                        ✅ Member Pledges
                                    </div>
                                    {['Contribute data to collective', 'Protect network from bad actors', 'Respect rate floor standards', 'Cross-refer when not a fit'].map((pledge) => (
                                        <div key={pledge} className="flex items-center gap-2" style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>
                                            <CheckCircle className="w-4 h-4" style={{ color: 'var(--md-sys-color-tertiary)' }} />
                                            <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{pledge}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <div style={{ fontSize: 'var(--md-sys-typescale-title-small-size)', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px' }}>
                                        ❌ Violations
                                    </div>
                                    {['Undercut guild rate floors', 'Share false client info', 'Steal referred clients', 'Break confidentiality'].map((violation) => (
                                        <div key={violation} className="flex items-center gap-2" style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>
                                            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--md-sys-color-error)' }} />
                                            <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{violation}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card
                            headline="Quick Actions"
                            subhead="Guild Tools"
                        >
                            <div className="space-y-2">
                                {[
                                    { icon: '📋', label: 'My Status' },
                                    { icon: '🤝', label: 'Join Guild' },
                                    { icon: '📊', label: 'Contribute' },
                                    { icon: '🌐', label: 'Network' },
                                    { icon: '👤', label: 'Client DNA' },
                                    { icon: '🛡️', label: 'Defense' },
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                                        style={{
                                            backgroundColor: 'var(--md-sys-color-surface-container)',
                                            border: '1px solid var(--md-sys-color-outline-variant)',
                                        }}
                                        onClick={() => console.log(action.label)}
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
                            headline="Trust Metric"
                            subhead={`${trustScore}/${trustMax}`}
                        >
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                                    {status?.tier_emoji || '🐝'}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)', color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                                    {status?.tier || 'Worker Bee'}
                                </div>
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin mx-auto" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />}
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
