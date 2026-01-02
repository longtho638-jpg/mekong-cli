'use client';

import React, { useState, useEffect } from 'react';
import CommandCenterLayout from '@/components/layouts/CommandCenterLayout';
import { NeuralBackground } from '@/components/ui/NeuralBackground';
import { NeuralCursor } from '@/components/ui/NeuralCursor';
import { AgenticCore } from '@/components/DepartmentDashboard/AgenticCore';
import { HoloCard } from '@/components/ui/HoloCard';
import { KPIHeroGrid } from '@/components/DepartmentDashboard/KPIHeroGrid';
import { QuantumMap } from '@/components/DepartmentDashboard/QuantumMap';
import { RevenueRanks } from '@/components/DepartmentDashboard/RevenueRanks';
import { HarmonyRadar } from '@/components/DepartmentDashboard/HarmonyRadar';
import { motion } from 'framer-motion';

export default function RevenuePage({ params: { locale } }: { params: { locale: string } }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <CommandCenterLayout>
            {/* THE NEURAL VOID + NEURAL CURSOR (God Tier) */}
            <NeuralBackground />
            <NeuralCursor />

            {/* CONTENT LAYER */}
            <motion.div
                className="relative z-10 space-y-8"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.8 }}
            >

                {/* PHASE 1: THE INTELLIGENCE (Center Stage) */}
                <div className="flex justify-center py-4">
                    <AgenticCore />
                </div>

                {/* PHASE 2: THE METRICS (Holographic Grid) */}
                <KPIHeroGrid />

                {/* PHASE 3: COMMAND GRID (Quantum Stream + Radar) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <HoloCard className="h-full min-h-[250px] relative">
                            {/* Quantum Title */}
                            <div className="absolute top-4 left-4 z-20">
                                <h3 className="flex items-center gap-2 text-xs font-orbitron text-white/50 uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    Quantum Strategy Stream
                                </h3>
                            </div>
                            <QuantumMap />
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

            </motion.div>
        </CommandCenterLayout>
    );
}
