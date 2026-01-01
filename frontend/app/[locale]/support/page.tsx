'use client';

import { Users, MessageSquare, Heart, TrendingUp, Star, Calendar } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const supportMetrics = [
    { label: 'Open Tickets', value: '42', icon: <MessageSquare className="w-5 h-5" />, color: '#3b82f6', trend: { value: '-8', direction: 'down' as const } },
    { label: 'Avg Response', value: '2.5h', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '-30m', direction: 'down' as const } },
    { label: 'CSAT Score', value: '4.8', icon: <Star className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+0.2', direction: 'up' as const } },
    { label: 'Resolution Rate', value: '94%', icon: <Heart className="w-5 h-5" />, color: '#a855f7', trend: { value: '+3%', direction: 'up' as const } },
];

const ticketsByPriority = [
    { name: 'Critical', value: 5, color: '#ef4444' },
    { name: 'High', value: 12, color: '#f59e0b' },
    { name: 'Medium', value: 15, color: '#3b82f6' },
    { name: 'Low', value: 10, color: '#22c55e' },
];

const dailyTickets = [
    { name: 'Mon', value: 45 }, { name: 'Tue', value: 52 }, { name: 'Wed', value: 38 },
    { name: 'Thu', value: 42 }, { name: 'Fri', value: 35 }, { name: 'Sat', value: 15 }, { name: 'Sun', value: 12 },
];

const supportCharts = [
    { type: 'bar' as const, title: 'Tickets by Priority', data: ticketsByPriority },
    { type: 'area' as const, title: 'Daily Ticket Volume', data: dailyTickets },
];

const supportActions = [
    { icon: '🎫', label: 'New Ticket', onClick: () => { } },
    { icon: '📋', label: 'Queue', onClick: () => { } },
    { icon: '💬', label: 'Live Chat', onClick: () => { } },
    { icon: '📚', label: 'Knowledge', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SupportPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Support Hub" subtitle="Tickets • Live Chat • Knowledge Base • CSAT" icon="🎧" color="blue"
            statusLabel="CSAT" statusValue="4.8" metrics={supportMetrics} charts={supportCharts} quickActions={supportActions} locale={locale}
        />
    );
}
