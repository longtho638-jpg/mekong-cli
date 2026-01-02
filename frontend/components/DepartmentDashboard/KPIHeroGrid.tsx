'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Briefcase } from 'lucide-react';
import { ReactNode } from 'react';
import { HoloCard } from '@/components/ui/HoloCard';
import { HyperText } from '@/components/ui/HyperText';

interface KPIMetric {
    label: string;
    value: string;
    trend: string;
    trendDirection: 'up' | 'down';
    icon: ReactNode;
}

interface KPIHeroGridProps {
    metrics?: KPIMetric[];
}

const defaultMetrics: KPIMetric[] = [
    { label: 'War Chest', value: '$850K', trend: 'FY2026 Target', trendDirection: 'up', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'MTD Revenue', value: '$85K', trend: '+12%', trendDirection: 'up', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Active Clients', value: '48', trend: '+6 this month', trendDirection: 'up', icon: <Users className="w-5 h-5" /> },
    { label: 'Avg Deal Size', value: '$8.5K', trend: '+$1.2K', trendDirection: 'up', icon: <Briefcase className="w-5 h-5" /> },
];

export function KPIHeroGrid({ metrics = defaultMetrics }: KPIHeroGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
                <HoloCard
                    key={metric.label}
                    className="group"
                >
                    {/* Background Pulse */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        animate={{ opacity: [0, 0.1, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />

                    {/* Icon */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-white/5 text-white/60">
                            {metric.icon}
                        </div>
                        <span className="text-xs text-white/50 uppercase tracking-wider font-orbitron">{metric.label}</span>
                    </div>

                    {/* Value with HyperText (God Tier) */}
                    <motion.div
                        className="text-2xl lg:text-3xl font-bold text-white mb-1 font-orbitron"
                        animate={{ opacity: [1, 0.8, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                    >
                        <HyperText text={metric.value} />
                    </motion.div>

                    {/* Trend */}
                    <div className={`text-xs flex items-center gap-1 ${metric.trendDirection === 'up' ? 'text-green-400' : 'text-red-400'
                        }`}>
                        <span>{metric.trendDirection === 'up' ? '↗' : '↘'}</span>
                        <span>{metric.trend}</span>
                    </div>

                    {/* Live Pulse Dot */}
                    <motion.div
                        className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </HoloCard>
            ))}
        </div>
    );
}
