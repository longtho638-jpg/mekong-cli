'use client';

import { Award, Users, TrendingUp, Heart, Star, Target } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const successMetrics = [
    { label: 'Active Clients', value: '124', icon: <Users className="w-5 h-5" />, color: '#22c55e', trend: { value: '+18', direction: 'up' as const } },
    { label: 'Health Score', value: '87%', icon: <Heart className="w-5 h-5" />, color: '#ec4899', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'NPS', value: '+62', icon: <Star className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Expansion', value: '$380K', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+$52K', direction: 'up' as const } },
];

const clientsByHealth = [
    { name: 'Healthy', value: 85, color: '#22c55e' },
    { name: 'At Risk', value: 28, color: '#f59e0b' },
    { name: 'Critical', value: 11, color: '#ef4444' },
];

const monthlyRetention = [
    { name: 'Jul', value: 92 }, { name: 'Aug', value: 94 }, { name: 'Sep', value: 93 },
    { name: 'Oct', value: 95 }, { name: 'Nov', value: 96 }, { name: 'Dec', value: 97 },
];

const successCharts = [
    { type: 'pie' as const, title: 'Clients by Health', data: clientsByHealth },
    { type: 'area' as const, title: 'Monthly Retention %', data: monthlyRetention },
];

const successActions = [
    { icon: '👥', label: 'Clients', onClick: () => { } },
    { icon: '❤️', label: 'Health', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🎯', label: 'Playbooks', onClick: () => { } },
    { icon: '📝', label: 'Reviews', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SuccessPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Customer Success" subtitle="Health • Retention • Expansion • NPS" icon="🏆" color="green"
            statusLabel="NPS" statusValue="+62" metrics={successMetrics} charts={successCharts} quickActions={successActions} locale={locale}
        />
    );
}
