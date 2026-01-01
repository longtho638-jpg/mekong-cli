'use client';

import { Phone, DollarSign, Users, TrendingUp, Target, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const osrMetrics = [
    { label: 'Calls Made', value: '1.2K', icon: <Phone className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+180', direction: 'up' as const } },
    { label: 'Revenue', value: '$85K', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$12K', direction: 'up' as const } },
    { label: 'Close Rate', value: '18%', icon: <Target className="w-5 h-5" />, color: '#a855f7', trend: { value: '+2%', direction: 'up' as const } },
    { label: 'Avg Deal', value: '$2.8K', icon: <TrendingUp className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$220', direction: 'up' as const } },
];

const salesByProduct = [
    { name: 'Premium', value: 42000, color: '#22c55e' },
    { name: 'Standard', value: 28000, color: '#3b82f6' },
    { name: 'Basic', value: 15000, color: '#f59e0b' },
];

const dailyCalls = [
    { name: 'Mon', value: 180 }, { name: 'Tue', value: 220 }, { name: 'Wed', value: 195 },
    { name: 'Thu', value: 240 }, { name: 'Fri', value: 165 },
];

const osrCharts = [
    { type: 'pie' as const, title: 'Revenue by Product', data: salesByProduct },
    { type: 'bar' as const, title: 'Daily Calls', data: dailyCalls.map(d => ({ ...d, color: '#3b82f6' })) },
];

const osrActions = [
    { icon: '📞', label: 'Call', onClick: () => { } },
    { icon: '📋', label: 'Queue', onClick: () => { } },
    { icon: '📊', label: 'Stats', onClick: () => { } },
    { icon: '🎯', label: 'Targets', onClick: () => { } },
    { icon: '📝', label: 'Scripts', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function OSRPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Outbound Sales" subtitle="Outreach • Pipeline • Closing • Revenue" icon="📞" color="blue"
            statusLabel="Revenue" statusValue="$85K" metrics={osrMetrics} charts={osrCharts} quickActions={osrActions} locale={locale}
        />
    );
}
