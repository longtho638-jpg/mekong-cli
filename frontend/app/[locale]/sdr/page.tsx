'use client';

import { Phone, Target, TrendingUp, Users, Calendar, Mail } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const sdrMetrics = [
    { label: 'Calls Made', value: '842', icon: <Phone className="w-5 h-5" />, color: '#22c55e', trend: { value: '+124', direction: 'up' as const } },
    { label: 'Meetings Booked', value: '48', icon: <Calendar className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Conversion Rate', value: '5.7%', icon: <Target className="w-5 h-5" />, color: '#a855f7', trend: { value: '+0.8%', direction: 'up' as const } },
    { label: 'Pipeline Added', value: '$180K', icon: <TrendingUp className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$25K', direction: 'up' as const } },
];

const activityByType = [
    { name: 'Calls', value: 450, color: '#22c55e' },
    { name: 'Emails', value: 280, color: '#3b82f6' },
    { name: 'LinkedIn', value: 85, color: '#0077b5' },
    { name: 'Other', value: 27, color: '#f59e0b' },
];

const weeklyMeetings = [
    { name: 'Mon', value: 8 }, { name: 'Tue', value: 12 }, { name: 'Wed', value: 10 },
    { name: 'Thu', value: 14 }, { name: 'Fri', value: 6 },
];

const sdrCharts = [
    { type: 'bar' as const, title: 'Activity Distribution', data: activityByType },
    { type: 'area' as const, title: 'Meetings Booked This Week', data: weeklyMeetings },
];

const sdrActions = [
    { icon: '📞', label: 'Call', onClick: () => { } },
    { icon: '📧', label: 'Email', onClick: () => { } },
    { icon: '📋', label: 'Sequences', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '🎯', label: 'Leads', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SDRPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="SDR Hub" subtitle="Prospecting • Outreach • Meeting Booking • Pipeline" icon="📞" color="green"
            statusLabel="Meetings" statusValue="48" metrics={sdrMetrics} charts={sdrCharts} quickActions={sdrActions} locale={locale}
        />
    );
}
