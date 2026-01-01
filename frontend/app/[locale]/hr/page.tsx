'use client';

import { Users, Briefcase, TrendingUp, Heart, DollarSign, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// HR Metrics Data
const hrMetrics = [
    {
        label: 'Headcount',
        value: '156',
        icon: <Users className="w-5 h-5" />,
        color: '#3b82f6',
        trend: { value: '+12', direction: 'up' as const },
    },
    {
        label: 'Open Positions',
        value: '12',
        icon: <Briefcase className="w-5 h-5" />,
        color: '#22c55e',
        trend: { value: '3 new', direction: 'up' as const },
    },
    {
        label: 'eNPS Score',
        value: '+42',
        icon: <Heart className="w-5 h-5" />,
        color: '#ec4899',
        trend: { value: '+5', direction: 'up' as const },
    },
    {
        label: 'Turnover Rate',
        value: '8.5%',
        icon: <TrendingUp className="w-5 h-5" />,
        color: '#f59e0b',
        trend: { value: '-2%', direction: 'down' as const },
    },
];

// Headcount by Department
const headcountByDept = [
    { name: 'Engineering', value: 45, color: '#3b82f6' },
    { name: 'Marketing', value: 28, color: '#ec4899' },
    { name: 'Sales', value: 35, color: '#22c55e' },
    { name: 'Operations', value: 22, color: '#f59e0b' },
    { name: 'Finance', value: 15, color: '#a855f7' },
    { name: 'HR', value: 11, color: '#06b6d4' },
];

// Hiring Trend (12 months)
const hiringTrend = [
    { name: 'Jan', value: 5 },
    { name: 'Feb', value: 8 },
    { name: 'Mar', value: 12 },
    { name: 'Apr', value: 7 },
    { name: 'May', value: 15 },
    { name: 'Jun', value: 10 },
    { name: 'Jul', value: 9 },
    { name: 'Aug', value: 14 },
    { name: 'Sep', value: 11 },
    { name: 'Oct', value: 18 },
    { name: 'Nov', value: 13 },
    { name: 'Dec', value: 8 },
];

// Attrition Risk Distribution
const attritionRisk = [
    { name: 'Low', value: 120, color: '#22c55e' },
    { name: 'Medium', value: 25, color: '#f59e0b' },
    { name: 'High', value: 8, color: '#ef4444' },
    { name: 'Critical', value: 3, color: '#7f1d1d' },
];

// Charts configuration
const hrCharts = [
    {
        type: 'bar' as const,
        title: 'Headcount by Department',
        data: headcountByDept,
    },
    {
        type: 'area' as const,
        title: 'Hiring Trend (12 Months)',
        data: hiringTrend,
    },
    {
        type: 'pie' as const,
        title: 'Attrition Risk Distribution',
        data: attritionRisk,
    },
];

// Quick Actions
const hrActions = [
    { icon: '📝', label: 'Post Job', onClick: () => console.log('Post Job') },
    { icon: '👤', label: 'Add Employee', onClick: () => console.log('Add Employee') },
    { icon: '📊', label: 'Run Report', onClick: () => console.log('Run Report') },
    { icon: '📅', label: 'Schedule Review', onClick: () => console.log('Schedule Review') },
    { icon: '💰', label: 'Payroll', onClick: () => console.log('Payroll') },
    { icon: '📋', label: 'Onboarding', onClick: () => console.log('Onboarding') },
];

export default function HRPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('HR');

    return (
        <DepartmentDashboard
            title="HR Hub"
            subtitle="People Operations • Talent Acquisition • Analytics • Compensation"
            icon="👥"
            color="blue"
            statusLabel="Headcount"
            statusValue="156"
            metrics={hrMetrics}
            charts={hrCharts}
            quickActions={hrActions}
            locale={locale}
        >
            {/* Additional custom content can go here */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Today's HR Priorities
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <span className="text-red-400">🔴</span>
                        <span className="text-sm text-gray-300">3 employees at critical attrition risk</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <span className="text-yellow-400">🟡</span>
                        <span className="text-sm text-gray-300">5 pending interview schedules</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <span className="text-green-400">🟢</span>
                        <span className="text-sm text-gray-300">2 new hires starting Monday</span>
                    </div>
                </div>
            </div>
        </DepartmentDashboard>
    );
}
