'use client';

import { FileText, Users, TrendingUp, Target, Download, Eye } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const b2bMetrics = [
    { label: 'Assets', value: '156', icon: <FileText className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+24', direction: 'up' as const } },
    { label: 'Downloads', value: '2.4K', icon: <Download className="w-5 h-5" />, color: '#22c55e', trend: { value: '+380', direction: 'up' as const } },
    { label: 'Leads Gen', value: '186', icon: <Target className="w-5 h-5" />, color: '#a855f7', trend: { value: '+32', direction: 'up' as const } },
    { label: 'Pipeline', value: '$420K', icon: <TrendingUp className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$65K', direction: 'up' as const } },
];

const assetsByType = [
    { name: 'Whitepapers', value: 32, color: '#3b82f6' },
    { name: 'Case Studies', value: 45, color: '#22c55e' },
    { name: 'Ebooks', value: 28, color: '#a855f7' },
    { name: 'Webinars', value: 18, color: '#f59e0b' },
    { name: 'Templates', value: 33, color: '#ec4899' },
];

const monthlyDownloads = [
    { name: 'Jul', value: 180 }, { name: 'Aug', value: 220 }, { name: 'Sep', value: 280 },
    { name: 'Oct', value: 350 }, { name: 'Nov', value: 420 }, { name: 'Dec', value: 480 },
];

const b2bCharts = [
    { type: 'bar' as const, title: 'Assets by Type', data: assetsByType },
    { type: 'area' as const, title: 'Monthly Downloads', data: monthlyDownloads },
];

const b2bActions = [
    { icon: '📝', label: 'Create', onClick: () => { } },
    { icon: '📚', label: 'Library', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🎯', label: 'Leads', onClick: () => { } },
    { icon: '📧', label: 'Nurture', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function B2BContentPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="B2B Content" subtitle="Assets • Leads • Nurturing • Pipeline" icon="📄" color="blue"
            statusLabel="Assets" statusValue="156" metrics={b2bMetrics} charts={b2bCharts} quickActions={b2bActions} locale={locale}
        />
    );
}
