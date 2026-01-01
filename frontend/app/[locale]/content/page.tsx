'use client';

import { FileText, Edit, Eye, TrendingUp, Calendar, Star } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const contentMetrics = [
    { label: 'Articles', value: '248', icon: <FileText className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+18', direction: 'up' as const } },
    { label: 'Page Views', value: '420K', icon: <Eye className="w-5 h-5" />, color: '#22c55e', trend: { value: '+85K', direction: 'up' as const } },
    { label: 'Avg Read Time', value: '4.2m', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+0.5m', direction: 'up' as const } },
    { label: 'SEO Score', value: '92', icon: <Star className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+5', direction: 'up' as const } },
];

const contentByType = [
    { name: 'Blog', value: 120, color: '#3b82f6' },
    { name: 'Guides', value: 45, color: '#22c55e' },
    { name: 'Case Studies', value: 38, color: '#a855f7' },
    { name: 'Whitepapers', value: 25, color: '#f59e0b' },
    { name: 'Videos', value: 20, color: '#ef4444' },
];

const monthlyViews = [
    { name: 'Jul', value: 52000 }, { name: 'Aug', value: 68000 }, { name: 'Sep', value: 75000 },
    { name: 'Oct', value: 82000 }, { name: 'Nov', value: 95000 }, { name: 'Dec', value: 108000 },
];

const contentCharts = [
    { type: 'bar' as const, title: 'Content by Type', data: contentByType },
    { type: 'area' as const, title: 'Monthly Page Views', data: monthlyViews },
];

const contentActions = [
    { icon: '✍️', label: 'Write', onClick: () => { } },
    { icon: '📋', label: 'Queue', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🔍', label: 'SEO', onClick: () => { } },
    { icon: '📚', label: 'Library', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ContentPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Content Hub" subtitle="Writing • Publishing • SEO • Analytics" icon="📝" color="blue"
            statusLabel="Articles" statusValue="248" metrics={contentMetrics} charts={contentCharts} quickActions={contentActions} locale={locale}
        />
    );
}
