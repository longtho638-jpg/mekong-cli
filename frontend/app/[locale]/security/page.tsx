'use client';

import { Shield, Lock, AlertTriangle, Eye, CheckCircle, Activity } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const securityMetrics = [
    { label: 'Security Score', value: '94/100', icon: <Shield className="w-5 h-5" />, color: '#22c55e', trend: { value: '+5', direction: 'up' as const } },
    { label: 'Threats Blocked', value: '12.4K', icon: <Lock className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+1.2K', direction: 'up' as const } },
    { label: 'Open Incidents', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-2', direction: 'down' as const } },
    { label: 'Audit Score', value: '98%', icon: <CheckCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: 'Passed', direction: 'up' as const } },
];

const threatsByType = [
    { name: 'Malware', value: 4500, color: '#ef4444' },
    { name: 'Phishing', value: 5200, color: '#f59e0b' },
    { name: 'DDoS', value: 1800, color: '#3b82f6' },
    { name: 'Other', value: 900, color: '#a855f7' },
];

const dailyEvents = [
    { name: 'Mon', value: 2400 }, { name: 'Tue', value: 2800 }, { name: 'Wed', value: 2200 },
    { name: 'Thu', value: 3100 }, { name: 'Fri', value: 2600 }, { name: 'Sat', value: 1200 }, { name: 'Sun', value: 900 },
];

const securityCharts = [
    { type: 'bar' as const, title: 'Threats by Type', data: threatsByType },
    { type: 'area' as const, title: 'Daily Security Events', data: dailyEvents },
];

const securityActions = [
    { icon: '🔍', label: 'Scan', onClick: () => { } },
    { icon: '🛡️', label: 'Policies', onClick: () => { } },
    { icon: '🚨', label: 'Incidents', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '👥', label: 'Access', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function SecurityPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Security Hub" subtitle="Threats • Compliance • Incidents • Access Control" icon="🛡️" color="red"
            statusLabel="Score" statusValue="94/100" metrics={securityMetrics} charts={securityCharts} quickActions={securityActions} locale={locale}
        />
    );
}
