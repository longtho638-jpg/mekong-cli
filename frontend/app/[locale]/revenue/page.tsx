'use client';

import React, { useState, useEffect } from 'react';
import CommandCenterLayout from '@/components/layouts/CommandCenterLayout';
import { AIInsightStrip } from '@/components/DepartmentDashboard/AIInsightStrip';
import { KPIHeroGrid } from '@/components/DepartmentDashboard/KPIHeroGrid';
import { CampaignMap } from '@/components/DepartmentDashboard/CampaignMap';
import { RevenueRanks } from '@/components/DepartmentDashboard/RevenueRanks';
import { HarmonyRadar } from '@/components/DepartmentDashboard/HarmonyRadar';
import { useTranslations } from 'next-intl';

export default function RevenuePage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Revenue');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <CommandCenterLayout>
            {/* 2026 LAYOUT: 4 LAYERS */}
            <div className="space-y-6">

                {/* LAYER 1: AI INSIGHT STRIP */}
                <AIInsightStrip
                    insight="Revenue +12% vs forecast. Recommended: Focus Zone 4 expansion for Q1 $1M target."
                    type="success"
                />

                {/* LAYER 2: KPI HERO GRID */}
                <KPIHeroGrid />

                {/* LAYER 3: COMMAND GRID (Campaign + Radar) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <CampaignMap />
                    </div>
                    <div className="lg:col-span-4">
                        <HarmonyRadar />
                    </div>
                </div>

                {/* LAYER 4: REVENUE ARMY */}
                <RevenueRanks />

            </div>
        </CommandCenterLayout>
    );
}
