'use client';

import { Crown, TrendingUp, Target, Users, Calendar, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// Executive Metrics
const execMetrics = [
    {
        label: 'Revenue YTD',
        value: '$2.4M',
        icon: <TrendingUp className="w-5 h-5" />,
        color: '#22c55e',
        trend: { value: '+18%', direction: 'up' as const },
    },
    {
        label: 'Team Size',
        value: '156',
        icon: <Users className="w-5 h-5" />,
        color: '#3b82f6',
        trend: { value: '+12', direction: 'up' as const },
    },
    {
        label: 'OKR Progress',
        value: '78%',
        icon: <Target className="w-5 h-5" />,
        color: '#a855f7',
        trend: { value: 'On Track', direction: 'up' as const },
    },
    {
        label: 'NPS Score',
        value: '+52',
        icon: <Award className="w-5 h-5" />,
        color: '#f59e0b',
        trend: { value: '+8', direction: 'up' as const },
    },
];

// Revenue by Quarter
const revenueByQ = [
    { name: 'Q1', value: 580000, color: '#22c55e' },
    { name: 'Q2', value: 620000, color: '#22c55e' },
    { name: 'Q3', value: 680000, color: '#22c55e' },
    { name: 'Q4', value: 520000, color: '#22c55e' },
];

// Department Performance
const deptPerformance = [
    { name: 'Engineering', value: 92 },
    { name: 'Sales', value: 88 },
    { name: 'Marketing', value: 85 },
    { name: 'Operations', value: 90 },
];

// Strategic Initiatives
const initiatives = [
    { name: 'Completed', value: 12, color: '#22c55e' },
    { name: 'In Progress', value: 8, color: '#3b82f6' },
    { name: 'Planned', value: 5, color: '#f59e0b' },
];

const execCharts = [
    { type: 'bar' as const, title: 'Revenue by Quarter', data: revenueByQ },
    { type: 'bar' as const, title: 'Department OKR Performance', data: deptPerformance.map(d => ({ ...d, color: '#a855f7' })) },
    { type: 'pie' as const, title: 'Strategic Initiatives', data: initiatives },
];

const execActions = [
    { icon: '📊', label: 'Board Deck', onClick: () => console.log('Board Deck') },
    { icon: '🎯', label: 'OKRs', onClick: () => console.log('OKRs') },
    { icon: '📅', label: 'Leadership', onClick: () => console.log('Leadership') },
    { icon: '💰', label: 'Financials', onClick: () => console.log('Financials') },
    { icon: '👥', label: 'Org Chart', onClick: () => console.log('Org Chart') },
    { icon: '📈', label: 'Insights', onClick: () => console.log('Insights') },
];

export default function ExecutivePage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard
            title="Executive Suite"
            subtitle="Strategy • Leadership • Performance • Governance"
            icon="👔"
            color="purple"
            statusLabel="Revenue"
            statusValue="$2.4M"
            metrics={execMetrics}
            charts={execCharts}
            quickActions={execActions}
            locale={locale}
        >
            {/* Key Priorities */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-400" />
                    This Week's Priorities
                </h3>
                <div className="space-y-3">
                    {[
                        { priority: 'High', item: 'Q1 Board Meeting Prep', due: 'Jan 5', color: '#ef4444' },
                        { priority: 'High', item: 'Series A Term Sheet Review', due: 'Jan 8', color: '#ef4444' },
                        { priority: 'Med', item: 'Department Budget Reviews', due: 'Jan 10', color: '#f59e0b' },
                        { priority: 'Low', item: 'Team All-Hands Planning', due: 'Jan 15', color: '#22c55e' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                <span className="text-white">{item.item}</span>
                            </div>
                            <span className="text-xs text-gray-400">Due: {item.due}</span>
                        </div>
                    ))}
                </div>
            </div>
        </DepartmentDashboard>
    );
}
