'use client';

import { Phone, Users, DollarSign, TrendingUp, Target, Award } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const isrMetrics = [
    { label: 'Inbound Calls', value: '342', icon: <Phone className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+48', direction: 'up' as const } },
    { label: 'Converted', value: '86', icon: <Target className="w-5 h-5" />, color: '#22c55e', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Avg Deal', value: '$4.2K', icon: <DollarSign className="w-5 h-5" />, color: '#a855f7', trend: { value: '+$320', direction: 'up' as const } },
    { label: 'Conversion', value: '25%', icon: <TrendingUp className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+3%', direction: 'up' as const } },
];

const callsBySource = [
    { name: 'Website', value: 145, color: '#3b82f6' },
    { name: 'Referral', value: 85, color: '#22c55e' },
    { name: 'Ads', value: 72, color: '#ec4899' },
    { name: 'Other', value: 40, color: '#f59e0b' },
];

const dailyCalls = [
    { name: 'Mon', value: 52 }, { name: 'Tue', value: 68 }, { name: 'Wed', value: 55 },
    { name: 'Thu', value: 72 }, { name: 'Fri', value: 48 }, { name: 'Sat', value: 28 }, { name: 'Sun', value: 19 },
];

const isrCharts = [
    { type: 'pie' as const, title: 'Calls by Source', data: callsBySource },
    { type: 'bar' as const, title: 'Daily Call Volume', data: dailyCalls.map(d => ({ ...d, color: '#3b82f6' })) },
];

const isrActions = [
    { icon: '📞', label: 'Call Queue', onClick: () => { } },
    { icon: '📋', label: 'Leads', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🎯', label: 'Targets', onClick: () => { } },
    { icon: '📝', label: 'Scripts', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function ISRPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Inside Sales" subtitle="Inbound Calls • Lead Conversion • Phone Sales" icon="📞" color="blue"
            statusLabel="Calls" statusValue="342" metrics={isrMetrics} charts={isrCharts} quickActions={isrActions} locale={locale}
        />
    );
}
