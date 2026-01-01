'use client';

import { Users, Building, Settings, Shield, Briefcase, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const agencyPortalMetrics = [
    { label: 'Active Clients', value: '48', icon: <Building className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+6', direction: 'up' as const } },
    { label: 'Team Members', value: '24', icon: <Users className="w-5 h-5" />, color: '#22c55e', trend: { value: '+3', direction: 'up' as const } },
    { label: 'Projects', value: '86', icon: <Briefcase className="w-5 h-5" />, color: '#a855f7', trend: { value: '+12', direction: 'up' as const } },
    { label: 'MRR', value: '$42K', icon: <Award className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$5K', direction: 'up' as const } },
];

const clientsByTier = [
    { name: 'Enterprise', value: 8, color: '#22c55e' },
    { name: 'Growth', value: 18, color: '#3b82f6' },
    { name: 'Starter', value: 22, color: '#a855f7' },
];

const monthlyMRR = [
    { name: 'Jul', value: 28000 }, { name: 'Aug', value: 32000 }, { name: 'Sep', value: 35000 },
    { name: 'Oct', value: 38000 }, { name: 'Nov', value: 40000 }, { name: 'Dec', value: 42000 },
];

const agencyPortalCharts = [
    { type: 'pie' as const, title: 'Clients by Tier', data: clientsByTier },
    { type: 'area' as const, title: 'MRR Growth', data: monthlyMRR },
];

const agencyPortalActions = [
    { icon: '🏢', label: 'Clients', onClick: () => { } },
    { icon: '👥', label: 'Team', onClick: () => { } },
    { icon: '📋', label: 'Projects', onClick: () => { } },
    { icon: '💰', label: 'Billing', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function AgencyPortalPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Agency Portal" subtitle="Clients • Projects • Team • Revenue" icon="🏢" color="blue"
            statusLabel="MRR" statusValue="$42K" metrics={agencyPortalMetrics} charts={agencyPortalCharts} quickActions={agencyPortalActions} locale={locale}
        />
    );
}
