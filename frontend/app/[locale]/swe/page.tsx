'use client';

import { Code, GitBranch, Bug, Zap, Users, CheckCircle } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const sweMetrics = [
    { label: 'PRs Merged', value: '248', icon: <GitBranch className="w-5 h-5" />, color: '#22c55e', trend: { value: '+42', direction: 'up' as const } },
    { label: 'Bugs Fixed', value: '86', icon: <Bug className="w-5 h-5" />, color: '#ef4444', trend: { value: '+18', direction: 'up' as const } },
    { label: 'Code Coverage', value: '82%', icon: <CheckCircle className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Velocity', value: '42pts', icon: <Zap className="w-5 h-5" />, color: '#a855f7', trend: { value: '+8pts', direction: 'up' as const } },
];

const commitsByRepo = [
    { name: 'Frontend', value: 120, color: '#3b82f6' },
    { name: 'Backend', value: 85, color: '#22c55e' },
    { name: 'Mobile', value: 45, color: '#a855f7' },
    { name: 'Infra', value: 28, color: '#f59e0b' },
];

const weeklyVelocity = [
    { name: 'W1', value: 38 }, { name: 'W2', value: 42 }, { name: 'W3', value: 40 },
    { name: 'W4', value: 45 }, { name: 'W5', value: 42 },
];

const sweCharts = [
    { type: 'bar' as const, title: 'Commits by Repo', data: commitsByRepo },
    { type: 'area' as const, title: 'Weekly Velocity', data: weeklyVelocity },
];

const sweActions = [
    { icon: '💻', label: 'PRs', onClick: () => { } },
    { icon: '🐛', label: 'Bugs', onClick: () => { } },
    { icon: '📊', label: 'Metrics', onClick: () => { } },
    { icon: '📋', label: 'Sprints', onClick: () => { } },
    { icon: '🚀', label: 'Deploy', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SWEPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Software Engineering" subtitle="Development • PRs • Velocity • Quality" icon="💻" color="green"
            statusLabel="PRs" statusValue="248" metrics={sweMetrics} charts={sweCharts} quickActions={sweActions} locale={locale}
        />
    );
}
