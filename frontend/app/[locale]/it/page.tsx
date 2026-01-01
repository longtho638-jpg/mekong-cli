'use client';

import { Server, Wifi, Shield as ShieldIcon, AlertTriangle, Clock, HardDrive } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// IT Metrics
const itMetrics = [
    {
        label: 'System Uptime',
        value: '99.8%',
        icon: <Server className="w-5 h-5" />,
        color: '#22c55e',
        trend: { value: '+0.2%', direction: 'up' as const },
    },
    {
        label: 'Open Tickets',
        value: '12',
        icon: <AlertTriangle className="w-5 h-5" />,
        color: '#f59e0b',
        trend: { value: '-3', direction: 'down' as const },
    },
    {
        label: 'Avg Response Time',
        value: '15min',
        icon: <Clock className="w-5 h-5" />,
        color: '#3b82f6',
        trend: { value: '-2min', direction: 'down' as const },
    },
    {
        label: 'Security Score',
        value: '92/100',
        icon: <ShieldIcon className="w-5 h-5" />,
        color: '#a855f7',
        trend: { value: '+5', direction: 'up' as const },
    },
];

// Tickets by Category
const ticketsByCategory = [
    { name: 'Hardware', value: 25, color: '#3b82f6' },
    { name: 'Software', value: 38, color: '#22c55e' },
    { name: 'Network', value: 15, color: '#f59e0b' },
    { name: 'Security', value: 8, color: '#ef4444' },
    { name: 'Access', value: 20, color: '#a855f7' },
];

// Monthly Ticket Volume
const ticketTrend = [
    { name: 'Jul', value: 85 },
    { name: 'Aug', value: 92 },
    { name: 'Sep', value: 78 },
    { name: 'Oct', value: 65 },
    { name: 'Nov', value: 58 },
    { name: 'Dec', value: 52 },
];

// System Health
const systemHealth = [
    { name: 'Healthy', value: 45, color: '#22c55e' },
    { name: 'Warning', value: 8, color: '#f59e0b' },
    { name: 'Critical', value: 2, color: '#ef4444' },
];

const itCharts = [
    { type: 'bar' as const, title: 'Tickets by Category', data: ticketsByCategory },
    { type: 'area' as const, title: 'Monthly Ticket Volume', data: ticketTrend },
    { type: 'pie' as const, title: 'System Health Status', data: systemHealth },
];

const itActions = [
    { icon: '🎫', label: 'New Ticket', onClick: () => console.log('New Ticket') },
    { icon: '🔍', label: 'System Scan', onClick: () => console.log('System Scan') },
    { icon: '🔐', label: 'Security Audit', onClick: () => console.log('Security Audit') },
    { icon: '📊', label: 'Reports', onClick: () => console.log('Reports') },
    { icon: '⚙️', label: 'Config', onClick: () => console.log('Config') },
    { icon: '👤', label: 'Access Mgmt', onClick: () => console.log('Access Mgmt') },
];

export default function ITPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard
            title="IT Hub"
            subtitle="Infrastructure • Security • Support • Systems Management"
            icon="💻"
            color="cyan"
            statusLabel="Uptime"
            statusValue="99.8%"
            metrics={itMetrics}
            charts={itCharts}
            quickActions={itActions}
            locale={locale}
        >
            {/* Infrastructure Status */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-cyan-400" />
                    Infrastructure Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { name: 'Web Servers', count: 12, status: 'healthy' },
                        { name: 'Databases', count: 4, status: 'healthy' },
                        { name: 'Load Balancers', count: 2, status: 'warning' },
                        { name: 'Storage Nodes', count: 8, status: 'healthy' },
                    ].map((item) => (
                        <div key={item.name} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">{item.name}</span>
                                <span className={`w-2 h-2 rounded-full ${item.status === 'healthy' ? 'bg-green-500' :
                                        item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} />
                            </div>
                            <div className="text-2xl font-bold text-cyan-400">{item.count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </DepartmentDashboard>
    );
}
