'use client';

import { Scale, FileText, Shield as ShieldIcon, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const legalMetrics = [
    { label: 'Active Contracts', value: '142', icon: <FileText className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+8', direction: 'up' as const } },
    { label: 'Pending Reviews', value: '18', icon: <Clock className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-3', direction: 'down' as const } },
    { label: 'Compliance Score', value: '96%', icon: <ShieldIcon className="w-5 h-5" />, color: '#22c55e', trend: { value: '+2%', direction: 'up' as const } },
    { label: 'Risk Items', value: '4', icon: <AlertTriangle className="w-5 h-5" />, color: '#ef4444', trend: { value: '-2', direction: 'down' as const } },
];

const contractsByType = [
    { name: 'Client', value: 52, color: '#3b82f6' },
    { name: 'Vendor', value: 38, color: '#22c55e' },
    { name: 'Employment', value: 35, color: '#a855f7' },
    { name: 'NDA', value: 17, color: '#f59e0b' },
];

const reviewTrend = [
    { name: 'Jul', value: 28 }, { name: 'Aug', value: 32 }, { name: 'Sep', value: 25 },
    { name: 'Oct', value: 22 }, { name: 'Nov', value: 18 }, { name: 'Dec', value: 15 },
];

const legalCharts = [
    { type: 'bar' as const, title: 'Contracts by Type', data: contractsByType },
    { type: 'area' as const, title: 'Review Queue Trend', data: reviewTrend },
];

const legalActions = [
    { icon: '📝', label: 'New Contract', onClick: () => { } },
    { icon: '🔍', label: 'Review Queue', onClick: () => { } },
    { icon: '⚖️', label: 'Compliance', onClick: () => { } },
    { icon: '📋', label: 'Templates', onClick: () => { } },
    { icon: '🔔', label: 'Alerts', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
];

export default function LegalPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Legal Hub" subtitle="Contracts • Compliance • Risk Management" icon="⚖️" color="blue"
            statusLabel="Compliance" statusValue="96%" metrics={legalMetrics} charts={legalCharts} quickActions={legalActions} locale={locale}
        />
    );
}
