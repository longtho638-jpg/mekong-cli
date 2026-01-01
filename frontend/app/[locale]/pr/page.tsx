'use client';

import { Newspaper, Mic, TrendingUp, Users, Eye, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const prMetrics = [
    { label: 'Mentions', value: '248', icon: <Newspaper className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+42', direction: 'up' as const } },
    { label: 'Media Value', value: '$180K', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$28K', direction: 'up' as const } },
    { label: 'Reach', value: '4.2M', icon: <Eye className="w-5 h-5" />, color: '#a855f7', trend: { value: '+680K', direction: 'up' as const } },
    { label: 'Sentiment', value: '+72%', icon: <Award className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+5%', direction: 'up' as const } },
];

const mentionsBySource = [
    { name: 'News', value: 85, color: '#3b82f6' },
    { name: 'Blogs', value: 62, color: '#22c55e' },
    { name: 'Social', value: 78, color: '#ec4899' },
    { name: 'Podcasts', value: 23, color: '#f59e0b' },
];

const monthlyMentions = [
    { name: 'Jul', value: 32 }, { name: 'Aug', value: 38 }, { name: 'Sep', value: 42 },
    { name: 'Oct', value: 48 }, { name: 'Nov', value: 45 }, { name: 'Dec', value: 43 },
];

const prCharts = [
    { type: 'bar' as const, title: 'Mentions by Source', data: mentionsBySource },
    { type: 'area' as const, title: 'Monthly Mentions', data: monthlyMentions },
];

const prActions = [
    { icon: '📰', label: 'Press', onClick: () => { } },
    { icon: '🎤', label: 'Pitches', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '👥', label: 'Contacts', onClick: () => { } },
    { icon: '📋', label: 'Calendar', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function PRPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="PR Hub" subtitle="Media • Press • Coverage • Reputation" icon="📰" color="blue"
            statusLabel="Mentions" statusValue="248" metrics={prMetrics} charts={prCharts} quickActions={prActions} locale={locale}
        />
    );
}
