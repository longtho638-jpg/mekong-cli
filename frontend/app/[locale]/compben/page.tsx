'use client';

import { DollarSign, Gift, Users, TrendingUp, Heart, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const compbenMetrics = [
    { label: 'Total Package', value: '$8.2M', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$1.2M', direction: 'up' as const } },
    { label: 'Employees', value: '156', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Benefits Cost', value: '$1.8M', icon: <Gift className="w-5 h-5" />, color: '#a855f7', trend: { value: '+$180K', direction: 'up' as const } },
    { label: 'Satisfaction', value: '92%', icon: <Heart className="w-5 h-5" />, color: '#ec4899', trend: { value: '+5%', direction: 'up' as const } },
];

const compBreakdown = [
    { name: 'Base Salary', value: 5200000, color: '#22c55e' },
    { name: 'Bonus', value: 1200000, color: '#3b82f6' },
    { name: 'Benefits', value: 1800000, color: '#a855f7' },
];

const marketComparison = [
    { name: '25th', value: 85 }, { name: '50th', value: 100 }, { name: '75th', value: 115 },
    { name: 'You', value: 108 },
];

const compbenCharts = [
    { type: 'pie' as const, title: 'Comp Breakdown', data: compBreakdown },
    { type: 'bar' as const, title: 'Market Percentile', data: marketComparison.map(d => ({ ...d, color: d.name === 'You' ? '#22c55e' : '#3b82f6' })) },
];

const compbenActions = [
    { icon: '💰', label: 'Salary', onClick: () => { } },
    { icon: '🎁', label: 'Benefits', onClick: () => { } },
    { icon: '📊', label: 'Benchmarks', onClick: () => { } },
    { icon: '📋', label: 'Reviews', onClick: () => { } },
    { icon: '🏆', label: 'Equity', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function CompBenPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Comp & Benefits" subtitle="Salary • Benefits • Equity • Benchmarks" icon="💼" color="green"
            statusLabel="Package" statusValue="$8.2M" metrics={compbenMetrics} charts={compbenCharts} quickActions={compbenActions} locale={locale}
        />
    );
}
