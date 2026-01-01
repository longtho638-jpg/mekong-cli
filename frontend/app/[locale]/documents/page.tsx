'use client';

import { FileText, Folder, Search, Clock, Users, Lock } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const docsMetrics = [
    { label: 'Documents', value: '2,450', icon: <FileText className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+180', direction: 'up' as const } },
    { label: 'Storage', value: '45 GB', icon: <Folder className="w-5 h-5" />, color: '#22c55e', trend: { value: '+5 GB', direction: 'up' as const } },
    { label: 'Shared', value: '680', icon: <Users className="w-5 h-5" />, color: '#a855f7', trend: { value: '+45', direction: 'up' as const } },
    { label: 'Recent', value: '124', icon: <Clock className="w-5 h-5" />, color: '#f59e0b', trend: { value: 'Today', direction: 'up' as const } },
];

const docsByType = [
    { name: 'PDFs', value: 850, color: '#ef4444' },
    { name: 'Docs', value: 720, color: '#3b82f6' },
    { name: 'Sheets', value: 480, color: '#22c55e' },
    { name: 'Slides', value: 280, color: '#f59e0b' },
    { name: 'Other', value: 120, color: '#a855f7' },
];

const weeklyActivity = [
    { name: 'Mon', value: 85 }, { name: 'Tue', value: 120 }, { name: 'Wed', value: 95 },
    { name: 'Thu', value: 140 }, { name: 'Fri', value: 110 },
];

const docsCharts = [
    { type: 'pie' as const, title: 'Documents by Type', data: docsByType },
    { type: 'bar' as const, title: 'Weekly Activity', data: weeklyActivity.map(d => ({ ...d, color: '#3b82f6' })) },
];

const docsActions = [
    { icon: '📄', label: 'New Doc', onClick: () => { } },
    { icon: '📁', label: 'Folders', onClick: () => { } },
    { icon: '🔍', label: 'Search', onClick: () => { } },
    { icon: '📤', label: 'Upload', onClick: () => { } },
    { icon: '🔒', label: 'Private', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function DocumentsPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Documents Hub" subtitle="Files • Folders • Sharing • Search" icon="📁" color="blue"
            statusLabel="Files" statusValue="2,450" metrics={docsMetrics} charts={docsCharts} quickActions={docsActions} locale={locale}
        />
    );
}
