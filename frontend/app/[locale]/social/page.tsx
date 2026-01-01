'use client';

import { Share2, Heart, Users, TrendingUp, MessageCircle, Eye } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const socialMetrics = [
    { label: 'Followers', value: '128K', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+8.5K', direction: 'up' as const } },
    { label: 'Engagement', value: '4.2%', icon: <Heart className="w-5 h-5" />, color: '#ec4899', trend: { value: '+0.8%', direction: 'up' as const } },
    { label: 'Impressions', value: '2.4M', icon: <Eye className="w-5 h-5" />, color: '#22c55e', trend: { value: '+420K', direction: 'up' as const } },
    { label: 'Posts', value: '156', icon: <Share2 className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+24', direction: 'up' as const } },
];

const followersByPlatform = [
    { name: 'Instagram', value: 52000, color: '#e1306c' },
    { name: 'Twitter', value: 38000, color: '#1da1f2' },
    { name: 'LinkedIn', value: 28000, color: '#0077b5' },
    { name: 'TikTok', value: 10000, color: '#000000' },
];

const weeklyEngagement = [
    { name: 'Mon', value: 4200 }, { name: 'Tue', value: 5100 }, { name: 'Wed', value: 4800 },
    { name: 'Thu', value: 6200 }, { name: 'Fri', value: 5500 }, { name: 'Sat', value: 3800 }, { name: 'Sun', value: 3200 },
];

const socialCharts = [
    { type: 'bar' as const, title: 'Followers by Platform', data: followersByPlatform },
    { type: 'area' as const, title: 'Weekly Engagement', data: weeklyEngagement },
];

const socialActions = [
    { icon: '✍️', label: 'Post', onClick: () => { } },
    { icon: '📅', label: 'Schedule', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '💬', label: 'Inbox', onClick: () => { } },
    { icon: '👥', label: 'Audience', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SocialPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Social Hub" subtitle="Posting • Engagement • Analytics • Scheduling" icon="📱" color="pink"
            statusLabel="Followers" statusValue="128K" metrics={socialMetrics} charts={socialCharts} quickActions={socialActions} locale={locale}
        />
    );
}
