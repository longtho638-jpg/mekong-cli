'use client';

import { Users, Database, FileText, Clock, CheckCircle, Settings } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const hrisMetrics = [
    { label: 'Employees', value: '156', icon: <Users className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+12', direction: 'up' as const } },
    { label: 'Records Updated', value: '89', icon: <FileText className="w-5 h-5" />, color: '#22c55e', trend: { value: '+24', direction: 'up' as const } },
    { label: 'Compliance', value: '98%', icon: <CheckCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: '+2%', direction: 'up' as const } },
    { label: 'Pending Tasks', value: '12', icon: <Clock className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-5', direction: 'down' as const } },
];

const employeesByDept = [
    { name: 'Engineering', value: 52, color: '#3b82f6' },
    { name: 'Sales', value: 38, color: '#22c55e' },
    { name: 'Marketing', value: 28, color: '#ec4899' },
    { name: 'Operations', value: 24, color: '#f59e0b' },
    { name: 'HR', value: 14, color: '#a855f7' },
];

const monthlyChanges = [
    { name: 'Jul', value: 8 }, { name: 'Aug', value: 12 }, { name: 'Sep', value: 6 },
    { name: 'Oct', value: 15 }, { name: 'Nov', value: 10 }, { name: 'Dec', value: 12 },
];

const hrisCharts = [
    { type: 'bar' as const, title: 'Employees by Department', data: employeesByDept },
    { type: 'area' as const, title: 'Monthly HR Changes', data: monthlyChanges },
];

const hrisActions = [
    { icon: '👤', label: 'Add Employee', onClick: () => { } },
    { icon: '📋', label: 'Directory', onClick: () => { } },
    { icon: '📝', label: 'Records', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
    { icon: '🔒', label: 'Compliance', onClick: () => { } },
];

export default function HRISPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="HRIS Hub" subtitle="Records • Directory • Compliance • Reporting" icon="📁" color="blue"
            statusLabel="Employees" statusValue="156" metrics={hrisMetrics} charts={hrisCharts} quickActions={hrisActions} locale={locale}
        />
    );
}
