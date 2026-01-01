'use client';

import { DollarSign, TrendingUp, Users, Target, Briefcase, Award, PieChart, BarChart3 } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

export default function RevenuePage({ params: { locale } }: { params: { locale: string } }) {
    // $1M Revenue Model
    const revenueMetrics = [
        { label: 'Annual Target', value: '$1M', icon: <Target className="w-5 h-5" />, color: '#22c55e', trend: { value: 'FY2026', direction: 'up' as const } },
        { label: 'MTD Revenue', value: '$85K', icon: <DollarSign className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+$12K', direction: 'up' as const } },
        { label: 'Active Clients', value: '48', icon: <Users className="w-5 h-5" />, color: '#a855f7', trend: { value: '+6', direction: 'up' as const } },
        { label: 'Avg Deal Size', value: '$8.5K', icon: <Briefcase className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$1.2K', direction: 'up' as const } },
    ];

    // Revenue by Hub Tier
    const revenueByTier = [
        { name: 'Core Hubs', value: 288000, color: '#22c55e' },      // 4 hubs × $6K × 12
        { name: 'Growth Hubs', value: 192000, color: '#3b82f6' },    // 8 hubs × $2K × 12  
        { name: 'Specialized', value: 144000, color: '#a855f7' },    // 12 hubs × $1K × 12
        { name: 'Basic Hubs', value: 116000, color: '#f59e0b' },     // 58 hubs × $166 × 12
        { name: 'Equity Exits', value: 260000, color: '#ec4899' },   // 10 exits × $26K
    ];

    // Monthly Revenue Trend
    const monthlyRevenue = [
        { name: 'Jan', value: 65000 },
        { name: 'Feb', value: 72000 },
        { name: 'Mar', value: 78000 },
        { name: 'Apr', value: 82000 },
        { name: 'May', value: 85000 },
        { name: 'Jun', value: 88000 },
        { name: 'Jul', value: 90000 },
        { name: 'Aug', value: 92000 },
        { name: 'Sep', value: 95000 },
        { name: 'Oct', value: 98000 },
        { name: 'Nov', value: 100000 },
        { name: 'Dec', value: 105000 },
    ];

    const revenueCharts = [
        { type: 'pie' as const, title: '$1M Revenue Breakdown', data: revenueByTier },
        { type: 'area' as const, title: 'Monthly Revenue Trend', data: monthlyRevenue },
    ];

    const revenueActions = [
        { icon: '📊', label: 'Dashboard', onClick: () => console.log('Dashboard') },
        { icon: '💰', label: 'Invoices', onClick: () => console.log('Invoices') },
        { icon: '📋', label: 'Pipeline', onClick: () => console.log('Pipeline') },
        { icon: '🎯', label: 'Targets', onClick: () => console.log('Targets') },
        { icon: '📈', label: 'Reports', onClick: () => console.log('Reports') },
        { icon: '⚙️', label: 'Settings', onClick: () => console.log('Settings') },
    ];

    // Hub tier breakdown
    const hubTiers = [
        { tier: 'Core Hubs (4)', examples: 'Guild, Sales, Marketing, Admin', mrr: '$24K', arr: '$288K', pct: 29 },
        { tier: 'Growth Hubs (8)', examples: 'HR, FinOps, IT, Creative...', mrr: '$16K', arr: '$192K', pct: 19 },
        { tier: 'Specialized (12)', examples: 'Legal, Security, Research...', mrr: '$12K', arr: '$144K', pct: 14 },
        { tier: 'Basic Hubs (58)', examples: 'Departments, Support...', mrr: '$9.7K', arr: '$116K', pct: 12 },
        { tier: 'Equity Exits (10)', examples: 'Startup investments', mrr: '-', arr: '$260K', pct: 26 },
    ];

    return (
        <DepartmentDashboard
            title="Revenue Dashboard"
            subtitle="$1M Annual Target • 82 Hubs • Equity Portfolio"
            icon="💰"
            color="green"
            statusLabel="Target"
            statusValue="$1M"
            metrics={revenueMetrics}
            charts={revenueCharts}
            quickActions={revenueActions}
            locale={locale}
        >
            {/* Progress to $1M */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    Progress to $1M
                </h3>

                <div className="mb-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-400">YTD Revenue</span>
                        <span className="text-2xl font-bold text-green-400">$850,000</span>
                    </div>
                    <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: '85%' }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>85% of $1M goal</span>
                        <span>$150K remaining</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-400">82</div>
                        <div className="text-xs text-gray-500">Department Hubs</div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-400">100</div>
                        <div className="text-xs text-gray-500">Subagents</div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
                        <div className="text-2xl font-bold text-amber-400">10</div>
                        <div className="text-xs text-gray-500">Equity Stakes</div>
                    </div>
                </div>
            </div>

            {/* Hub Tier Breakdown */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-400" />
                    Revenue by Hub Tier
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 text-gray-400 font-normal">Tier</th>
                                <th className="text-left py-3 text-gray-400 font-normal">Examples</th>
                                <th className="text-right py-3 text-gray-400 font-normal">MRR</th>
                                <th className="text-right py-3 text-gray-400 font-normal">ARR</th>
                                <th className="text-right py-3 text-gray-400 font-normal">% of $1M</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hubTiers.map((tier) => (
                                <tr key={tier.tier} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 font-medium text-white">{tier.tier}</td>
                                    <td className="py-3 text-gray-400 text-xs">{tier.examples}</td>
                                    <td className="py-3 text-right text-green-400">{tier.mrr}</td>
                                    <td className="py-3 text-right text-blue-400 font-bold">{tier.arr}</td>
                                    <td className="py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                                    style={{ width: `${tier.pct}%` }}
                                                />
                                            </div>
                                            <span className="text-gray-400 w-8">{tier.pct}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-white/20">
                                <td className="py-3 font-bold text-white">Total</td>
                                <td className="py-3 text-gray-400">82 Hubs + Equity</td>
                                <td className="py-3 text-right text-green-400 font-bold">$83K+</td>
                                <td className="py-3 text-right text-blue-400 font-bold">$1,000,000</td>
                                <td className="py-3 text-right text-white font-bold">100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* WIN-WIN-WIN */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    🏯 WIN-WIN-WIN Model
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl mb-2">👑</div>
                        <div className="font-bold text-amber-400">Anh WIN</div>
                        <div className="text-xs text-gray-400 mt-1">Equity + Cash Flow + Legacy</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl mb-2">🏢</div>
                        <div className="font-bold text-blue-400">Agency WIN</div>
                        <div className="text-xs text-gray-400 mt-1">Deal Flow + Knowledge + Infra</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl mb-2">🚀</div>
                        <div className="font-bold text-green-400">Startup WIN</div>
                        <div className="text-xs text-gray-400 mt-1">Protection + Strategy + Network</div>
                    </div>
                </div>
            </div>
        </DepartmentDashboard>
    );
}
