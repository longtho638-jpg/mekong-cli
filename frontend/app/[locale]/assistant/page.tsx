'use client';

import { Bot, MessageSquare, Zap, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const assistantMetrics = [
    { label: 'Queries Today', value: '248', icon: <MessageSquare className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+32', direction: 'up' as const } },
    { label: 'Avg Response', value: '1.2s', icon: <Zap className="w-5 h-5" />, color: '#22c55e', trend: { value: '-0.3s', direction: 'down' as const } },
    { label: 'Accuracy', value: '96%', icon: <CheckCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: '+2%', direction: 'up' as const } },
    { label: 'Tasks Done', value: '1.2K', icon: <Sparkles className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+180', direction: 'up' as const } },
];

const queryTypes = [
    { name: 'Research', value: 85, color: '#3b82f6' },
    { name: 'Writing', value: 62, color: '#22c55e' },
    { name: 'Analysis', value: 55, color: '#a855f7' },
    { name: 'Coding', value: 46, color: '#f59e0b' },
];

const dailyUsage = [
    { name: 'Mon', value: 180 }, { name: 'Tue', value: 220 }, { name: 'Wed', value: 195 },
    { name: 'Thu', value: 248 }, { name: 'Fri', value: 210 },
];

const assistantCharts = [
    { type: 'bar' as const, title: 'Queries by Type', data: queryTypes },
    { type: 'area' as const, title: 'Daily Usage', data: dailyUsage },
];

const assistantActions = [
    { icon: '💬', label: 'New Chat', onClick: () => { } },
    { icon: '📝', label: 'Templates', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🧠', label: 'Train', onClick: () => { } },
    { icon: '📚', label: 'History', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function AssistantPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="AI Assistant" subtitle="Chat • Research • Writing • Analysis" icon="🤖" color="blue"
            statusLabel="Queries" statusValue="248" metrics={assistantMetrics} charts={assistantCharts} quickActions={assistantActions} locale={locale}
        />
    );
}
