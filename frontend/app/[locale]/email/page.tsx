'use client';

import { Mail, Send, Users, TrendingUp, MousePointer, BarChart3 } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const emailMetrics = [
    { label: 'Subscribers', value: '24.5K', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+1.2K', direction: 'up' as const } },
    { label: 'Open Rate', value: '42%', icon: <Mail className="w-5 h-5" />, color: '#22c55e', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Click Rate', value: '8.5%', icon: <MousePointer className="w-5 h-5" />, color: '#a855f7', trend: { value: '+1.2%', direction: 'up' as const } },
    { label: 'Campaigns Sent', value: '48', icon: <Send className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+12', direction: 'up' as const } },
];

const campaignPerformance = [
    { name: 'Welcome', value: 65, color: '#22c55e' },
    { name: 'Promo', value: 45, color: '#3b82f6' },
    { name: 'Newsletter', value: 38, color: '#a855f7' },
    { name: 'Re-engage', value: 28, color: '#f59e0b' },
];

const subscriberGrowth = [
    { name: 'Jul', value: 18000 }, { name: 'Aug', value: 19500 }, { name: 'Sep', value: 21000 },
    { name: 'Oct', value: 22500 }, { name: 'Nov', value: 23500 }, { name: 'Dec', value: 24500 },
];

const emailCharts = [
    { type: 'bar' as const, title: 'Campaign Open Rates (%)', data: campaignPerformance },
    { type: 'area' as const, title: 'Subscriber Growth', data: subscriberGrowth },
];

const emailActions = [
    { icon: '✉️', label: 'Compose', onClick: () => { } },
    { icon: '📋', label: 'Templates', onClick: () => { } },
    { icon: '👥', label: 'Segments', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🤖', label: 'Automation', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function EmailPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Email Hub" subtitle="Campaigns • Automation • Analytics • Segmentation" icon="📧" color="purple"
            statusLabel="Subscribers" statusValue="24.5K" metrics={emailMetrics} charts={emailCharts} quickActions={emailActions} locale={locale}
        />
    );
}
