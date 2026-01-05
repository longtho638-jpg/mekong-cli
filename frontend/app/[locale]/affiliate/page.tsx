'use client';

import React from 'react';
import { DollarSign, Users, TrendingUp, Gift, Star, ArrowRight, Sparkles } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { AnimatedNumber, AnimatedCurrency } from '@/components/ui/AnimatedNumber';
import { getGuildStatus, getPricingBenchmarks } from '@/lib/api/mekong';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤝 AFFILIATE DASHBOARD - Partner program management
// Feature from agencyos.network: /affiliate/scout
// ═══════════════════════════════════════════════════════════════════════════════

const AFFILIATE_PROGRAMS = [
    { name: 'PayPal Affiliate', commission: '5%', type: 'Recurring', status: 'Active', earnings: 2450 },
    { name: 'Stripe Partners', commission: '25%', type: 'One-time', status: 'Active', earnings: 8900 },
    { name: 'Vercel Referral', commission: '$50', type: 'One-time', status: 'Active', earnings: 1500 },
    { name: 'Supabase Partners', commission: '10%', type: 'Recurring', status: 'Pending', earnings: 340 },
    { name: 'OpenAI Affiliates', commission: '20%', type: 'Recurring', status: 'Active', earnings: 5600 },
];

export default function AffiliatePage({ params: { locale } }: { params: { locale: string } }) {
    const { analytics } = useAnalytics();

    const totalEarnings = AFFILIATE_PROGRAMS.reduce((sum, p) => sum + p.earnings, 0);
    const activePrograms = AFFILIATE_PROGRAMS.filter(p => p.status === 'Active').length;

    return (
        <MD3AppShell
            title="Affiliate Hub 🤝"
            subtitle="Partner Programs • Passive Income • Scout 50+ Programs"
        >
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span className="text-xs uppercase text-gray-400">Total Earnings</span>
                                </div>
                                <div className="text-3xl font-bold text-green-400">
                                    <AnimatedCurrency value={totalEarnings} duration={1500} />
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span className="text-xs uppercase text-gray-400">Active Programs</span>
                                </div>
                                <div className="text-3xl font-bold text-blue-400">
                                    <AnimatedNumber value={activePrograms} duration={1000} />
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span className="text-xs uppercase text-gray-400">Avg Commission</span>
                                </div>
                                <div className="text-3xl font-bold text-purple-400">15%</div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Gift className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span className="text-xs uppercase text-gray-400">PayPal-Friendly</span>
                                </div>
                                <div className="text-3xl font-bold text-amber-400">50+</div>
                            </MD3Surface>
                        </div>

                        {/* Programs Table */}
                        <MD3Card headline="Partner Programs" subhead="50+ PayPal-friendly programs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 text-gray-400">Program</th>
                                            <th className="text-right py-3 text-gray-400">Commission</th>
                                            <th className="text-right py-3 text-gray-400">Type</th>
                                            <th className="text-right py-3 text-gray-400">Status</th>
                                            <th className="text-right py-3 text-gray-400">Earnings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {AFFILIATE_PROGRAMS.map((program, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-4 font-medium">{program.name}</td>
                                                <td className="py-4 text-right text-green-400">{program.commission}</td>
                                                <td className="py-4 text-right text-gray-400">{program.type}</td>
                                                <td className="py-4 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs ${program.status === 'Active'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        {program.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right font-bold">${program.earnings.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card headline="Quick Actions" subhead="Affiliate Tools">
                            <div className="space-y-2">
                                {[
                                    { icon: '🔍', label: 'Scout Programs', desc: 'Find new partners' },
                                    { icon: '📊', label: 'Analytics', desc: 'Track performance' },
                                    { icon: '💰', label: 'Payouts', desc: 'View earnings' },
                                    { icon: '🔗', label: 'Links', desc: 'Manage affiliate links' },
                                ].map((action, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-xl">{action.icon}</span>
                                        <div className="text-left">
                                            <div className="text-sm font-medium">{action.label}</div>
                                            <div className="text-xs text-gray-500">{action.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>

                        <MD3Card headline="Top Earner" subhead="Stripe Partners">
                            <div className="text-center py-4">
                                <div className="text-4xl mb-2">💎</div>
                                <div className="text-2xl font-bold text-green-400">$8,900</div>
                                <div className="text-xs text-gray-500">25% commission</div>
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
