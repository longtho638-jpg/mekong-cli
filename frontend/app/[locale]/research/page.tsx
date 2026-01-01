'use client';

import { Search, FileText, Lightbulb, TrendingUp, Users, Star } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const researchMetrics = [
    { label: 'Studies Active', value: '8', icon: <Search className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+2', direction: 'up' as const } },
    { label: 'Reports Published', value: '24', icon: <FileText className="w-5 h-5" />, color: '#22c55e', trend: { value: '+6', direction: 'up' as const } },
    { label: 'Insights Generated', value: '156', icon: <Lightbulb className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+32', direction: 'up' as const } },
    { label: 'Data Sources', value: '42', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+8', direction: 'up' as const } },
];

const studiesByType = [
    { name: 'Market', value: 12, color: '#3b82f6' },
    { name: 'User', value: 8, color: '#22c55e' },
    { name: 'Competitive', value: 6, color: '#f59e0b' },
    { name: 'Product', value: 5, color: '#a855f7' },
];

const monthlyReports = [
    { name: 'Jul', value: 3 }, { name: 'Aug', value: 5 }, { name: 'Sep', value: 4 },
    { name: 'Oct', value: 6 }, { name: 'Nov', value: 4 }, { name: 'Dec', value: 6 },
];

const researchCharts = [
    { type: 'pie' as const, title: 'Studies by Type', data: studiesByType },
    { type: 'bar' as const, title: 'Monthly Reports', data: monthlyReports.map(d => ({ ...d, color: '#3b82f6' })) },
];

const researchActions = [
    { icon: '🔍', label: 'New Study', onClick: () => { } },
    { icon: '📊', label: 'Data', onClick: () => { } },
    { icon: '💡', label: 'Insights', onClick: () => { } },
    { icon: '📋', label: 'Reports', onClick: () => { } },
    { icon: '📚', label: 'Library', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ResearchPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Research Hub" subtitle="Studies • Insights • Analysis • Reports" icon="🔬" color="blue"
            statusLabel="Studies" statusValue="8" metrics={researchMetrics} charts={researchCharts} quickActions={researchActions} locale={locale}
        />
    );
}
