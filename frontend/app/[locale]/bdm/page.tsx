'use client';

import { Handshake, Users, DollarSign, TrendingUp, Building, Star } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const bdmMetrics = [
    { label: 'Partners', value: '48', icon: <Handshake className="w-5 h-5" />, color: '#22c55e', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Opportunities', value: '24', icon: <Building className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+6', direction: 'up' as const } },
    { label: 'Revenue Share', value: '$180K', icon: <DollarSign className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$32K', direction: 'up' as const } },
    { label: 'NPS', value: '+62', icon: <Star className="w-5 h-5" />, color: '#a855f7', trend: { value: '+8', direction: 'up' as const } },
];

const partnersByType = [
    { name: 'Strategic', value: 12, color: '#22c55e' },
    { name: 'Technology', value: 18, color: '#3b82f6' },
    { name: 'Channel', value: 10, color: '#a855f7' },
    { name: 'Affiliate', value: 8, color: '#f59e0b' },
];

const monthlyRevenue = [
    { name: 'Jul', value: 120000 }, { name: 'Aug', value: 135000 }, { name: 'Sep', value: 145000 },
    { name: 'Oct', value: 158000 }, { name: 'Nov', value: 165000 }, { name: 'Dec', value: 180000 },
];

const bdmCharts = [
    { type: 'pie' as const, title: 'Partners by Type', data: partnersByType },
    { type: 'area' as const, title: 'Monthly Partner Revenue', data: monthlyRevenue },
];

const bdmActions = [
    { icon: '🤝', label: 'Add Partner', onClick: () => { } },
    { icon: '📋', label: 'Deals', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '📧', label: 'Outreach', onClick: () => { } },
    { icon: '📝', label: 'Contracts', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function BDMPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="BDM Hub" subtitle="Business Development • Partnerships • Alliances" icon="🤝" color="green"
            statusLabel="Partners" statusValue="48" metrics={bdmMetrics} charts={bdmCharts} quickActions={bdmActions} locale={locale}
        />
    );
}
