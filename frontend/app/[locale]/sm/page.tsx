'use client';

import { Share2, Heart, Users, TrendingUp, MessageCircle, Eye } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const smMetrics = [
    { label: 'Total Reach', value: '2.4M', icon: <Eye className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+320K', direction: 'up' as const } },
    { label: 'Engagement', value: '5.2%', icon: <Heart className="w-5 h-5" />, color: '#ec4899', trend: { value: '+0.8%', direction: 'up' as const } },
    { label: 'Followers', value: '185K', icon: <Users className="w-5 h-5" />, color: '#22c55e', trend: { value: '+12K', direction: 'up' as const } },
    { label: 'Posts', value: '248', icon: <Share2 className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+32', direction: 'up' as const } },
];

const reachByPlatform = [
    { name: 'Instagram', value: 950000, color: '#e1306c' },
    { name: 'TikTok', value: 680000, color: '#000000' },
    { name: 'LinkedIn', value: 450000, color: '#0077b5' },
    { name: 'Twitter', value: 320000, color: '#1da1f2' },
];

const weeklyEngagement = [
    { name: 'Mon', value: 5200 }, { name: 'Tue', value: 6100 }, { name: 'Wed', value: 5800 },
    { name: 'Thu', value: 7200 }, { name: 'Fri', value: 6500 }, { name: 'Sat', value: 4800 }, { name: 'Sun', value: 4200 },
];

const smCharts = [
    { type: 'bar' as const, title: 'Reach by Platform', data: reachByPlatform },
    { type: 'area' as const, title: 'Weekly Engagement', data: weeklyEngagement },
];

const smActions = [
    { icon: '✍️', label: 'Create Post', onClick: () => { } },
    { icon: '📅', label: 'Schedule', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '💬', label: 'Inbox', onClick: () => { } },
    { icon: '👥', label: 'Audience', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SMPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Social Media Manager" subtitle="Posting • Scheduling • Engagement • Analytics" icon="📱" color="pink"
            statusLabel="Reach" statusValue="2.4M" metrics={smMetrics} charts={smCharts} quickActions={smActions} locale={locale}
        />
    );
}
