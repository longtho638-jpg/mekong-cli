'use client';

import { Users, Heart, MessageCircle, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const erMetrics = [
    { label: 'Engagement', value: '78%', icon: <Heart className="w-5 h-5" />, color: '#ec4899', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Open Cases', value: '8', icon: <MessageCircle className="w-5 h-5" />, color: '#3b82f6', trend: { value: '-3', direction: 'down' as const } },
    { label: 'eNPS', value: '+42', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Resolved', value: '156', icon: <CheckCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: '+24', direction: 'up' as const } },
];

const casesByType = [
    { name: 'Policy', value: 45, color: '#3b82f6' },
    { name: 'Conflict', value: 28, color: '#ef4444' },
    { name: 'Benefits', value: 52, color: '#22c55e' },
    { name: 'General', value: 31, color: '#f59e0b' },
];

const monthlyEngagement = [
    { name: 'Jul', value: 68 }, { name: 'Aug', value: 70 }, { name: 'Sep', value: 72 },
    { name: 'Oct', value: 74 }, { name: 'Nov', value: 76 }, { name: 'Dec', value: 78 },
];

const erCharts = [
    { type: 'bar' as const, title: 'Cases by Category', data: casesByType },
    { type: 'area' as const, title: 'Engagement Trend', data: monthlyEngagement },
];

const erActions = [
    { icon: '📋', label: 'Cases', onClick: () => { } },
    { icon: '📊', label: 'Surveys', onClick: () => { } },
    { icon: '💬', label: 'Feedback', onClick: () => { } },
    { icon: '📝', label: 'Policies', onClick: () => { } },
    { icon: '🎉', label: 'Events', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ERPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Employee Relations" subtitle="Engagement • Cases • Feedback • Culture" icon="🤝" color="pink"
            statusLabel="eNPS" statusValue="+42" metrics={erMetrics} charts={erCharts} quickActions={erActions} locale={locale}
        />
    );
}
