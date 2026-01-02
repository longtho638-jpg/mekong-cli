'use client';

import React, { useState, useEffect } from 'react';
import CommandCenterLayout from '@/components/layouts/CommandCenterLayout';
import { MetricsGrid } from '@/components/DepartmentDashboard/MetricsGrid';
import { CampaignMap } from '@/components/DepartmentDashboard/CampaignMap';
import { RevenueRanks } from '@/components/DepartmentDashboard/RevenueRanks';
import { HarmonyRadar } from '@/components/DepartmentDashboard/HarmonyRadar';
import { DollarSign, TrendingUp, Briefcase, Calculator } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function RevenuePage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Revenue');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Mock Data
    const revenueMetrics = [
        { label: 'Annual Target', value: '$1M', change: '+25%', icon: <DollarSign className="w-5 h-5" />, color: 'green', trend: { value: 'FY2026', direction: 'up' as const } },
        { label: 'MTD Revenue', value: '$85K', change: '+12%', icon: <DollarSign className="w-5 h-5" />, color: 'blue', trend: { value: '+$12K', direction: 'up' as const } },
        { label: 'Active Clients', value: '48', change: '+6', icon: <Users className="w-5 h-5" />, color: 'purple', trend: { value: '+6', direction: 'up' as const } },
        { label: 'Avg Deal Size', value: '$8.5K', change: '+2%', icon: <Briefcase className="w-5 h-5" />, color: 'amber', trend: { value: '+$1.2K', direction: 'up' as const } },
    ];

    if (!mounted) return null;

    return (
        <CommandCenterLayout>
            <div className="space-y-6">

                {/* TOP SECTION: CAMPAIGN MAP (The Journey) */}
                <div>
                    <CampaignMap />
                </div>

                {/* MIDDLE SECTION: METRICS & RADAR */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <MetricsGrid metrics={revenueMetrics} color="green" />
                    </div>
                    <div className="hidden lg:block relative">
                        <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full" />
                        <HarmonyRadar />
                    </div>
                </div>

                {/* BOTTOM SECTION: THE ARMY */}
                <div>
                    <RevenueRanks />
                </div>

            </div>
        </CommandCenterLayout>
    );
}

function Users({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
