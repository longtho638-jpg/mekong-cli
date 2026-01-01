'use client';

import { Shield, Lock, AlertTriangle, CheckCircle, Eye, Activity } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const shieldMetrics = [
    { label: 'Protection Score', value: '92/100', icon: <Shield className="w-5 h-5" />, color: '#22c55e', trend: { value: '+4', direction: 'up' as const } },
    { label: 'Threats Blocked', value: '1.2K', icon: <Lock className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+180', direction: 'up' as const } },
    { label: 'Active Cases', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-2', direction: 'down' as const } },
    { label: 'Protected Clients', value: '48', icon: <CheckCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: '+5', direction: 'up' as const } },
];

const threatsByType = [
    { name: 'Payment', value: 45, color: '#ef4444' },
    { name: 'Scope', value: 32, color: '#f59e0b' },
    { name: 'Legal', value: 18, color: '#3b82f6' },
    { name: 'Reputation', value: 12, color: '#a855f7' },
];

const monthlyProtection = [
    { name: 'Jul', value: 85000 }, { name: 'Aug', value: 92000 }, { name: 'Sep', value: 98000 },
    { name: 'Oct', value: 105000 }, { name: 'Nov', value: 118000 }, { name: 'Dec', value: 127000 },
];

const shieldCharts = [
    { type: 'pie' as const, title: 'Threats by Type', data: threatsByType },
    { type: 'area' as const, title: 'Value Protected ($)', data: monthlyProtection },
];

const shieldActions = [
    { icon: '🛡️', label: 'Check Client', onClick: () => { } },
    { icon: '🚨', label: 'Report', onClick: () => { } },
    { icon: '📋', label: 'Cases', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '⚙️', label: 'Policies', onClick: () => { } },
    { icon: '🔔', label: 'Alerts', onClick: () => { } },
];

export default function ShieldPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Anti-Dilution Shield" subtitle="Protection • Risk Detection • Client Vetting" icon="🛡️" color="green"
            statusLabel="Score" statusValue="92/100" metrics={shieldMetrics} charts={shieldCharts} quickActions={shieldActions} locale={locale}
        />
    );
}
