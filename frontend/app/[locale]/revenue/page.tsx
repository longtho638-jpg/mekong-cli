'use client';

import React, { useState, useEffect } from 'react';
import CommandCenterLayout from '@/components/layouts/CommandCenterLayout';
import { NeuralBackground } from '@/components/ui/NeuralBackground';
import { AgenticCore } from '@/components/DepartmentDashboard/AgenticCore';
import { HoloCard } from '@/components/ui/HoloCard';
import { KPIHeroGrid } from '@/components/DepartmentDashboard/KPIHeroGrid'; // Will refactor this next to use HoloCard internally
import { CampaignMap } from '@/components/DepartmentDashboard/CampaignMap';
import { RevenueRanks } from '@/components/DepartmentDashboard/RevenueRanks';
import { HarmonyRadar } from '@/components/DepartmentDashboard/HarmonyRadar';

export default function RevenuePage({ params: { locale } }: { params: { locale: string } }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <CommandCenterLayout>
            {/* THE NEURAL VOID */}
            <NeuralBackground />

            {/* CONTENT LAYER */}
            <div className="relative z-10 space-y-8">

                {/* PHASE 1: THE INTELLIGENCE (Center Stage) */}
                <div className="flex justify-center py-4">
                    <AgenticCore />
                </div>

                {/* PHASE 2: THE METRICS (Holographic Grid) */}
                {/* Note: KPIHeroGrid needs to be updated to use HoloCard, for now wrapping entire sections */}
                <KPIHeroGrid />

                {/* PHASE 3: COMMAND GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <HoloCard className="h-full">
                            <CampaignMap />
                        </HoloCard>
                    </div>
                    <div className="lg:col-span-4">
                        <HoloCard className="h-full">
                            <HarmonyRadar />
                        </HoloCard>
                    </div>
                </div>

                {/* PHASE 4: THE ARMY */}
                <RevenueRanks />

            </div>
        </CommandCenterLayout>
    );
}
