'use client';

import { BookOpen, Users, Trophy, Clock, Target, Star } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const learningMetrics = [
    { label: 'Courses', value: '48', icon: <BookOpen className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+6', direction: 'up' as const } },
    { label: 'Enrolled', value: '1.2K', icon: <Users className="w-5 h-5" />, color: '#22c55e', trend: { value: '+180', direction: 'up' as const } },
    { label: 'Completion', value: '78%', icon: <Trophy className="w-5 h-5" />, color: '#a855f7', trend: { value: '+5%', direction: 'up' as const } },
    { label: 'Avg Score', value: '85%', icon: <Star className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+3%', direction: 'up' as const } },
];

const coursesByCategory = [
    { name: 'Technical', value: 18, color: '#3b82f6' },
    { name: 'Leadership', value: 12, color: '#a855f7' },
    { name: 'Sales', value: 8, color: '#22c55e' },
    { name: 'Compliance', value: 6, color: '#f59e0b' },
    { name: 'Onboarding', value: 4, color: '#ec4899' },
];

const monthlyEnrollments = [
    { name: 'Jul', value: 85 }, { name: 'Aug', value: 120 }, { name: 'Sep', value: 95 },
    { name: 'Oct', value: 140 }, { name: 'Nov', value: 165 }, { name: 'Dec', value: 180 },
];

const learningCharts = [
    { type: 'bar' as const, title: 'Courses by Category', data: coursesByCategory },
    { type: 'area' as const, title: 'Monthly Enrollments', data: monthlyEnrollments },
];

const learningActions = [
    { icon: '📚', label: 'Courses', onClick: () => { } },
    { icon: '➕', label: 'Create', onClick: () => { } },
    { icon: '👥', label: 'Learners', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🏆', label: 'Certs', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function LearningPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Learning Hub" subtitle="Courses • Training • Certifications • Analytics" icon="📚" color="purple"
            statusLabel="Courses" statusValue="48" metrics={learningMetrics} charts={learningCharts} quickActions={learningActions} locale={locale}
        />
    );
}
