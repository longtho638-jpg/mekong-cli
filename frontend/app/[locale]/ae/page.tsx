'use client';

import { Briefcase, DollarSign, Target, TrendingUp, Users, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const aeMetrics = [
    { label: 'Pipeline', value: '$2.4M', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$380K', direction: 'up' as const } },
    { label: 'Deals in Stage', value: '28', icon: <Briefcase className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+5', direction: 'up' as const } },
    { label: 'Win Rate', value: '32%', icon: <Target className="w-5 h-5" />, color: '#a855f7', trend: { value: '+4%', direction: 'up' as const } },
    { label: 'Avg Deal Size', value: '$85K', icon: <TrendingUp className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$12K', direction: 'up' as const } },
];

const dealsByStage = [
    { name: 'Discovery', value: 12, color: '#3b82f6' },
    { name: 'Demo', value: 8, color: '#a855f7' },
    { name: 'Proposal', value: 5, color: '#22c55e' },
    { name: 'Negotiation', value: 3, color: '#f59e0b' },
];

const monthlyRevenue = [
    { name: 'Jul', value: 180000 }, { name: 'Aug', value: 220000 }, { name: 'Sep', value: 195000 },
    { name: 'Oct', value: 280000 }, { name: 'Nov', value: 245000 }, { name: 'Dec', value: 320000 },
];

const aeCharts = [
    { type: 'bar' as const, title: 'Deals by Stage', data: dealsByStage },
    { type: 'area' as const, title: 'Monthly Closed Revenue', data: monthlyRevenue },
];

const aeActions = [
    { icon: '📋', label: 'Pipeline', onClick: () => { } },
    { icon: '📝', label: 'Proposal', onClick: () => { } },
    { icon: '📅', label: 'Demo', onClick: () => { } },
    { icon: '📊', label: 'Forecast', onClick: () => { } },
    { icon: '🎯', label: 'Quota', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function AEPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="AE Hub" subtitle="Deals • Demos • Proposals • Closing" icon="💼" color="green"
            statusLabel="Pipeline" statusValue="$2.4M" metrics={aeMetrics} charts={aeCharts} quickActions={aeActions} locale={locale}
        />
    );
}
