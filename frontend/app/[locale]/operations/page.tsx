'use client';

import { Settings, Cog, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const operationsMetrics = [
    { label: 'Efficiency', value: '94%', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Processes', value: '48', icon: <Cog className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+6', direction: 'up' as const } },
    { label: 'SLA Met', value: '98%', icon: <CheckCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: '+2%', direction: 'up' as const } },
    { label: 'Incidents', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-4', direction: 'down' as const } },
];

const processByDept = [
    { name: 'Sales', value: 12, color: '#22c55e' },
    { name: 'Marketing', value: 10, color: '#ec4899' },
    { name: 'Support', value: 8, color: '#3b82f6' },
    { name: 'Finance', value: 6, color: '#f59e0b' },
];

const efficiencyTrend = [
    { name: 'Jul', value: 82 }, { name: 'Aug', value: 85 }, { name: 'Sep', value: 88 },
    { name: 'Oct', value: 90 }, { name: 'Nov', value: 92 }, { name: 'Dec', value: 94 },
];

const opsCharts = [
    { type: 'bar' as const, title: 'Processes by Department', data: processByDept },
    { type: 'area' as const, title: 'Efficiency Trend', data: efficiencyTrend },
];

const opsActions = [
    { icon: '⚙️', label: 'Processes', onClick: () => { } },
    { icon: '📊', label: 'Metrics', onClick: () => { } },
    { icon: '🔄', label: 'Automation', onClick: () => { } },
    { icon: '📋', label: 'SLAs', onClick: () => { } },
    { icon: '📈', label: 'Reports', onClick: () => { } },
    { icon: '🔧', label: 'Config', onClick: () => { } },
];

export default function OperationsPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Operations Hub" subtitle="Processes • Automation • Efficiency • SLAs" icon="⚙️" color="blue"
            statusLabel="Efficiency" statusValue="94%" metrics={operationsMetrics} charts={opsCharts} quickActions={opsActions} locale={locale}
        />
    );
}
