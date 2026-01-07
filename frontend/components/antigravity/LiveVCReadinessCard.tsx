'use client';

import React from 'react';
import { useAntigravity } from '../../hooks/useAntigravity';

/**
 * Live VC Readiness Card with Real-time Data
 */

export function LiveVCReadinessCard() {
    const { vc, loading, error } = useAntigravity();

    if (loading && !vc) {
        return (
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 animate-pulse">
                <div className="h-8 w-48 bg-muted rounded mb-4" />
                <div className="h-32 w-32 mx-auto bg-muted rounded-full mb-6" />
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-4 bg-muted rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !vc) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                <p className="text-red-500">Failed to load VC metrics</p>
            </div>
        );
    }

    const metrics = [
        { label: 'LTV/CAC Ratio', value: `${vc.ltv_cac_ratio.toFixed(1)}x`, status: 'good' },
        { label: 'Rule of 40', value: `${vc.rule_of_40.toFixed(0)}%`, status: vc.rule_of_40 >= 40 ? 'good' : 'warning' },
        { label: 'NRR', value: `${vc.nrr}%`, status: 'good' },
        { label: 'MRR', value: `$${vc.mrr.toLocaleString()}`, status: 'good' },
        { label: 'Growth Rate', value: `${vc.growth_rate}%`, status: vc.growth_rate >= 20 ? 'good' : 'warning' },
        { label: 'Stage', value: vc.stage, status: 'info' }
    ];

    const percentage = vc.score;
    const strokeDasharray = 2 * Math.PI * 45;
    const strokeDashoffset = strokeDasharray * (1 - percentage / 100);

    return (
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-foreground">📊 VC Readiness (Live)</h3>
                    <p className="text-sm text-muted-foreground">Auto-updates every 30s</p>
                </div>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-medium">
                    {vc.stage}
                </span>
            </div>

            <div className="flex items-center justify-center mb-6">
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
                        <span className="text-3xl font-bold text-foreground">{vc.score}</span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                </div>
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
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Real-time data</span>
                    <span>{new Date(vc.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    );
}

export default LiveVCReadinessCard;
