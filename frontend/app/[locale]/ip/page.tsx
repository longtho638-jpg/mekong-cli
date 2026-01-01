'use client';

import { Lightbulb, FileText, Shield, DollarSign, Award, Scale } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const ipMetrics = [
    { label: 'Patents', value: '24', icon: <Lightbulb className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+4', direction: 'up' as const } },
    { label: 'Trademarks', value: '48', icon: <Shield className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Portfolio Value', value: '$2.4M', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$380K', direction: 'up' as const } },
    { label: 'Pending', value: '12', icon: <FileText className="w-5 h-5" />, color: '#a855f7', trend: { value: '+3', direction: 'up' as const } },
];

const ipByType = [
    { name: 'Patents', value: 24, color: '#f59e0b' },
    { name: 'Trademarks', value: 48, color: '#3b82f6' },
    { name: 'Copyrights', value: 32, color: '#22c55e' },
    { name: 'Trade Secrets', value: 15, color: '#a855f7' },
];

const annualFilings = [
    { name: '2020', value: 8 }, { name: '2021', value: 12 }, { name: '2022', value: 15 },
    { name: '2023', value: 18 }, { name: '2024', value: 22 }, { name: '2025', value: 24 },
];

const ipCharts = [
    { type: 'pie' as const, title: 'IP Portfolio', data: ipByType },
    { type: 'area' as const, title: 'Annual Filings', data: annualFilings },
];

const ipActions = [
    { icon: '💡', label: 'New Filing', onClick: () => { } },
    { icon: '📋', label: 'Portfolio', onClick: () => { } },
    { icon: '🔍', label: 'Search', onClick: () => { } },
    { icon: '⚖️', label: 'Legal', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function IPPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="IP Hub" subtitle="Patents • Trademarks • Copyrights • Trade Secrets" icon="💡" color="orange"
            statusLabel="Portfolio" statusValue="$2.4M" metrics={ipMetrics} charts={ipCharts} quickActions={ipActions} locale={locale}
        />
    );
}
