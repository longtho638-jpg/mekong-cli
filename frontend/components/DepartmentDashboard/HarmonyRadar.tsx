'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const data = [
    { subject: 'Anh WIN', A: 100, fullMark: 100, label: 'Owner Equity' },
    { subject: 'Agency WIN', A: 95, fullMark: 100, label: 'Deal Flow' },
    { subject: 'Startup WIN', A: 90, fullMark: 100, label: 'Growth' },
];

export function HarmonyRadar() {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-4">
                <h3
                    className="text-lg font-semibold text-[var(--md-sys-color-on-surface)] flex items-center"
                    style={{ gap: 'var(--md-sys-spacing-icon-text-default, 12px)' }}
                >
                    <span>🏯</span>
                    The Soul (Cốt Lõi)
                </h3>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
                    Balanced
                </span>
            </div>

            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4 self-start">
                Ngũ Sự (5 Elements) Alignment Scan
            </p>

            {/* Radar Chart */}
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="var(--md-sys-color-outline-variant)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 10, fontWeight: 600 }}
                        />
                        <Radar
                            name="Harmony"
                            dataKey="A"
                            stroke="var(--md-sys-color-primary)"
                            strokeWidth={2}
                            fill="var(--md-sys-color-primary)"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
