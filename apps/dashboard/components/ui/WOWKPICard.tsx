'use client';

import React from 'react';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { AnimatedNumber, AnimatedCurrency, AnimatedPercent, PulseIndicator } from './AnimatedNumber';

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ WOW KPI CARD - Premium animated KPI cards for dashboards
// ═══════════════════════════════════════════════════════════════════════════════

interface WOWKPICardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    subtitle?: string;
    type?: 'number' | 'currency' | 'percent';
    duration?: number;
    showPulse?: boolean;
    decimals?: number;
}

export function WOWKPICard({
    icon,
    label,
    value,
    color,
    subtitle,
    type = 'number',
    duration = 1200,
    showPulse = true,
    decimals = 0,
}: WOWKPICardProps) {
    const renderValue = () => {
        switch (type) {
            case 'currency':
                return <AnimatedCurrency value={value} duration={duration} />;
            case 'percent':
                return <AnimatedPercent value={value} duration={duration} decimals={decimals} />;
            default:
                return <AnimatedNumber value={value} duration={duration} decimals={decimals} />;
        }
    };

    return (
        <MD3Surface shape="large" className="auto-safe">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <span style={{ color }}>{icon}</span>
                    <span
                        style={{
                            fontSize: 'var(--md-sys-typescale-label-medium-size)',
                            color: 'var(--md-sys-color-on-surface-variant)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {label}
                    </span>
                </div>
                {showPulse && <PulseIndicator color={color} size={8} />}
            </div>
            <div
                style={{
                    fontSize: 'var(--md-sys-typescale-display-small-size)',
                    fontWeight: 600,
                    color,
                }}
            >
                {renderValue()}
            </div>
            {subtitle && (
                <div
                    style={{
                        fontSize: 'var(--md-sys-typescale-body-small-size)',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        marginTop: '4px',
                    }}
                >
                    {subtitle}
                </div>
            )}
        </MD3Surface>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 WOW STAT ROW - Compact animated stat for sidebars
// ═══════════════════════════════════════════════════════════════════════════════

interface WOWStatRowProps {
    label: string;
    value: number;
    type?: 'number' | 'currency' | 'percent';
    color?: string;
    duration?: number;
}

export function WOWStatRow({
    label,
    value,
    type = 'number',
    color = 'var(--md-sys-color-primary)',
    duration = 800,
}: WOWStatRowProps) {
    const renderValue = () => {
        switch (type) {
            case 'currency':
                return <AnimatedCurrency value={value} duration={duration} />;
            case 'percent':
                return <AnimatedPercent value={value} duration={duration} />;
            default:
                return <AnimatedNumber value={value} duration={duration} />;
        }
    };

    return (
        <div className="flex justify-between items-center py-2">
            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</span>
            <span style={{ fontWeight: 600, color }}>{renderValue()}</span>
        </div>
    );
}

export default WOWKPICard;
