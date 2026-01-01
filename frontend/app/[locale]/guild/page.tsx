'use client';

import { Shield, Users, TrendingUp, Award, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// Guild Metrics
const guildMetrics = [
    { label: 'Trust Score', value: '67/100', icon: <Star className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+5', direction: 'up' as const } },
    { label: 'Network Members', value: '127', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Contributions', value: '24', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Protected Value', value: '$127K', icon: <Shield className="w-5 h-5" />, color: '#a855f7', trend: { value: '+$18K', direction: 'up' as const } },
];

// Tier Distribution
const tierDistribution = [
    { name: 'Queen Bees', value: 8, color: '#f59e0b' },
    { name: 'Workers', value: 67, color: '#3b82f6' },
    { name: 'Larvae', value: 52, color: '#22c55e' },
];

// Network Growth
const networkGrowth = [
    { name: 'Jul', value: 85 }, { name: 'Aug', value: 95 }, { name: 'Sep', value: 102 },
    { name: 'Oct', value: 110 }, { name: 'Nov', value: 118 }, { name: 'Dec', value: 127 },
];

// Contribution Activity
const contributionActivity = [
    { name: 'Reports', value: 156, color: '#3b82f6' },
    { name: 'Verifications', value: 423, color: '#22c55e' },
    { name: 'Referrals', value: 34, color: '#a855f7' },
    { name: 'Benchmarks', value: 89, color: '#f59e0b' },
];

const guildCharts = [
    { type: 'pie' as const, title: 'Member Tier Distribution', data: tierDistribution },
    { type: 'area' as const, title: 'Network Growth', data: networkGrowth },
    { type: 'bar' as const, title: 'Monthly Contributions', data: contributionActivity },
];

const guildActions = [
    { icon: '📋', label: 'My Status', onClick: () => console.log('Status') },
    { icon: '🤝', label: 'Join Guild', onClick: () => console.log('Join') },
    { icon: '📊', label: 'Contribute', onClick: () => console.log('Contribute') },
    { icon: '🌐', label: 'Network', onClick: () => console.log('Network') },
    { icon: '👤', label: 'Client DNA', onClick: () => console.log('Client DNA') },
    { icon: '🛡️', label: 'Defense', onClick: () => console.log('Defense') },
];

export default function GuildPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard
            title="Agency Guild"
            subtitle="Blue Ocean Protocol • Collective Intelligence • Mutual Protection"
            icon="🏰"
            color="orange"
            statusLabel="Trust"
            statusValue="67/100"
            metrics={guildMetrics}
            charts={guildCharts}
            quickActions={guildActions}
            locale={locale}
        >
            {/* Trust Score Progress */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Your Guild Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trust Score */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-400">Trust Score</span>
                            <span className="text-2xl font-bold text-amber-400">67/100</span>
                        </div>
                        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: '67%' }} />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Current: 🐝 Worker Bee</span>
                            <span>Next: 👑 Queen (85 pts)</span>
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="text-sm text-gray-400 mb-3">Score Breakdown</div>
                        <div className="space-y-2">
                            {[
                                { label: 'Base Score', value: '+50', icon: '📝' },
                                { label: 'Contributions', value: '+10', icon: '📊' },
                                { label: 'Referrals', value: '+5', icon: '🤝' },
                                { label: 'Tenure', value: '+2', icon: '⏰' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm">
                                        <span>{item.icon}</span>
                                        <span className="text-gray-400">{item.label}</span>
                                    </span>
                                    <span className="text-green-400 font-bold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Guild Constitution */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    📜 Guild Constitution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm text-gray-400 mb-2">✅ Member Pledges</div>
                        {['Contribute data to collective', 'Protect network from bad actors', 'Respect rate floor standards', 'Cross-refer when not a fit'].map((pledge) => (
                            <div key={pledge} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-gray-300">{pledge}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-gray-400 mb-2">❌ Violations</div>
                        {['Undercut guild rate floors', 'Share false client info', 'Steal referred clients', 'Break confidentiality'].map((violation) => (
                            <div key={violation} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-gray-300">{violation}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DepartmentDashboard>
    );
}
