'use client';

import { Users, FileText, MessageCircle, DollarSign, Clock, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const clientPortalMetrics = [
    { label: 'Active Clients', value: '86', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Projects', value: '124', icon: <FileText className="w-5 h-5" />, color: '#22c55e', trend: { value: '+18', direction: 'up' as const } },
    { label: 'Messages', value: '248', icon: <MessageCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: '+42', direction: 'up' as const } },
    { label: 'Revenue', value: '$180K', icon: <DollarSign className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$28K', direction: 'up' as const } },
];

const clientsByStatus = [
    { name: 'Active', value: 68, color: '#22c55e' },
    { name: 'Onboarding', value: 12, color: '#3b82f6' },
    { name: 'Paused', value: 6, color: '#f59e0b' },
];

const monthlyRevenue = [
    { name: 'Jul', value: 120000 }, { name: 'Aug', value: 135000 }, { name: 'Sep', value: 148000 },
    { name: 'Oct', value: 158000 }, { name: 'Nov', value: 170000 }, { name: 'Dec', value: 180000 },
];

const clientPortalCharts = [
    { type: 'pie' as const, title: 'Clients by Status', data: clientsByStatus },
    { type: 'area' as const, title: 'Monthly Revenue', data: monthlyRevenue },
];

const clientPortalActions = [
    { icon: '👥', label: 'Clients', onClick: () => { } },
    { icon: '📋', label: 'Projects', onClick: () => { } },
    { icon: '💬', label: 'Messages', onClick: () => { } },
    { icon: '💰', label: 'Invoices', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ClientPortalPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Client Portal" subtitle="Clients • Projects • Communication • Billing" icon="👥" color="blue"
            statusLabel="Clients" statusValue="86" metrics={clientPortalMetrics} charts={clientPortalCharts} quickActions={clientPortalActions} locale={locale}
        />
    );
}
