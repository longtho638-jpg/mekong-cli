'use client';

import React from 'react';

/**
 * VC Readiness Gauge Component
 * Displays the 83/100 score with visual gauge
 */

interface GaugeProps {
    score: number;
    maxScore?: number;
    label: string;
}

const Gauge: React.FC<GaugeProps> = ({ score, maxScore = 100, label }) => {
    const percentage = (score / maxScore) * 100;
    const strokeDasharray = 2 * Math.PI * 45;
    const strokeDashoffset = strokeDasharray * (1 - percentage / 100);

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted/20"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="45"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray,
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 1s ease-out'
                        }}
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{score}</span>
                    <span className="text-xs text-muted-foreground">/ {maxScore}</span>
                </div>
            </div>
            <span className="mt-2 text-sm font-medium text-muted-foreground">{label}</span>
        </div>
    );
};

export function VCReadinessCard() {
    const metrics = [
        { label: 'LTV/CAC Ratio', value: '12.0x', status: 'good' },
        { label: 'Rule of 40', value: '33%', status: 'warning' },
        { label: 'NRR', value: '112%', status: 'good' },
        { label: 'MRR', value: '$75,000', status: 'good' },
        { label: 'Growth Rate', value: '18%', status: 'good' },
        { label: 'Stage', value: 'SEED', status: 'info' }
    ];

    const gaps = [
        'Growth: 18% → 25%',
        'Rule of 40: 33 → 40',
        'NRR: 112% → 120%'
    ];

    return (
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-foreground">📊 VC Readiness</h3>
                    <p className="text-sm text-muted-foreground">AntigravityKit VCMetrics</p>
                </div>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-medium">
                    SEED Stage
                </span>
            </div>

            <div className="flex items-center justify-center mb-6">
                <Gauge score={83} label="Readiness Score" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                {metrics.map((m) => (
                    <div key={m.label} className="flex justify-between p-2 bg-background/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">{m.label}</span>
                        <span className={`text-sm font-medium ${m.status === 'good' ? 'text-green-500' :
                                m.status === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                            }`}>{m.value}</span>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Gaps to Close</h4>
                <div className="space-y-1">
                    {gaps.map((gap, i) => (
                        <div key={i} className="text-sm text-foreground">• {gap}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default VCReadinessCard;
