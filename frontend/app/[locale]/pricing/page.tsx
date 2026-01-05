'use client';

import React from 'react';
import { DollarSign, TrendingUp, BarChart3, Target, ArrowUp, Loader2 } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { usePricingBenchmarks } from '@/hooks/useBlueOcean';

export default function PricingPage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics, loading } = useAnalytics();
    const { data: pricing, isLoading } = usePricingBenchmarks();

    const avgRate = pricing?.avg_rate || 125;
    const yourRate = pricing?.your_rate || 140;
    const rateFloor = pricing?.rate_floor || 85;
    const position = pricing?.position || 'top_25';

    const serviceBenchmarks = pricing?.services || [
        { name: 'Web Development', floor: 85, avg: 125, top: 200, your: 140 },
        { name: 'UI/UX Design', floor: 75, avg: 110, top: 175, your: 120 },
        { name: 'SEO Services', floor: 65, avg: 95, top: 150, your: 100 },
        { name: 'Content Writing', floor: 45, avg: 70, top: 120, your: 80 },
        { name: 'Video Production', floor: 100, avg: 150, top: 250, your: 160 },
    ];

    const yourPosition = ((yourRate - rateFloor) / (200 - rateFloor)) * 100;

    return (
        <MD3AppShell
            title="Pricing Intel 💰"
            subtitle="Market Benchmarks • Rate Floors • Collective Intelligence"
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
                                        Avg Market Rate
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#22c55e'
                                }}>
                                    ${avgRate}/hr
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +$8 vs last period
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
                                        Your Rate
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#3b82f6'
                                }}>
                                    ${yourRate}/hr
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    Top 25% position
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Rate Floor
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#f59e0b'
                                }}>
                                    ${rateFloor}/hr
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    Standard minimum
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <BarChart3 className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{
                                        fontSize: 'var(--md-sys-typescale-label-medium-size)',
                                        color: 'var(--md-sys-color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Submissions
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                                    fontWeight: 600,
                                    color: '#a855f7'
                                }}>
                                    89
                                </div>
                                <div style={{
                                    fontSize: 'var(--md-sys-typescale-body-small-size)',
                                    color: 'var(--md-sys-color-tertiary)'
                                }}>
                                    +12 vs last period
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Market Position */}
                        <MD3Card
                            headline="Your Market Position"
                            subhead={isLoading ? 'Loading...' : position === 'top_25' ? 'Top 25%' : 'Average'}
                        >
                            <div className="relative h-20 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}>
                                {/* Scale */}
                                <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500" />

                                {/* Markers */}
                                <div className="absolute bottom-4 left-[15%] text-center">
                                    <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>Floor</div>
                                    <div style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', fontWeight: 600, color: '#f59e0b' }}>${rateFloor}</div>
                                </div>
                                <div className="absolute bottom-4 left-[50%] -translate-x-1/2 text-center">
                                    <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>Average</div>
                                    <div style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', fontWeight: 600, color: '#22c55e' }}>${avgRate}</div>
                                </div>
                                <div className="absolute bottom-4" style={{ left: `${Math.min(90, 15 + yourPosition * 0.75)}%` }}>
                                    <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1 animate-pulse" />
                                    <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: '#3b82f6', fontWeight: 600 }}>YOU</div>
                                    <div style={{ fontSize: 'var(--md-sys-typescale-title-large-size)', fontWeight: 600, color: '#3b82f6' }}>${yourRate}</div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <div className="flex items-center gap-2">
                                    <ArrowUp className="w-4 h-4" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: '#3b82f6' }}>
                                        You're in the <strong>{position === 'top_25' ? 'Top 25%' : 'Average'}</strong> of market rates. Keep it up! 🎯
                                    </span>
                                </div>
                            </div>
                        </MD3Card>

                        {/* Service Benchmarks */}
                        <MD3Card
                            headline="Service Rate Benchmarks"
                            subhead="By service type"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full" style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                            <th className="text-left py-3" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500 }}>Service</th>
                                            <th className="text-right py-3" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500 }}>Floor</th>
                                            <th className="text-right py-3" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500 }}>Avg</th>
                                            <th className="text-right py-3" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500 }}>Top 10%</th>
                                            <th className="text-right py-3" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500 }}>Your Rate</th>
                                            <th className="text-right py-3" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500 }}>Position</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {serviceBenchmarks.map((svc) => {
                                            const isTop25 = svc.your >= svc.avg;
                                            return (
                                                <tr key={svc.name} style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                                                    <td className="py-3" style={{ fontWeight: 500, color: 'var(--md-sys-color-on-surface)' }}>{svc.name}</td>
                                                    <td className="py-3 text-right" style={{ color: '#f59e0b' }}>${svc.floor}/hr</td>
                                                    <td className="py-3 text-right" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>${svc.avg}/hr</td>
                                                    <td className="py-3 text-right" style={{ color: '#22c55e' }}>${svc.top}/hr</td>
                                                    <td className="py-3 text-right" style={{ color: '#3b82f6', fontWeight: 600 }}>${svc.your}/hr</td>
                                                    <td className="py-3 text-right">
                                                        <span className="px-2 py-1 rounded text-xs font-bold" style={{
                                                            backgroundColor: isTop25 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                                                            color: isTop25 ? '#22c55e' : 'var(--md-sys-color-on-surface-variant)'
                                                        }}>
                                                            {isTop25 ? 'Top 25%' : 'Average'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card
                            headline="Quick Actions"
                            subhead="Pricing Tools"
                        >
                            <div className="space-y-2">
                                {[
                                    { icon: '📊', label: 'Benchmark' },
                                    { icon: '📝', label: 'Submit Rate' },
                                    { icon: '🎯', label: 'My Position' },
                                    { icon: '📈', label: 'Trends' },
                                    { icon: '🏷️', label: 'Services' },
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

                        <MD3Card
                            headline="Your Rate"
                            subhead={`$${yourRate}/hr`}
                        >
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <div style={{ fontSize: '48px', marginBottom: '8px' }}>💰</div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6', marginBottom: '4px' }}>
                                    ${yourRate}/hr
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    Top 25% Position
                                </div>
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin mx-auto mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />}
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
