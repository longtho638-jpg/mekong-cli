'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MD3Surface, MD3Text } from '@/components/md3-dna';
import { User, Shield, Crown, LucideIcon } from 'lucide-react';

/* =====================================================
   Revenue Ranks - M3 DNA Compliant
   
   FIXED M3 VIOLATIONS:
   - Icon-text gap: now 12dp (was 8dp)
   - Border inset: content properly distanced from decorative border
   - Internal padding: properly structured
   ===================================================== */

interface RankData {
    name: string;
    subtitle: string;
    value: string;
    units: number;
    growth: number;
    colorToken: 'primary' | 'secondary' | 'tertiary';
    Icon: LucideIcon;
}

const ranks: RankData[] = [
    { name: 'Bộ Binh', subtitle: 'Standard', value: '$25K', units: 65, growth: 12, colorToken: 'primary', Icon: User },
    { name: 'Kỵ Binh', subtitle: 'Specialized', value: '$85K', units: 12, growth: 18, colorToken: 'secondary', Icon: Shield },
    { name: 'Tướng Quân', subtitle: 'Equity', value: '$260K', units: 5, growth: 25, colorToken: 'tertiary', Icon: Crown },
];

export function RevenueRanks() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-gap-md)' }}>
            {/* Section Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-icon-text-default)'
                }}
            >
                <div
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'var(--md-sys-color-outline)',
                        animation: 'pulse 2s infinite'
                    }}
                />
                <MD3Text variant="label-medium" color="on-surface-variant" transform="uppercase">
                    The Army
                </MD3Text>
            </div>

            {/* Cards Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--md-sys-spacing-card-gap)'
                }}
            >
                {ranks.map((rank, index) => (
                    <MD3Surface
                        key={rank.name}
                        shape="large"
                        color="surface-container"
                        interactive={true}
                    >
                        {/* Card inner structure with border inset */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--md-sys-spacing-border-inset)',
                            }}
                        >
                            {/* Colored accent border - properly separated */}
                            <div
                                style={{
                                    width: 4,
                                    borderRadius: 4,
                                    backgroundColor: `var(--md-sys-color-${rank.colorToken})`,
                                    flexShrink: 0,
                                }}
                            />

                            {/* Content area - properly inset from accent border */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {/* Header with M3-compliant icon-text spacing */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--md-sys-spacing-icon-text-default)',
                                        marginBottom: 'var(--md-sys-spacing-gap-sm)'
                                    }}
                                >
                                    <rank.Icon
                                        size={18}
                                        style={{
                                            color: `var(--md-sys-color-${rank.colorToken})`,
                                            flexShrink: 0
                                        }}
                                    />
                                    <MD3Text variant="label-medium" color="on-surface-variant">
                                        {rank.name}
                                    </MD3Text>
                                </div>

                                {/* Value */}
                                <MD3Text variant="headline-small" color="on-surface">
                                    {rank.value}
                                </MD3Text>

                                {/* Progress Bar */}
                                <div
                                    style={{
                                        width: '100%',
                                        height: 4,
                                        borderRadius: 2,
                                        marginTop: 'var(--md-sys-spacing-gap-md)',
                                        marginBottom: 'var(--md-sys-spacing-gap-sm)',
                                        backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <motion.div
                                        style={{
                                            height: '100%',
                                            borderRadius: 2,
                                            backgroundColor: `var(--md-sys-color-${rank.colorToken})`
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(rank.growth * 4, 100)}%` }}
                                        transition={{ duration: 1, delay: index * 0.2 }}
                                    />
                                </div>

                                {/* Footer */}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <MD3Text variant="label-small" color="on-surface-variant">
                                        {rank.units} Units
                                    </MD3Text>
                                    <MD3Text variant="label-small" color={rank.colorToken}>
                                        +{rank.growth}%
                                    </MD3Text>
                                </div>
                            </div>
                        </div>
                    </MD3Surface>
                ))}
            </div>
        </div>
    );
}

export default RevenueRanks;
