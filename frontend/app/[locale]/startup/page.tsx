'use client';

import { Rocket, DollarSign, TrendingUp, Target, Users, Zap } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const startupMetrics = [
    { label: 'Runway', value: '14mo', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: 'Healthy', direction: 'up' as const } },
    { label: 'Burn Rate', value: '$45K', icon: <TrendingUp className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-$5K', direction: 'down' as const } },
    { label: 'Growth', value: '+28%', icon: <Rocket className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+8%', direction: 'up' as const } },
    { label: 'Team', value: '12', icon: <Users className="w-5 h-5" />, color: '#a855f7', trend: { value: '+3', direction: 'up' as const } },
];

const fundingStages = [
    { name: 'Raised', value: 850000, color: '#22c55e' },
    { name: 'Spent', value: 420000, color: '#f59e0b' },
    { name: 'Remaining', value: 430000, color: '#3b82f6' },
];

const growthTrend = [
    { name: 'Jul', value: 12 }, { name: 'Aug', value: 15 }, { name: 'Sep', value: 18 },
    { name: 'Oct', value: 22 }, { name: 'Nov', value: 25 }, { name: 'Dec', value: 28 },
];

const startupCharts = [
    { type: 'bar' as const, title: 'Funding Status ($)', data: fundingStages },
    { type: 'area' as const, title: 'MoM Growth (%)', data: growthTrend },
];

const startupActions = [
    { icon: '💰', label: 'Fundraise', onClick: () => { } },
    { icon: '📊', label: 'Metrics', onClick: () => { } },
    { icon: '🎯', label: 'OKRs', onClick: () => { } },
    { icon: '👥', label: 'Hiring', onClick: () => { } },
    { icon: '📋', label: 'Board', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function StartupPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Startup Hub" subtitle="Runway • Growth • Fundraising • Team" icon="🚀" color="green"
            statusLabel="Runway" statusValue="14mo" metrics={startupMetrics} charts={startupCharts} quickActions={startupActions} locale={locale}
        />
    );
}
