'use client';

import { Box, Layers, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const productMetrics = [
    { label: 'Features', value: '48', icon: <Layers className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Releases', value: '12', icon: <Box className="w-5 h-5" />, color: '#22c55e', trend: { value: '+3', direction: 'up' as const } },
    { label: 'NPS', value: '+58', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+6', direction: 'up' as const } },
    { label: 'Adoption', value: '78%', icon: <Users className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+8%', direction: 'up' as const } },
];

const featuresByStatus = [
    { name: 'Shipped', value: 28, color: '#22c55e' },
    { name: 'In Dev', value: 12, color: '#3b82f6' },
    { name: 'Planned', value: 8, color: '#f59e0b' },
];

const velocityTrend = [
    { name: 'Jul', value: 6 }, { name: 'Aug', value: 8 }, { name: 'Sep', value: 7 },
    { name: 'Oct', value: 10 }, { name: 'Nov', value: 9 }, { name: 'Dec', value: 12 },
];

const productCharts = [
    { type: 'pie' as const, title: 'Features by Status', data: featuresByStatus },
    { type: 'bar' as const, title: 'Monthly Velocity', data: velocityTrend.map(d => ({ ...d, color: '#3b82f6' })) },
];

const productActions = [
    { icon: '📋', label: 'Roadmap', onClick: () => { } },
    { icon: '✨', label: 'Features', onClick: () => { } },
    { icon: '🐛', label: 'Bugs', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '👥', label: 'Feedback', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ProductPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Product Hub" subtitle="Roadmap • Features • Releases • Analytics" icon="📦" color="blue"
            statusLabel="Features" statusValue="48" metrics={productMetrics} charts={productCharts} quickActions={productActions} locale={locale}
        />
    );
}
