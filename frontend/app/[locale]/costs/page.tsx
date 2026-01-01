'use client';

import { DollarSign, TrendingDown, AlertTriangle, PieChart, Calculator, Target } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const costsMetrics = [
    { label: 'Total Costs', value: '$285K', icon: <DollarSign className="w-5 h-5" />, color: '#ef4444', trend: { value: '-$12K', direction: 'down' as const } },
    { label: 'Budget Used', value: '78%', icon: <PieChart className="w-5 h-5" />, color: '#3b82f6', trend: { value: 'On Track', direction: 'up' as const } },
    { label: 'Savings', value: '$42K', icon: <TrendingDown className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$8K', direction: 'up' as const } },
    { label: 'Overruns', value: '2', icon: <AlertTriangle className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-1', direction: 'down' as const } },
];

const costsByCategory = [
    { name: 'Personnel', value: 145000, color: '#3b82f6' },
    { name: 'Software', value: 52000, color: '#22c55e' },
    { name: 'Marketing', value: 48000, color: '#ec4899' },
    { name: 'Operations', value: 28000, color: '#f59e0b' },
    { name: 'Other', value: 12000, color: '#a855f7' },
];

const monthlySpend = [
    { name: 'Jul', value: 42000 }, { name: 'Aug', value: 45000 }, { name: 'Sep', value: 48000 },
    { name: 'Oct', value: 50000 }, { name: 'Nov', value: 52000 }, { name: 'Dec', value: 48000 },
];

const costsCharts = [
    { type: 'pie' as const, title: 'Costs by Category', data: costsByCategory },
    { type: 'area' as const, title: 'Monthly Spend', data: monthlySpend },
];

const costsActions = [
    { icon: '📊', label: 'Dashboard', onClick: () => { } },
    { icon: '📋', label: 'Budget', onClick: () => { } },
    { icon: '💰', label: 'Savings', onClick: () => { } },
    { icon: '⚠️', label: 'Alerts', onClick: () => { } },
    { icon: '📈', label: 'Forecast', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function CostsPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Costs Hub" subtitle="Budget • Expenses • Savings • Forecasting" icon="💰" color="red"
            statusLabel="Total" statusValue="$285K" metrics={costsMetrics} charts={costsCharts} quickActions={costsActions} locale={locale}
        />
    );
}
