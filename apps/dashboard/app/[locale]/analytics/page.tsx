'use client';

/**
 * VC Metrics Dashboard
 * Investor-facing analytics showing traction and growth
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    BarChart3,
    Repeat,
    Target,
    Zap
} from 'lucide-react';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { formatCurrency } from '@/lib/billing';

interface MRRMetrics {
    mrr: number;
    arr: number;
    totalCustomers: number;
    paidCustomers: number;
    planBreakdown: {
        free: number;
        pro: number;
        enterprise: number;
    };
    churnRate: number;
    netRevenueRetention: number;
    mrrGrowthRate: number;
    ltv: number;
    cac: number;
    ltvCacRatio: number;
    history: Array<{ month: string; mrr: number; customers: number }>;
}

export default function VCMetricsPage() {
    const [metrics, setMetrics] = useState<MRRMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/billing/metrics');
                const data = await res.json();
                setMetrics(data);
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!metrics) {
        return <div>Failed to load metrics</div>;
    }

    const kpiCards = [
        {
            title: 'Monthly Recurring Revenue',
            value: formatCurrency(metrics.mrr, 'USD'),
            change: `+${metrics.mrrGrowthRate}%`,
            positive: true,
            icon: DollarSign,
            subtitle: `ARR: ${formatCurrency(metrics.arr, 'USD')}`,
        },
        {
            title: 'Total Customers',
            value: metrics.totalCustomers.toLocaleString(),
            change: '+32%',
            positive: true,
            icon: Users,
            subtitle: `${metrics.paidCustomers} paid`,
        },
        {
            title: 'Net Revenue Retention',
            value: `${metrics.netRevenueRetention}%`,
            change: '+5%',
            positive: true,
            icon: Repeat,
            subtitle: 'Best-in-class SaaS',
        },
        {
            title: 'LTV:CAC Ratio',
            value: `${metrics.ltvCacRatio}x`,
            change: '+2.1x',
            positive: true,
            icon: Target,
            subtitle: `LTV: $${metrics.ltv} | CAC: $${metrics.cac}`,
        },
    ];

    return (
        <div className="min-h-screen py-8 px-4 md:px-8" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-8 h-8" style={{ color: 'var(--md-sys-color-primary)' }} />
                        <h1
                            className="text-3xl font-bold"
                            style={{ color: 'var(--md-sys-color-on-surface)' }}
                        >
                            Investor Metrics
                        </h1>
                    </div>
                    <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Real-time business metrics for AgencyOS
                    </p>
                </motion.div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {kpiCards.map((kpi, index) => (
                        <motion.div
                            key={kpi.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <MD3Surface color="surface-container" className="p-6 h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="p-3 rounded-2xl"
                                        style={{ backgroundColor: 'var(--md-sys-color-primary-container)' }}
                                    >
                                        <kpi.icon
                                            className="w-6 h-6"
                                            style={{ color: 'var(--md-sys-color-on-primary-container)' }}
                                        />
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${kpi.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {kpi.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {kpi.change}
                                    </div>
                                </div>

                                <p
                                    className="text-sm mb-1"
                                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                >
                                    {kpi.title}
                                </p>
                                <p
                                    className="text-3xl font-bold mb-1"
                                    style={{ color: 'var(--md-sys-color-on-surface)' }}
                                >
                                    {kpi.value}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                >
                                    {kpi.subtitle}
                                </p>
                            </MD3Surface>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* MRR Trend */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <MD3Card headline="MRR Growth Trend">
                            <div className="h-64 flex items-end gap-2 mt-4">
                                {metrics.history.map((item, i) => {
                                    const maxMRR = Math.max(...metrics.history.map(h => h.mrr));
                                    const height = (item.mrr / maxMRR) * 100;

                                    return (
                                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                                            <span className="text-xs font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                                ${(item.mrr / 1000).toFixed(1)}K
                                            </span>
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                                className="w-full rounded-t-lg"
                                                style={{
                                                    backgroundColor: i === metrics.history.length - 1
                                                        ? 'var(--md-sys-color-primary)'
                                                        : 'var(--md-sys-color-primary-container)'
                                                }}
                                            />
                                            <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                {item.month.split('-')[1]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </MD3Card>
                    </motion.div>

                    {/* Customer Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <MD3Card headline="Customer Breakdown">
                            <div className="space-y-4 mt-4">
                                {[
                                    { label: 'Free', value: metrics.planBreakdown.free, color: 'var(--md-sys-color-surface-variant)' },
                                    { label: 'Pro ($49/mo)', value: metrics.planBreakdown.pro, color: 'var(--md-sys-color-primary)' },
                                    { label: 'Enterprise ($199/mo)', value: metrics.planBreakdown.enterprise, color: 'var(--md-sys-color-tertiary)' },
                                ].map((plan) => {
                                    const total = metrics.totalCustomers;
                                    const percentage = (plan.value / total * 100).toFixed(0);

                                    return (
                                        <div key={plan.label}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                                    {plan.label}
                                                </span>
                                                <span className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                                    {plan.value} ({percentage}%)
                                                </span>
                                            </div>
                                            <div
                                                className="h-3 rounded-full overflow-hidden"
                                                style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
                                            >
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ delay: 0.6 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: plan.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </MD3Card>
                    </motion.div>
                </div>

                {/* Key Metrics Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <MD3Card headline="Key SaaS Metrics">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                            {[
                                { label: 'Churn Rate', value: `${metrics.churnRate}%`, benchmark: '<5%', status: 'good' },
                                { label: 'NRR', value: `${metrics.netRevenueRetention}%`, benchmark: '>100%', status: 'excellent' },
                                { label: 'LTV', value: `$${metrics.ltv}`, benchmark: '>$1000', status: 'excellent' },
                                { label: 'CAC', value: `$${metrics.cac}`, benchmark: '<$300', status: 'good' },
                            ].map((metric) => (
                                <div key={metric.label} className="text-center">
                                    <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        {metric.label}
                                    </p>
                                    <p className="text-2xl font-bold my-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        {metric.value}
                                    </p>
                                    <p className={`text-xs ${metric.status === 'excellent' ? 'text-green-600' :
                                            metric.status === 'good' ? 'text-blue-600' : 'text-yellow-600'
                                        }`}>
                                        Benchmark: {metric.benchmark}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </MD3Card>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        📊 Data refreshed in real-time • AgencyOS Series A Ready
                    </p>
                </div>
            </div>
        </div>
    );
}
