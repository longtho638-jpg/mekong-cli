'use client';

import { Briefcase, DollarSign, TrendingUp, PieChart, Target, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const portfolioMetrics = [
    { label: 'Total Value', value: '$4.2M', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$580K', direction: 'up' as const } },
    { label: 'Investments', value: '12', icon: <Briefcase className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+2', direction: 'up' as const } },
    { label: 'ROI', value: '+28%', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Exits', value: '3', icon: <Award className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+1', direction: 'up' as const } },
];

const portfolioByType = [
    { name: 'Equity', value: 2200000, color: '#22c55e' },
    { name: 'SAFEs', value: 1200000, color: '#3b82f6' },
    { name: 'Convertible', value: 500000, color: '#a855f7' },
    { name: 'Revenue Share', value: 300000, color: '#f59e0b' },
];

const monthlyValue = [
    { name: 'Jul', value: 3200000 }, { name: 'Aug', value: 3400000 }, { name: 'Sep', value: 3600000 },
    { name: 'Oct', value: 3800000 }, { name: 'Nov', value: 4000000 }, { name: 'Dec', value: 4200000 },
];

const portfolioCharts = [
    { type: 'pie' as const, title: 'Portfolio by Type', data: portfolioByType },
    { type: 'area' as const, title: 'Portfolio Value Trend', data: monthlyValue },
];

const portfolioActions = [
    { icon: '💼', label: 'Investments', onClick: () => { } },
    { icon: '📊', label: 'Performance', onClick: () => { } },
    { icon: '📋', label: 'Reports', onClick: () => { } },
    { icon: '🎯', label: 'Pipeline', onClick: () => { } },
    { icon: '🏆', label: 'Exits', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function PortfolioPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Portfolio Hub" subtitle="Investments • Performance • Exits • Returns" icon="💼" color="green"
            statusLabel="Value" statusValue="$4.2M" metrics={portfolioMetrics} charts={portfolioCharts} quickActions={portfolioActions} locale={locale}
        />
    );
}
