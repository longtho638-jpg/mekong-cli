'use client';

import { Briefcase, DollarSign, Users, Target, TrendingUp, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const saMetrics = [
    { label: 'Active Accounts', value: '48', icon: <Briefcase className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+6', direction: 'up' as const } },
    { label: 'ARR', value: '$2.4M', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$380K', direction: 'up' as const } },
    { label: 'NRR', value: '118%', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Health Score', value: '85', icon: <Award className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+8', direction: 'up' as const } },
];

const accountsByTier = [
    { name: 'Enterprise', value: 12, color: '#22c55e' },
    { name: 'Growth', value: 18, color: '#3b82f6' },
    { name: 'SMB', value: 18, color: '#a855f7' },
];

const monthlyExpansion = [
    { name: 'Jul', value: 45000 }, { name: 'Aug', value: 52000 }, { name: 'Sep', value: 58000 },
    { name: 'Oct', value: 65000 }, { name: 'Nov', value: 72000 }, { name: 'Dec', value: 80000 },
];

const saCharts = [
    { type: 'pie' as const, title: 'Accounts by Tier', data: accountsByTier },
    { type: 'area' as const, title: 'Monthly Expansion ($)', data: monthlyExpansion },
];

const saActions = [
    { icon: '👥', label: 'Accounts', onClick: () => { } },
    { icon: '📊', label: 'Health', onClick: () => { } },
    { icon: '🎯', label: 'Expansion', onClick: () => { } },
    { icon: '📋', label: 'Reviews', onClick: () => { } },
    { icon: '📈', label: 'Reports', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SAPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Strategic Accounts" subtitle="Enterprise • Expansion • Retention • NRR" icon="🏢" color="blue"
            statusLabel="ARR" statusValue="$2.4M" metrics={saMetrics} charts={saCharts} quickActions={saActions} locale={locale}
        />
    );
}
