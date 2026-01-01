'use client';

import { Calendar as CalendarIcon, Clock, Users, CheckCircle, Video, Bell } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const calendarMetrics = [
    { label: 'Today\'s Meetings', value: '8', icon: <CalendarIcon className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+2', direction: 'up' as const } },
    { label: 'Total Hours', value: '6.5h', icon: <Clock className="w-5 h-5" />, color: '#22c55e', trend: { value: '81%', direction: 'up' as const } },
    { label: 'Attendees', value: '24', icon: <Users className="w-5 h-5" />, color: '#a855f7', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Completion', value: '92%', icon: <CheckCircle className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+5%', direction: 'up' as const } },
];

const meetingsByType = [
    { name: 'Team', value: 35, color: '#3b82f6' },
    { name: 'Client', value: 22, color: '#22c55e' },
    { name: '1:1', value: 28, color: '#a855f7' },
    { name: 'All-Hands', value: 4, color: '#f59e0b' },
];

const weeklyLoad = [
    { name: 'Mon', value: 6 }, { name: 'Tue', value: 8 }, { name: 'Wed', value: 5 },
    { name: 'Thu', value: 7 }, { name: 'Fri', value: 4 },
];

const calendarCharts = [
    { type: 'pie' as const, title: 'Meetings by Type', data: meetingsByType },
    { type: 'bar' as const, title: 'Weekly Meeting Load', data: weeklyLoad.map(d => ({ ...d, color: '#3b82f6' })) },
];

const calendarActions = [
    { icon: '➕', label: 'New Event', onClick: () => { } },
    { icon: '📅', label: 'Schedule', onClick: () => { } },
    { icon: '📹', label: 'Video Call', onClick: () => { } },
    { icon: '🔗', label: 'Share', onClick: () => { } },
    { icon: '🔔', label: 'Reminders', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function CalendarPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Calendar Hub" subtitle="Scheduling • Meetings • Availability • Reminders" icon="📅" color="blue"
            statusLabel="Today" statusValue="8 meetings" metrics={calendarMetrics} charts={calendarCharts} quickActions={calendarActions} locale={locale}
        />
    );
}
