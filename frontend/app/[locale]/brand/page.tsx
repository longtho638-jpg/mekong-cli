'use client';

import { Palette, Eye, Heart, TrendingUp, Star, Zap } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const brandMetrics = [
    { label: 'Brand Score', value: '82', icon: <Star className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Awareness', value: '68%', icon: <Eye className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+12%', direction: 'up' as const } },
    { label: 'Sentiment', value: '+72', icon: <Heart className="w-5 h-5" />, color: '#ec4899', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Share of Voice', value: '24%', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '+4%', direction: 'up' as const } },
];

const sentimentBreakdown = [
    { name: 'Positive', value: 72, color: '#22c55e' },
    { name: 'Neutral', value: 20, color: '#f59e0b' },
    { name: 'Negative', value: 8, color: '#ef4444' },
];

const awarenessTrend = [
    { name: 'Jul', value: 52 }, { name: 'Aug', value: 55 }, { name: 'Sep', value: 58 },
    { name: 'Oct', value: 62 }, { name: 'Nov', value: 65 }, { name: 'Dec', value: 68 },
];

const brandCharts = [
    { type: 'pie' as const, title: 'Sentiment Distribution', data: sentimentBreakdown },
    { type: 'area' as const, title: 'Awareness Trend', data: awarenessTrend },
];

const brandActions = [
    { icon: '🎨', label: 'Guidelines', onClick: () => { } },
    { icon: '📊', label: 'Tracking', onClick: () => { } },
    { icon: '📋', label: 'Assets', onClick: () => { } },
    { icon: '💬', label: 'Mentions', onClick: () => { } },
    { icon: '🏆', label: 'Competitors', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function BrandPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Brand Hub" subtitle="Identity • Awareness • Sentiment • Guidelines" icon="🎨" color="orange"
            statusLabel="Score" statusValue="82" metrics={brandMetrics} charts={brandCharts} quickActions={brandActions} locale={locale}
        />
    );
}
