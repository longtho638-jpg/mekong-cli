'use client';

import { DepartmentDashboardProps, colorMap } from './types';
import { MetricsGrid } from './MetricsGrid';
import { ChartSection } from './ChartSection';
import { DashboardShell } from '../DashboardShell';

export function DepartmentDashboard({
    title,
    subtitle,
    icon = '🏢',
    color,
    statusLabel,
    statusValue,
    metrics,
    charts,
    quickActions,
    locale,
    children,
}: DepartmentDashboardProps) {
    const colors = colorMap[color];

    return (
        <DashboardShell locale={locale} accentColor={colors.primary}>
            <div className="px-6 py-8 max-w-[1920px] mx-auto relative">
                {/* Department-specific gradient orb */}
                <div
                    className="fixed top-[15%] right-[25%] w-[500px] h-[500px] pointer-events-none opacity-30"
                    style={{
                        background: `radial-gradient(circle, ${colors.bg} 0%, transparent 70%)`,
                    }}
                />

                {/* Header with Status Badge */}
                <header className="mb-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-4xl">{icon}</span>
                            <h1
                                className="text-3xl font-bold tracking-tight"
                                style={{ color: colors.primary }}
                            >
                                {title}
                            </h1>
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{
                                    background: colors.primary,
                                    boxShadow: `0 0 10px ${colors.primary}`,
                                }}
                            />
                        </div>
                        {subtitle && (
                            <p className="text-gray-400 text-sm max-w-xl">{subtitle}</p>
                        )}
                    </div>

                    {/* Status Badge */}
                    {statusLabel && statusValue && (
                        <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${colors.bgClass} ${colors.borderClass} border backdrop-blur-sm`}
                        >
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: colors.primary }}
                            />
                            <span className="text-xs font-bold" style={{ color: colors.primary }}>
                                {statusLabel}: {statusValue}
                            </span>
                        </div>
                    )}
                </header>

                {/* Metrics Grid with 3D Tilt Effect */}
                {metrics && metrics.length > 0 && (
                    <div className="mb-8">
                        <MetricsGrid metrics={metrics} color={color} />
                    </div>
                )}

                {/* Charts with Neon Glow */}
                {charts && charts.length > 0 && (
                    <div className="mb-8">
                        <ChartSection charts={charts} color={color} />
                    </div>
                )}

                {/* Quick Actions - Floating Dock Style */}
                {quickActions && quickActions.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.primary }} />
                            QUICK ACTIONS
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className="group flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                             hover:bg-white/10 hover:border-white/20 hover:scale-105
                             transition-all duration-300 backdrop-blur-sm"
                                    style={{
                                        '--glow-color': colors.primary,
                                    } as React.CSSProperties}
                                >
                                    <span className="text-lg group-hover:scale-110 transition-transform">
                                        {action.icon}
                                    </span>
                                    <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom Children with glass container */}
                {children && (
                    <div className="space-y-6">
                        {children}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}

// Re-export types and components
export * from './types';
export { MetricsGrid } from './MetricsGrid';
export { ChartSection } from './ChartSection';
