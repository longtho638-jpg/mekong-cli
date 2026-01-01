'use client';

import { Calendar, Clock, Users, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const eventsMetrics = [
    { label: 'Upcoming Events', value: '12', icon: <Calendar className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+3', direction: 'up' as const } },
    { label: 'Registrations', value: '2.4K', icon: <Users className="w-5 h-5" />, color: '#22c55e', trend: { value: '+420', direction: 'up' as const } },
    { label: 'Attendance Rate', value: '78%', icon: <CheckCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'NPS Score', value: '+62', icon: <Target className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+8', direction: 'up' as const } },
];

const eventsByType = [
    { name: 'Webinars', value: 45, color: '#3b82f6' },
    { name: 'Conferences', value: 12, color: '#22c55e' },
    { name: 'Workshops', value: 28, color: '#a855f7' },
    { name: 'Meetups', value: 18, color: '#f59e0b' },
];

const monthlyRegistrations = [
    { name: 'Jul', value: 1800 }, { name: 'Aug', value: 2100 }, { name: 'Sep', value: 1950 },
    { name: 'Oct', value: 2300 }, { name: 'Nov', value: 2150 }, { name: 'Dec', value: 2400 },
];

const eventsCharts = [
    { type: 'bar' as const, title: 'Events by Type', data: eventsByType },
    { type: 'area' as const, title: 'Monthly Registrations', data: monthlyRegistrations },
];

const eventsActions = [
    { icon: '📅', label: 'New Event', onClick: () => { } },
    { icon: '📋', label: 'Manage', onClick: () => { } },
    { icon: '📧', label: 'Invites', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🎫', label: 'Tickets', onClick: () => { } },
    { icon: '📹', label: 'Recordings', onClick: () => { } },
];

export default function EventsPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Events Hub" subtitle="Webinars • Conferences • Workshops • Meetups" icon="📅" color="blue"
            statusLabel="Upcoming" statusValue="12" metrics={eventsMetrics} charts={eventsCharts} quickActions={eventsActions} locale={locale}
        />
    );
}
