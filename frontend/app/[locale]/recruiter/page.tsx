'use client';

import { Users, Briefcase, Clock, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const recruiterMetrics = [
    { label: 'Open Roles', value: '18', icon: <Briefcase className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+4', direction: 'up' as const } },
    { label: 'Candidates', value: '245', icon: <Users className="w-5 h-5" />, color: '#22c55e', trend: { value: '+52', direction: 'up' as const } },
    { label: 'Time to Hire', value: '28d', icon: <Clock className="w-5 h-5" />, color: '#a855f7', trend: { value: '-5d', direction: 'down' as const } },
    { label: 'Offer Rate', value: '24%', icon: <Target className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+3%', direction: 'up' as const } },
];

const candidatesByStage = [
    { name: 'Applied', value: 120, color: '#3b82f6' },
    { name: 'Screening', value: 65, color: '#a855f7' },
    { name: 'Interview', value: 42, color: '#22c55e' },
    { name: 'Offer', value: 18, color: '#f59e0b' },
];

const hiringTrend = [
    { name: 'Jul', value: 5 }, { name: 'Aug', value: 8 }, { name: 'Sep', value: 6 },
    { name: 'Oct', value: 10 }, { name: 'Nov', value: 7 }, { name: 'Dec', value: 12 },
];

const recruiterCharts = [
    { type: 'bar' as const, title: 'Pipeline by Stage', data: candidatesByStage },
    { type: 'area' as const, title: 'Monthly Hires', data: hiringTrend },
];

const recruiterActions = [
    { icon: '📋', label: 'Post Job', onClick: () => { } },
    { icon: '👥', label: 'Candidates', onClick: () => { } },
    { icon: '📅', label: 'Interviews', onClick: () => { } },
    { icon: '📝', label: 'Offers', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function RecruiterPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Recruiter Hub" subtitle="Jobs • Candidates • Interviews • Offers" icon="🎯" color="purple"
            statusLabel="Open Roles" statusValue="18" metrics={recruiterMetrics} charts={recruiterCharts} quickActions={recruiterActions} locale={locale}
        />
    );
}
