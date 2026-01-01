'use client';

import { Calculator, FileText, DollarSign, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const taxMetrics = [
    { label: 'Tax Liability', value: '$142K', icon: <DollarSign className="w-5 h-5" />, color: '#ef4444', trend: { value: '-$18K', direction: 'down' as const } },
    { label: 'Filings Done', value: '24', icon: <FileText className="w-5 h-5" />, color: '#22c55e', trend: { value: '+6', direction: 'up' as const } },
    { label: 'Savings', value: '$48K', icon: <Calculator className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+$12K', direction: 'up' as const } },
    { label: 'Compliance', value: '100%', icon: <CheckCircle className="w-5 h-5" />, color: '#a855f7', trend: { value: 'Compliant', direction: 'up' as const } },
];

const taxByType = [
    { name: 'Income', value: 85000, color: '#ef4444' },
    { name: 'Sales', value: 32000, color: '#3b82f6' },
    { name: 'Payroll', value: 18000, color: '#22c55e' },
    { name: 'Other', value: 7000, color: '#f59e0b' },
];

const quarterlyTax = [
    { name: 'Q1', value: 32000 }, { name: 'Q2', value: 38000 }, { name: 'Q3', value: 35000 },
    { name: 'Q4', value: 37000 },
];

const taxCharts = [
    { type: 'pie' as const, title: 'Tax by Category', data: taxByType },
    { type: 'bar' as const, title: 'Quarterly Payments', data: quarterlyTax.map(d => ({ ...d, color: '#ef4444' })) },
];

const taxActions = [
    { icon: '📋', label: 'Filings', onClick: () => { } },
    { icon: '💰', label: 'Payments', onClick: () => { } },
    { icon: '📊', label: 'Planning', onClick: () => { } },
    { icon: '📅', label: 'Deadlines', onClick: () => { } },
    { icon: '📝', label: 'Documents', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function TaxPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Tax Hub" subtitle="Filings • Planning • Compliance • Savings" icon="🧾" color="red"
            statusLabel="Liability" statusValue="$142K" metrics={taxMetrics} charts={taxCharts} quickActions={taxActions} locale={locale}
        />
    );
}
