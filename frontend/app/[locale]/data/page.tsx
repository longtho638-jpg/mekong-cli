'use client';

import { Database, TrendingUp, BarChart3, Search, Zap, Shield } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const dataMetrics = [
    { label: 'Data Sources', value: '24', icon: <Database className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+4', direction: 'up' as const } },
    { label: 'Reports Generated', value: '156', icon: <BarChart3 className="w-5 h-5" />, color: '#22c55e', trend: { value: '+32', direction: 'up' as const } },
    { label: 'Query Performance', value: '98%', icon: <Zap className="w-5 h-5" />, color: '#a855f7', trend: { value: '+2%', direction: 'up' as const } },
    { label: 'Data Quality', value: '94%', icon: <Shield className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+3%', direction: 'up' as const } },
];

const dataBySource = [
    { name: 'CRM', value: 2500000, color: '#3b82f6' },
    { name: 'Analytics', value: 1800000, color: '#22c55e' },
    { name: 'Marketing', value: 1200000, color: '#ec4899' },
    { name: 'Finance', value: 800000, color: '#f59e0b' },
];

const dailyQueries = [
    { name: 'Mon', value: 12000 }, { name: 'Tue', value: 15000 }, { name: 'Wed', value: 14000 },
    { name: 'Thu', value: 18000 }, { name: 'Fri', value: 16000 }, { name: 'Sat', value: 8000 }, { name: 'Sun', value: 6000 },
];

const dataCharts = [
    { type: 'bar' as const, title: 'Records by Source', data: dataBySource },
    { type: 'area' as const, title: 'Daily Query Volume', data: dailyQueries },
];

const dataActions = [
    { icon: '🔍', label: 'Query', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '🔗', label: 'Pipelines', onClick: () => { } },
    { icon: '📋', label: 'Catalog', onClick: () => { } },
    { icon: '🛡️', label: 'Governance', onClick: () => { } },
    { icon: '⚙️', label: 'Config', onClick: () => { } },
];

export default function DataPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Data Hub" subtitle="Analytics • Warehousing • Pipelines • Governance" icon="📊" color="cyan"
            statusLabel="Sources" statusValue="24" metrics={dataMetrics} charts={dataCharts} quickActions={dataActions} locale={locale}
        />
    );
}
