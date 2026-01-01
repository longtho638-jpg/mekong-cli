'use client';

import { Megaphone, TrendingUp, Users, Target, BarChart3, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const mktgMgrMetrics = [
    { label: 'Campaigns', value: '24', icon: <Megaphone className="w-5 h-5" />, color: '#ec4899', trend: { value: '+4', direction: 'up' as const } },
    { label: 'Pipeline', value: '$1.8M', icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$280K', direction: 'up' as const } },
    { label: 'MQLs', value: '486', icon: <Target className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+82', direction: 'up' as const } },
    { label: 'CAC', value: '$420', icon: <BarChart3 className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-$35', direction: 'down' as const } },
];

const campaignsByChannel = [
    { name: 'Paid', value: 8, color: '#ec4899' },
    { name: 'Content', value: 6, color: '#3b82f6' },
    { name: 'Email', value: 5, color: '#22c55e' },
    { name: 'Events', value: 3, color: '#f59e0b' },
    { name: 'Social', value: 2, color: '#a855f7' },
];

const monthlyMQLs = [
    { name: 'Jul', value: 320 }, { name: 'Aug', value: 380 }, { name: 'Sep', value: 420 },
    { name: 'Oct', value: 445 }, { name: 'Nov', value: 468 }, { name: 'Dec', value: 486 },
];

const mktgMgrCharts = [
    { type: 'pie' as const, title: 'Campaigns by Channel', data: campaignsByChannel },
    { type: 'area' as const, title: 'Monthly MQLs', data: monthlyMQLs },
];

const mktgMgrActions = [
    { icon: '📣', label: 'Campaigns', onClick: () => { } },
    { icon: '🎯', label: 'Leads', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '💰', label: 'Budget', onClick: () => { } },
    { icon: '👥', label: 'Team', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function MarketingManagerPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Marketing Manager" subtitle="Campaigns • Pipeline • MQLs • Budget" icon="📣" color="pink"
            statusLabel="MQLs" statusValue="486" metrics={mktgMgrMetrics} charts={mktgMgrCharts} quickActions={mktgMgrActions} locale={locale}
        />
    );
}
