'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle, Users, Eye, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useBlacklist } from '@/hooks/useBlueOcean';
import { checkClientDNA, ClientDNA } from '@/lib/api/blue-ocean';

export default function DefensePage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading } = useAnalytics();
    const [searchQuery, setSearchQuery] = useState('');
    const [checkResult, setCheckResult] = useState<ClientDNA | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const { data: blacklist, isLoading: blacklistLoading } = useBlacklist();

    const handleCheck = async () => {
        if (!searchQuery.trim()) return;
        setIsChecking(true);
        try {
            const result = await checkClientDNA(searchQuery);
            setCheckResult(result);
        } catch (error) {
            console.error('Check failed:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const blacklistedClients = blacklist?.clients || [];

    return (
        <MD3AppShell
            title="Mutual Defense 🛡️"
            subtitle="Client DNA • Risk Detection • Collective Protection"
        >
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Hero Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-5 h-5" style={{ color: '#22c55e' }} />
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
                                    color: '#22c55e'
                                }}>
                                    $127K
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +$18K vs last period
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Active Alerts
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#f59e0b'
                                }}>
                                    3
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    -2 vs last period
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Blacklisted
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#ef4444'
                                }}>
                                    {blacklist ? blacklist.total : '...'}
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +1 vs last period
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Verified Reports
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#3b82f6'
                                }}>
                                    3.8K
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +156 vs last period
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Client DNA Search */}
                        <MD3Card
                            headline="Client DNA Passport Check"
                            subhead="Verify before you engage"
                        >
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Enter client name or domain..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                                        className="w-full rounded-xl px-4 py-3 outline-none"
                                        style={{
                                            backgroundColor: 'var(--md-sys-color-surface-container)',
                                            border: '1px solid var(--md-sys-color-outline-variant)',
                                            color: 'var(--md-sys-color-on-surface)'
                                        }}
                                    />
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
                                </div>
                                <button
                                    onClick={handleCheck}
                                    disabled={isChecking}
                                    className="px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    style={{
                                        backgroundColor: 'var(--md-sys-color-primary)',
                                        color: 'var(--md-sys-color-on-primary)'
                                    }}
                                >
                                    {isChecking && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Check
                                </button>
                            </div>

                            {/* Check Result */}
                            <MD3Surface shape="medium" className="auto-safe">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{
                                        backgroundColor: checkResult?.status === 'safe' ? 'rgba(34, 197, 94, 0.2)' :
                                            checkResult?.status === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                                                checkResult?.status === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                                    }}>
                                        {checkResult?.status === 'safe' && <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />}
                                        {checkResult?.status === 'warning' && <AlertTriangle className="w-6 h-6" style={{ color: '#f59e0b' }} />}
                                        {checkResult?.status === 'danger' && <XCircle className="w-6 h-6" style={{ color: '#ef4444' }} />}
                                        {!checkResult && <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            {checkResult ? 'Check Result' : 'Last Check Result'}
                                        </div>
                                        <div style={{
                                            fontWeight: 600,
                                            color: checkResult?.status === 'safe' ? '#22c55e' :
                                                checkResult?.status === 'warning' ? '#f59e0b' :
                                                    checkResult?.status === 'danger' ? '#ef4444' : '#22c55e'
                                        }}>
                                            {checkResult ? `${checkResult.status === 'safe' ? '✅' : '⚠️'} "${checkResult.client}" - ${checkResult.status.toUpperCase()}` : '✅ "Acme Corp" - SAFE'}
                                        </div>
                                        <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            Payment: {checkResult?.payment_history || 'Excellent'} | Reports: {checkResult?.reports || 0} | Trust: {checkResult?.trust_score || 92}/100
                                        </div>
                                    </div>
                                </div>
                            </MD3Surface>
                        </MD3Card>

                        {/* Blacklist */}
                        <MD3Card
                            headline={`Network Blacklist (${blacklist?.total || 23} Clients)`}
                            subhead="Community-reported bad actors"
                        >
                            {blacklistLoading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />}
                            <div className="space-y-3">
                                {blacklistedClients.map((client) => (
                                    <MD3Surface key={client.name} shape="medium" className="auto-safe">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`px-2 py-1 rounded text-xs font-bold`} style={{
                                                    backgroundColor: client.risk === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                    color: client.risk === 'critical' ? '#ef4444' : '#f59e0b'
                                                }}>
                                                    {client.risk.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>{client.name}</div>
                                                    <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                        {client.reason}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                {client.reports} reports
                                            </div>
                                        </div>
                                    </MD3Surface>
                                ))}
                            </div>
                            <button className="mt-4 w-full py-2 rounded-xl text-sm transition-colors" style={{
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                color: 'var(--md-sys-color-on-surface-variant)'
                            }}>
                                View All {blacklist?.total || 23} Blacklisted Clients →
                            </button>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card
                            headline="Quick Actions"
                            subhead="Defense Tools"
                        >
                            <div className="space-y-2">
                                {[
                                    { icon: '🔍', label: 'Check Client' },
                                    { icon: '🚨', label: 'Report' },
                                    { icon: '✅', label: 'Verify' },
                                    { icon: '📋', label: 'Blacklist' },
                                    { icon: '🛡️', label: 'My Cases' },
                                    { icon: '📊', label: 'Analytics' },
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
