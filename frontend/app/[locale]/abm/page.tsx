'use client';

import { Target, Users, DollarSign, TrendingUp, Briefcase, Mail } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const abmMetrics = [
    { label: 'Target Accounts', value: '124', icon: <Target className="w-5 h-5" />, color: '#a855f7', trend: { value: '+18', direction: 'up' as const } },
    { label: 'Engaged', value: '68', icon: <Users className="w-5 h-5" />, color: '#22c55e', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Pipeline', value: '$4.2M', icon: <DollarSign className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+$800K', direction: 'up' as const } },
    { label: 'Conversion', value: '18%', icon: <TrendingUp className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+3%', direction: 'up' as const } },
];

const accountsByTier = [
    { name: 'Tier 1', value: 24, color: '#a855f7' },
    { name: 'Tier 2', value: 45, color: '#3b82f6' },
    { name: 'Tier 3', value: 55, color: '#22c55e' },
];

const engagementTrend = [
    { name: 'Jul', value: 42 }, { name: 'Aug', value: 48 }, { name: 'Sep', value: 52 },
    { name: 'Oct', value: 58 }, { name: 'Nov', value: 62 }, { name: 'Dec', value: 68 },
];

const abmCharts = [
    { type: 'pie' as const, title: 'Accounts by Tier', data: accountsByTier },
    { type: 'area' as const, title: 'Engagement Trend', data: engagementTrend },
];

const abmActions = [
    { icon: '🎯', label: 'Add Account', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '📧', label: 'Campaigns', onClick: () => { } },
    { icon: '👥', label: 'Contacts', onClick: () => { } },
    { icon: '📋', label: 'Plays', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ABMPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="ABM Hub" subtitle="Account-Based Marketing • Targeting • Engagement" icon="🎯" color="purple"
            statusLabel="Accounts" statusValue="124" metrics={abmMetrics} charts={abmCharts} quickActions={abmActions} locale={locale}
        />
    );
}
