'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

import { DollarSign, MousePointerClick, Target, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const channelPerformance = [
    { channel: 'Search Ads', spend: 45000, conversions: 890, roas: 3.8, color: '#3b82f6' },
    { channel: 'Display', spend: 25000, conversions: 320, roas: 2.1, color: '#8b5cf6' },
    { channel: 'Social Ads', spend: 38000, conversions: 720, roas: 3.2, color: '#a855f7' },
    { channel: 'Video', spend: 32000, conversions: 580, roas: 2.9, color: '#10b981' },
    { channel: 'Shopping', spend: 28000, conversions: 650, roas: 4.2, color: '#22c55e' },
];

const budgetAllocation = [
    { channel: 'Search', value: 35, fill: '#3b82f6' },
    { channel: 'Social', value: 28, fill: '#a855f7' },
    { channel: 'Display', fill: '#8b5cf6', value: 20 },
    { channel: 'Video', value: 12, fill: '#10b981' },
    { channel: 'Other', value: 5, fill: '#6b7280' },
];

const monthlyROI = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    roi: 250 + i * 25 + Math.random() * 50,
}));

export default function DigitalMarketingPage() {
    const { analytics } = useAnalytics();
    const totalSpend = channelPerformance.reduce((sum, c) => sum + c.spend, 0);
    const totalConversions = channelPerformance.reduce((sum, c) => sum + c.conversions, 0);
    const avgROAS = (channelPerformance.reduce((sum, c) => sum + c.roas, 0) / channelPerformance.length).toFixed(1);

    return (
        <MD3AppShell title="Digital Marketing 📊" subtitle="Multi-Channel Attribution • ROAS Optimization">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Total Spend</div>
                        <DollarSign className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="text-2xl font-bold text-violet-400">${(totalSpend / 1000).toFixed(0)}K</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Conversions</div>
                        <MousePointerClick className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{totalConversions.toLocaleString()}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Avg ROAS</div>
                        <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{avgROAS}x</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Channels</div>
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">5</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Channel Performance</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={channelPerformance} layout="vertical">
                            <XAxis type="number" stroke="#6b7280" fontSize={10} />
                            <YAxis type="category" dataKey="channel" stroke="#6b7280" fontSize={12} width={80} />
                            <Tooltip />
                            <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
                                {channelPerformance.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Budget Allocation</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={budgetAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                {budgetAllocation.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">ROI Trend (12 Months)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyROI}>
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                        <YAxis stroke="#6b7280" fontSize={10} />
                        <Line type="monotone" dataKey="roi" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </MD3Surface>
        </MD3AppShell>
    );
}
