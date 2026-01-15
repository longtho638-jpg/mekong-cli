'use client';

import React from 'react';
import { MD3Surface, MD3Text } from '@/components/md3-dna';
import { DollarSign, TrendingUp, Users, Briefcase, LucideIcon } from 'lucide-react';

/* =====================================================
   KPI Hero Grid - Built on MD3 DNA
   
   Uses MD3Surface for auto-safe padding
   Text and icons NEVER clipped
   ===================================================== */

interface KPIMetric {
    label: string;
    value: string;
    trend: string;
    trendDirection: 'up' | 'down';
    Icon: LucideIcon;
}

interface KPIHeroGridProps {
    metrics?: KPIMetric[];
}

const defaultMetrics: KPIMetric[] = [
    { label: 'War Chest', value: '$850K', trend: 'FY2026', trendDirection: 'up', Icon: DollarSign },
    { label: 'MTD Revenue', value: '$85K', trend: '+12%', trendDirection: 'up', Icon: TrendingUp },
    { label: 'Active Clients', value: '48', trend: '+6', trendDirection: 'up', Icon: Users },
    { label: 'Avg Deal', value: '$8.5K', trend: '+$1.2K', trendDirection: 'up', Icon: Briefcase },
];

export function KPIHeroGrid({ metrics = defaultMetrics }: KPIHeroGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map((metric, index) => (
                <MD3Surface
                    key={metric.label}
                    shape="large"
                    color="surface-container"
                    interactive={true}
                >
                    {/* Header Row - Icon + Label */}
                    <div className="flex items-center gap-2 mb-3">
                        <div
                            className="p-1.5 rounded-lg"
                            style={{
                                backgroundColor: 'var(--md-sys-color-primary-container)',
                                color: 'var(--md-sys-color-on-primary-container)'
                            }}
                        >
                            <metric.Icon size={16} />
                        </div>
                        <MD3Text
                            variant="label-small"
                            color="on-surface-variant"
                            transform="uppercase"
                        >
                            {metric.label}
                        </MD3Text>
                    </div>

                    {/* Value */}
                    <MD3Text variant="headline-small" color="on-surface">
                        {metric.value}
                    </MD3Text>

                    {/* Trend */}
                    <div className="flex items-center gap-1 mt-1">
                        <span style={{
                            color: metric.trendDirection === 'up'
                                ? 'var(--md-sys-color-tertiary)'
                                : 'var(--md-sys-color-error)'
                        }}>
                            {metric.trendDirection === 'up' ? '↑' : '↓'}
                        </span>
                        <MD3Text
                            variant="label-small"
                            color={metric.trendDirection === 'up' ? 'tertiary' : 'error'}
                        >
                            {metric.trend}
                        </MD3Text>
                    </div>

                    {/* Pulse Indicator */}
                    <div
                        className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: 'var(--md-sys-color-tertiary)' }}
                    />
                </MD3Surface>
            ))}
        </div>
    );
}

export default KPIHeroGrid;
