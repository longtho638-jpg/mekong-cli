'use client';

import { Video, Play, Eye, Heart, Share2, Clock } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const mediaMetrics = [
    { label: 'Total Views', value: '1.2M', icon: <Eye className="w-5 h-5" />, color: '#ef4444', trend: { value: '+180K', direction: 'up' as const } },
    { label: 'Engagement', value: '8.5%', icon: <Heart className="w-5 h-5" />, color: '#ec4899', trend: { value: '+1.2%', direction: 'up' as const } },
    { label: 'Videos Published', value: '156', icon: <Video className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+24', direction: 'up' as const } },
    { label: 'Watch Time', value: '42K hrs', icon: <Clock className="w-5 h-5" />, color: '#22c55e', trend: { value: '+8K', direction: 'up' as const } },
];

const viewsByPlatform = [
    { name: 'YouTube', value: 650000, color: '#ef4444' },
    { name: 'TikTok', value: 320000, color: '#000000' },
    { name: 'Instagram', value: 180000, color: '#ec4899' },
    { name: 'LinkedIn', value: 50000, color: '#3b82f6' },
];

const weeklyViews = [
    { name: 'Mon', value: 45000 }, { name: 'Tue', value: 52000 }, { name: 'Wed', value: 48000 },
    { name: 'Thu', value: 61000 }, { name: 'Fri', value: 55000 }, { name: 'Sat', value: 72000 }, { name: 'Sun', value: 68000 },
];

const mediaCharts = [
    { type: 'bar' as const, title: 'Views by Platform', data: viewsByPlatform },
    { type: 'area' as const, title: 'Weekly Views', data: weeklyViews },
];

const mediaActions = [
    { icon: '🎬', label: 'Upload', onClick: () => { } },
    { icon: '✂️', label: 'Edit', onClick: () => { } },
    { icon: '📺', label: 'Library', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '📅', label: 'Schedule', onClick: () => { } },
    { icon: '🎯', label: 'Promote', onClick: () => { } },
];

export default function MediaPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Media Hub" subtitle="Video • Podcasts • Live Streaming • Analytics" icon="🎬" color="red"
            statusLabel="Views" statusValue="1.2M" metrics={mediaMetrics} charts={mediaCharts} quickActions={mediaActions} locale={locale}
        />
    );
}
