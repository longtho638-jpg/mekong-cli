'use client';

import { BarChart3, TrendingUp, Users, DollarSign, Target, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const hrAnalyticsMetrics = [
    { label: 'Headcount', value: '156', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Turnover', value: '8%', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '-2%', direction: 'down' as const } },
    { label: 'Cost/Hire', value: '$4.2K', icon: <DollarSign className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-$320', direction: 'down' as const } },
    { label: 'Time to Fill', value: '28d', icon: <Target className="w-5 h-5" />, color: '#a855f7', trend: { value: '-5d', direction: 'down' as const } },
];

const headcountByDept = [
    { name: 'Engineering', value: 52, color: '#3b82f6' },
    { name: 'Sales', value: 38, color: '#22c55e' },
    { name: 'Marketing', value: 28, color: '#ec4899' },
    { name: 'Operations', value: 24, color: '#f59e0b' },
    { name: 'HR', value: 14, color: '#a855f7' },
];

const turnoverTrend = [
    { name: 'Jul', value: 12 }, { name: 'Aug', value: 11 }, { name: 'Sep', value: 10 },
    { name: 'Oct', value: 9 }, { name: 'Nov', value: 8.5 }, { name: 'Dec', value: 8 },
];

const hrAnalyticsCharts = [
    { type: 'bar' as const, title: 'Headcount by Department', data: headcountByDept },
    { type: 'area' as const, title: 'Turnover Trend (%)', data: turnoverTrend },
];

const hrAnalyticsActions = [
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '👥', label: 'Headcount', onClick: () => { } },
    { icon: '📈', label: 'Trends', onClick: () => { } },
    { icon: '💰', label: 'Costs', onClick: () => { } },
    { icon: '🎯', label: 'Metrics', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function HRAnalyticsPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="HR Analytics" subtitle="Metrics • Trends • Costs • Insights" icon="📊" color="blue"
            statusLabel="Headcount" statusValue="156" metrics={hrAnalyticsMetrics} charts={hrAnalyticsCharts} quickActions={hrAnalyticsActions} locale={locale}
        />
    );
}
