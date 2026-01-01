'use client';

import { Rocket, DollarSign, Users, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// Entrepreneur Metrics
const entrepreneurMetrics = [
    {
        label: 'Runway',
        value: '18mo',
        icon: <DollarSign className="w-5 h-5" />,
        color: '#22c55e',
        trend: { value: 'Healthy', direction: 'up' as const },
    },
    {
        label: 'MRR',
        value: '$42K',
        icon: <TrendingUp className="w-5 h-5" />,
        color: '#3b82f6',
        trend: { value: '+15%', direction: 'up' as const },
    },
    {
        label: 'Active Users',
        value: '2.4K',
        icon: <Users className="w-5 h-5" />,
        color: '#a855f7',
        trend: { value: '+340', direction: 'up' as const },
    },
    {
        label: 'Ideas Validated',
        value: '12',
        icon: <Lightbulb className="w-5 h-5" />,
        color: '#f59e0b',
        trend: { value: '+3', direction: 'up' as const },
    },
];

// Revenue Growth
const revenueGrowth = [
    { name: 'Jul', value: 28000 },
    { name: 'Aug', value: 31000 },
    { name: 'Sep', value: 35000 },
    { name: 'Oct', value: 38000 },
    { name: 'Nov', value: 40000 },
    { name: 'Dec', value: 42000 },
];

// Acquisition Channels
const channels = [
    { name: 'Organic', value: 45, color: '#22c55e' },
    { name: 'Paid Ads', value: 30, color: '#3b82f6' },
    { name: 'Referral', value: 15, color: '#a855f7' },
    { name: 'Direct', value: 10, color: '#f59e0b' },
];

// Experiment Status
const experiments = [
    { name: 'Won', value: 5, color: '#22c55e' },
    { name: 'Running', value: 4, color: '#3b82f6' },
    { name: 'Lost', value: 3, color: '#ef4444' },
];

const entrepreneurCharts = [
    { type: 'area' as const, title: 'MRR Growth', data: revenueGrowth },
    { type: 'pie' as const, title: 'Acquisition Channels', data: channels },
    { type: 'bar' as const, title: 'Experiment Results', data: experiments },
];

const entrepreneurActions = [
    { icon: '💡', label: 'New Idea', onClick: () => console.log('New Idea') },
    { icon: '🧪', label: 'Experiment', onClick: () => console.log('Experiment') },
    { icon: '📊', label: 'Metrics', onClick: () => console.log('Metrics') },
    { icon: '🎯', label: 'OKRs', onClick: () => console.log('OKRs') },
    { icon: '💰', label: 'Fundraise', onClick: () => console.log('Fundraise') },
    { icon: '🚀', label: 'Launch', onClick: () => console.log('Launch') },
];

export default function EntrepreneurPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard
            title="Founder Hub"
            subtitle="Startup Metrics • Experiments • Growth • Fundraising"
            icon="🚀"
            color="orange"
            statusLabel="MRR"
            statusValue="$42K"
            metrics={entrepreneurMetrics}
            charts={entrepreneurCharts}
            quickActions={entrepreneurActions}
            locale={locale}
        >
            {/* Startup Checklist */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-orange-400" />
                    Startup Velocity Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { item: 'Product-Market Fit', status: 'achieved', score: '85%' },
                        { item: 'Growth Engine', status: 'building', score: '60%' },
                        { item: 'Unit Economics', status: 'achieved', score: '92%' },
                        { item: 'Team Scale', status: 'planned', score: '40%' },
                    ].map((check) => (
                        <div key={check.item} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className={`text-lg ${check.status === 'achieved' ? 'text-green-400' :
                                        check.status === 'building' ? 'text-yellow-400' : 'text-gray-400'
                                    }`}>
                                    {check.status === 'achieved' ? '✅' : check.status === 'building' ? '🔨' : '📋'}
                                </span>
                                <span className="text-white">{check.item}</span>
                            </div>
                            <span className="text-sm font-bold text-orange-400">{check.score}</span>
                        </div>
                    ))}
                </div>
            </div>
        </DepartmentDashboard>
    );
}
