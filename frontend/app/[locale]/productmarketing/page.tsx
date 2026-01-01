'use client';

import { Megaphone, Target, TrendingUp, Users, Rocket, BarChart3 } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const pmMetrics = [
    { label: 'Launches', value: '12', icon: <Rocket className="w-5 h-5" />, color: '#a855f7', trend: { value: '+3', direction: 'up' as const } },
    { label: 'Pipeline', value: '$2.8M', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$450K', direction: 'up' as const } },
    { label: 'Adoption', value: '78%', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+8%', direction: 'up' as const } },
    { label: 'Win Rate', value: '42%', icon: <Target className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+5%', direction: 'up' as const } },
];

const launchesByQ = [
    { name: 'Q1', value: 3, color: '#a855f7' },
    { name: 'Q2', value: 4, color: '#a855f7' },
    { name: 'Q3', value: 2, color: '#a855f7' },
    { name: 'Q4', value: 3, color: '#a855f7' },
];

const monthlyPipeline = [
    { name: 'Jul', value: 1800000 }, { name: 'Aug', value: 2100000 }, { name: 'Sep', value: 2300000 },
    { name: 'Oct', value: 2500000 }, { name: 'Nov', value: 2650000 }, { name: 'Dec', value: 2800000 },
];

const pmCharts = [
    { type: 'bar' as const, title: 'Launches by Quarter', data: launchesByQ },
    { type: 'area' as const, title: 'Pipeline Growth', data: monthlyPipeline },
];

const pmActions = [
    { icon: '🚀', label: 'New Launch', onClick: () => { } },
    { icon: '📋', label: 'Campaigns', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🎯', label: 'Positioning', onClick: () => { } },
    { icon: '📝', label: 'Messaging', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ProductMarketingPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Product Marketing" subtitle="Launches • Positioning • Messaging • GTM" icon="🚀" color="purple"
            statusLabel="Launches" statusValue="12" metrics={pmMetrics} charts={pmCharts} quickActions={pmActions} locale={locale}
        />
    );
}
