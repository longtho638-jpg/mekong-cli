'use client';

import React, { useState, useEffect } from 'react';
import CommandCenterLayout from '@/components/layouts/CommandCenterLayout';
import { MetricsGrid } from '@/components/DepartmentDashboard/MetricsGrid';
import { CampaignMap } from '@/components/DepartmentDashboard/CampaignMap';
import { RevenueRanks } from '@/components/DepartmentDashboard/RevenueRanks';
import { HarmonyRadar } from '@/components/DepartmentDashboard/HarmonyRadar';
import { DollarSign, Briefcase, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function RevenuePage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Revenue');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const revenueMetrics = [
        { label: 'Annual Target', value: '$1M', change: '+25%', icon: <DollarSign className="w-5 h-5" />, color: 'green', trend: { value: 'FY2026', direction: 'up' as const } },
        { label: 'MTD Revenue', value: '$85K', change: '+12%', icon: <DollarSign className="w-5 h-5" />, color: 'blue', trend: { value: '+$12K', direction: 'up' as const } },
        { label: 'Active Clients', value: '48', change: '+6', icon: <Users className="w-5 h-5" />, color: 'purple', trend: { value: '+6', direction: 'up' as const } },
        { label: 'Avg Deal Size', value: '$8.5K', change: '+2%', icon: <Briefcase className="w-5 h-5" />, color: 'amber', trend: { value: '+$1.2K', direction: 'up' as const } },
    ];

    if (!mounted) return null;

    return (
        <CommandCenterLayout>
            {/* NEW LAYOUT: 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Campaign + Metrics (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Campaign Map - Compact */}
                    <CampaignMap />

                    {/* Metrics Grid */}
                    <MetricsGrid metrics={revenueMetrics} color="green" />
                </div>

                {/* RIGHT COLUMN: Radar (4 cols) */}
                <div className="lg:col-span-4">
                    <div className="sticky top-20">
                        <HarmonyRadar />
                    </div>
                </div>

                {/* FULL WIDTH: The Army */}
                <div className="lg:col-span-12">
                    <RevenueRanks />
                </div>

            </div>
        </CommandCenterLayout>
    );
}
