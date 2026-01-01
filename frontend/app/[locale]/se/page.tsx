'use client';

import { Briefcase, DollarSign, Users, TrendingUp, Award, Target } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const seMetrics = [
    { label: 'Demos', value: '48', icon: <Briefcase className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+12', direction: 'up' as const } },
    { label: 'POCs Active', value: '8', icon: <Target className="w-5 h-5" />, color: '#22c55e', trend: { value: '+2', direction: 'up' as const } },
    { label: 'Win Rate', value: '68%', icon: <Award className="w-5 h-5" />, color: '#a855f7', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Pipeline', value: '$1.8M', icon: <DollarSign className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$280K', direction: 'up' as const } },
];

const demosByProduct = [
    { name: 'Platform', value: 22, color: '#3b82f6' },
    { name: 'API', value: 15, color: '#22c55e' },
    { name: 'Mobile', value: 8, color: '#a855f7' },
    { name: 'Enterprise', value: 3, color: '#f59e0b' },
];

const weeklyDemos = [
    { name: 'Mon', value: 8 }, { name: 'Tue', value: 12 }, { name: 'Wed', value: 10 },
    { name: 'Thu', value: 14 }, { name: 'Fri', value: 6 },
];

const seCharts = [
    { type: 'pie' as const, title: 'Demos by Product', data: demosByProduct },
    { type: 'bar' as const, title: 'Weekly Demo Schedule', data: weeklyDemos.map(d => ({ ...d, color: '#3b82f6' })) },
];

const seActions = [
    { icon: '🎬', label: 'Demo', onClick: () => { } },
    { icon: '🧪', label: 'POC', onClick: () => { } },
    { icon: '📋', label: 'Scripts', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '📚', label: 'Library', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SEPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Sales Engineer" subtitle="Demos • POCs • Technical Sales • Solutions" icon="🔧" color="blue"
            statusLabel="Demos" statusValue="48" metrics={seMetrics} charts={seCharts} quickActions={seActions} locale={locale}
        />
    );
}
