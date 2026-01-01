'use client';

import { Briefcase, FolderOpen, Clock, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const projectsMetrics = [
    { label: 'Active Projects', value: '24', icon: <FolderOpen className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+4', direction: 'up' as const } },
    { label: 'On Track', value: '18', icon: <CheckCircle className="w-5 h-5" />, color: '#22c55e', trend: { value: '75%', direction: 'up' as const } },
    { label: 'Team Members', value: '86', icon: <Users className="w-5 h-5" />, color: '#a855f7', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Utilization', value: '82%', icon: <TrendingUp className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+5%', direction: 'up' as const } },
];

const projectsByStatus = [
    { name: 'On Track', value: 18, color: '#22c55e' },
    { name: 'At Risk', value: 4, color: '#f59e0b' },
    { name: 'Delayed', value: 2, color: '#ef4444' },
];

const monthlyDelivery = [
    { name: 'Jul', value: 8 }, { name: 'Aug', value: 12 }, { name: 'Sep', value: 10 },
    { name: 'Oct', value: 15 }, { name: 'Nov', value: 11 }, { name: 'Dec', value: 14 },
];

const projectsCharts = [
    { type: 'pie' as const, title: 'Projects by Status', data: projectsByStatus },
    { type: 'bar' as const, title: 'Monthly Deliveries', data: monthlyDelivery.map(d => ({ ...d, color: '#3b82f6' })) },
];

const projectsActions = [
    { icon: '➕', label: 'New Project', onClick: () => { } },
    { icon: '📋', label: 'Board', onClick: () => { } },
    { icon: '📅', label: 'Timeline', onClick: () => { } },
    { icon: '👥', label: 'Resources', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ProjectsPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Projects Hub" subtitle="Planning • Tracking • Resources • Delivery" icon="📁" color="blue"
            statusLabel="Active" statusValue="24" metrics={projectsMetrics} charts={projectsCharts} quickActions={projectsActions} locale={locale}
        />
    );
}
