'use client';

import { DollarSign, TrendingDown, Cloud, PieChart, AlertTriangle, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// FinOps Metrics
const finopsMetrics = [
    {
        label: 'Cloud Spend MTD',
        value: '$45.2K',
        icon: <Cloud className="w-5 h-5" />,
        color: '#3b82f6',
        trend: { value: '+8%', direction: 'up' as const },
    },
    {
        label: 'Cost Savings',
        value: '$12.5K',
        icon: <TrendingDown className="w-5 h-5" />,
        color: '#22c55e',
        trend: { value: '+28%', direction: 'up' as const },
    },
    {
        label: 'Optimization Score',
        value: '78%',
        icon: <Zap className="w-5 h-5" />,
        color: '#a855f7',
        trend: { value: '+5%', direction: 'up' as const },
    },
    {
        label: 'Waste Identified',
        value: '$8.3K',
        icon: <AlertTriangle className="w-5 h-5" />,
        color: '#f59e0b',
        trend: { value: '-12%', direction: 'down' as const },
    },
];

// Cost by Service
const costByService = [
    { name: 'Compute (EC2/GCE)', value: 18500, color: '#3b82f6' },
    { name: 'Storage (S3/GCS)', value: 8200, color: '#22c55e' },
    { name: 'Database (RDS/Cloud SQL)', value: 12400, color: '#a855f7' },
    { name: 'Networking', value: 3100, color: '#f59e0b' },
    { name: 'AI/ML Services', value: 2800, color: '#ec4899' },
];

// Monthly Spend Trend
const spendTrend = [
    { name: 'Jul', value: 38000 },
    { name: 'Aug', value: 41000 },
    { name: 'Sep', value: 39500 },
    { name: 'Oct', value: 43000 },
    { name: 'Nov', value: 42000 },
    { name: 'Dec', value: 45200 },
];

// Optimization Breakdown
const optimizationBreakdown = [
    { name: 'Reserved Instances', value: 35, color: '#22c55e' },
    { name: 'Spot Instances', value: 20, color: '#3b82f6' },
    { name: 'Right-sizing', value: 15, color: '#a855f7' },
    { name: 'Idle Resources', value: 30, color: '#ef4444' },
];

// Charts configuration
const finopsCharts = [
    {
        type: 'bar' as const,
        title: 'Cost by Service (MTD)',
        data: costByService,
    },
    {
        type: 'area' as const,
        title: 'Monthly Cloud Spend Trend',
        data: spendTrend,
    },
    {
        type: 'pie' as const,
        title: 'Optimization Opportunities',
        data: optimizationBreakdown,
    },
];

// Quick Actions
const finopsActions = [
    { icon: '📊', label: 'Cost Report', onClick: () => console.log('Cost Report') },
    { icon: '🔍', label: 'Analyze Waste', onClick: () => console.log('Analyze Waste') },
    { icon: '💰', label: 'Savings Plan', onClick: () => console.log('Savings Plan') },
    { icon: '📈', label: 'Forecasting', onClick: () => console.log('Forecasting') },
    { icon: '⚡', label: 'Optimize Now', onClick: () => console.log('Optimize Now') },
    { icon: '🔔', label: 'Set Alerts', onClick: () => console.log('Set Alerts') },
];

export default function FinOpsPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    return (
        <DepartmentDashboard
            title="FinOps Hub"
            subtitle="Cloud Cost Management • Optimization • Forecasting • Usage Analytics"
            icon="💵"
            color="green"
            statusLabel="Optimization"
            statusValue="78%"
            metrics={finopsMetrics}
            charts={finopsCharts}
            quickActions={finopsActions}
            locale={locale}
        >
            {/* Cloud Provider Breakdown */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-400" />
                    Cloud Provider Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">☁️</span>
                            <span className="font-bold text-blue-400">AWS</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">$28.4K</div>
                        <div className="text-xs text-gray-400">63% of total spend</div>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🔴</span>
                            <span className="font-bold text-red-400">GCP</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">$12.1K</div>
                        <div className="text-xs text-gray-400">27% of total spend</div>
                    </div>
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🔷</span>
                            <span className="font-bold text-cyan-400">Azure</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">$4.7K</div>
                        <div className="text-xs text-gray-400">10% of total spend</div>
                    </div>
                </div>
            </div>

            {/* Optimization Recommendations */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Top Optimization Recommendations
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-green-400 text-lg">💰</span>
                            <span className="text-sm text-gray-300">Convert 5 instances to Reserved → Save $2.4K/mo</span>
                        </div>
                        <button className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded hover:bg-green-500/30 transition">
                            Apply
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-yellow-400 text-lg">⚠️</span>
                            <span className="text-sm text-gray-300">Terminate 3 idle EC2 instances → Save $890/mo</span>
                        </div>
                        <button className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded hover:bg-yellow-500/30 transition">
                            Review
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-blue-400 text-lg">📉</span>
                            <span className="text-sm text-gray-300">Right-size 8 over-provisioned instances → Save $1.2K/mo</span>
                        </div>
                        <button className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded hover:bg-blue-500/30 transition">
                            Analyze
                        </button>
                    </div>
                </div>
            </div>
        </DepartmentDashboard>
    );
}
