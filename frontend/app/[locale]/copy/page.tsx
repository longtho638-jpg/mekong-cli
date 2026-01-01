'use client';

import { PenTool, FileText, TrendingUp, Eye, Star, Zap } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const copyMetrics = [
    { label: 'Pieces Written', value: '248', icon: <PenTool className="w-5 h-5" />, color: '#a855f7', trend: { value: '+32', direction: 'up' as const } },
    { label: 'Approval Rate', value: '92%', icon: <Star className="w-5 h-5" />, color: '#22c55e', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Avg CTR', value: '4.8%', icon: <TrendingUp className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+0.6%', direction: 'up' as const } },
    { label: 'A/B Tests', value: '18', icon: <Zap className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+4', direction: 'up' as const } },
];

const copyByType = [
    { name: 'Ads', value: 85, color: '#a855f7' },
    { name: 'Email', value: 62, color: '#3b82f6' },
    { name: 'Landing', value: 45, color: '#22c55e' },
    { name: 'Social', value: 38, color: '#f59e0b' },
    { name: 'Blog', value: 18, color: '#ec4899' },
];

const weeklyOutput = [
    { name: 'Mon', value: 8 }, { name: 'Tue', value: 12 }, { name: 'Wed', value: 10 },
    { name: 'Thu', value: 15 }, { name: 'Fri', value: 6 },
];

const copyCharts = [
    { type: 'bar' as const, title: 'Copy by Type', data: copyByType },
    { type: 'area' as const, title: 'Weekly Output', data: weeklyOutput },
];

const copyActions = [
    { icon: '✍️', label: 'Write', onClick: () => { } },
    { icon: '📋', label: 'Templates', onClick: () => { } },
    { icon: '🧪', label: 'A/B Test', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '📚', label: 'Library', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function CopyPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Copy Hub" subtitle="Copywriting • A/B Testing • Performance" icon="✍️" color="purple"
            statusLabel="Pieces" statusValue="248" metrics={copyMetrics} charts={copyCharts} quickActions={copyActions} locale={locale}
        />
    );
}
