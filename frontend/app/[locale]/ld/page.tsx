'use client';

import { BookOpen, Users, Award, TrendingUp, Clock, Target } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const ldMetrics = [
    { label: 'Programs', value: '24', icon: <BookOpen className="w-5 h-5" />, color: '#a855f7', trend: { value: '+4', direction: 'up' as const } },
    { label: 'Participants', value: '186', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+32', direction: 'up' as const } },
    { label: 'Completion', value: '82%', icon: <Award className="w-5 h-5" />, color: '#22c55e', trend: { value: '+8%', direction: 'up' as const } },
    { label: 'Hours', value: '2.4K', icon: <Clock className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+380', direction: 'up' as const } },
];

const programsByType = [
    { name: 'Leadership', value: 8, color: '#a855f7' },
    { name: 'Technical', value: 6, color: '#3b82f6' },
    { name: 'Soft Skills', value: 5, color: '#22c55e' },
    { name: 'Compliance', value: 3, color: '#f59e0b' },
    { name: 'Onboarding', value: 2, color: '#ec4899' },
];

const monthlyHours = [
    { name: 'Jul', value: 320 }, { name: 'Aug', value: 380 }, { name: 'Sep', value: 350 },
    { name: 'Oct', value: 420 }, { name: 'Nov', value: 480 }, { name: 'Dec', value: 450 },
];

const ldCharts = [
    { type: 'pie' as const, title: 'Programs by Type', data: programsByType },
    { type: 'area' as const, title: 'Monthly Training Hours', data: monthlyHours },
];

const ldActions = [
    { icon: '📚', label: 'Programs', onClick: () => { } },
    { icon: '👥', label: 'Cohorts', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '🎯', label: 'Goals', onClick: () => { } },
    { icon: '🏆', label: 'Certs', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function LDPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="L&D Hub" subtitle="Learning • Development • Training • Growth" icon="🎓" color="purple"
            statusLabel="Programs" statusValue="24" metrics={ldMetrics} charts={ldCharts} quickActions={ldActions} locale={locale}
        />
    );
}
