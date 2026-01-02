'use client';

import { DollarSign, TrendingUp, Users, Target, Briefcase, Award, PieChart, BarChart3 } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// Binh Phap War Room Components
import { CampaignMap } from '@/components/DepartmentDashboard/CampaignMap';
import { HarmonyRadar } from '@/components/DepartmentDashboard/HarmonyRadar';
import { RevenueRanks } from '@/components/DepartmentDashboard/RevenueRanks';

export default function RevenuePage({ params: { locale } }: { params: { locale: string } }) {
    // $1M Revenue Model
    const revenueMetrics = [
        { label: 'Annual Target', value: '$1M', icon: <Target className="w-5 h-5" />, color: '#22c55e', trend: { value: 'FY2026', direction: 'up' as const } },
        { label: 'MTD Revenue', value: '$85K', icon: <DollarSign className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+$12K', direction: 'up' as const } },
        { label: 'Active Clients', value: '48', icon: <Users className="w-5 h-5" />, color: '#a855f7', trend: { value: '+6', direction: 'up' as const } },
        { label: 'Avg Deal Size', value: '$8.5K', icon: <Briefcase className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$1.2K', direction: 'up' as const } },
    ];

    // Revenue by Hub Tier (Chart Data)
    const revenueByTier = [
        { name: 'Core Hubs', value: 288000, color: '#22c55e' },      // 4 hubs × $6K × 12
        { name: 'Growth Hubs', value: 192000, color: '#3b82f6' },    // 8 hubs × $2K × 12  
        { name: 'Specialized', value: 144000, color: '#a855f7' },    // 12 hubs × $1K × 12
        { name: 'Basic Hubs', value: 116000, color: '#f59e0b' },     // 58 hubs × $166 × 12
        { name: 'Equity Exits', value: 260000, color: '#ec4899' },   // 10 exits × $26K
    ];

    // Monthly Revenue Trend
    const monthlyRevenue = [
        { name: 'Jan', value: 65000 },
        { name: 'Feb', value: 72000 },
        { name: 'Mar', value: 78000 },
        { name: 'Apr', value: 82000 },
        { name: 'May', value: 85000 },
        { name: 'Jun', value: 88000 },
        { name: 'Jul', value: 90000 },
        { name: 'Aug', value: 92000 },
        { name: 'Sep', value: 95000 },
        { name: 'Oct', value: 98000 },
        { name: 'Nov', value: 100000 },
        { name: 'Dec', value: 105000 },
    ];

    const revenueCharts = [
        { type: 'pie' as const, title: '$1M Revenue Breakdown', data: revenueByTier },
        { type: 'area' as const, title: 'Monthly Revenue Trend', data: monthlyRevenue },
    ];

    const revenueActions = [
        { icon: '📊', label: 'Dashboard', onClick: () => console.log('Dashboard') },
        { icon: '💰', label: 'Invoices', onClick: () => console.log('Invoices') },
        { icon: '📋', label: 'Pipeline', onClick: () => console.log('Pipeline') },
        { icon: '🎯', label: 'Targets', onClick: () => console.log('Targets') },
        { icon: '📈', label: 'Reports', onClick: () => console.log('Reports') },
        { icon: '⚙️', label: 'Settings', onClick: () => console.log('Settings') },
    ];

    return (
        <DepartmentDashboard
            title="Revenue Dashboard"
            subtitle="$1M Annual Target • 82 Hubs • Equity Portfolio"
            icon="💰"
            color="green"
            statusLabel="Target"
            statusValue="$1M"
            metrics={revenueMetrics}
            charts={revenueCharts}
            quickActions={revenueActions}
            locale={locale}
        >
            <div className="space-y-6 mt-8">
                {/* 1. The Journey (Con Đường) - 13 Chapters Roadmap */}
                <CampaignMap />

                {/* Grid Layout: Army vs Soul */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 2. The Army (Quân Đội) - Revenue Ranks (2/3 width) */}
                    <div className="lg:col-span-2">
                        <RevenueRanks />
                    </div>

                    {/* 3. The Soul (Cái Hồn) - Harmony Radar (1/3 width) */}
                    <div className="lg:col-span-1 h-full">
                        <HarmonyRadar />
                    </div>
                </div>
            </div>
        </DepartmentDashboard>
    );
}

