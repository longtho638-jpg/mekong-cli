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
            {/* Safe Container - 32px padding */}
            <div className="safe-container">
                {/* Header - Clean Typography */}
                <header className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{icon}</span>
                            <div>
                                <h1 className="text-title flex items-center gap-2">
                                    {title}
                                    <span className="status-dot status-dot-pulse" style={{ background: colors.primary }} />
                                </h1>
                                {subtitle && (
                                    <p className="text-muted text-sm mt-0.5">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        {/* Status Badge - inline, minimal */}
                        {statusLabel && statusValue && (
                            <div className="card-subtle flex items-center gap-2 px-3 py-1.5">
                                <span className="text-label">{statusLabel}</span>
                                <span className="text-value text-base" style={{ color: colors.primary }}>{statusValue}</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Metrics Grid */}
                {metrics && metrics.length > 0 && (
                    <section className="mb-6">
                        <MetricsGrid metrics={metrics} color={color} />
                    </section>
                )}

                {/* Charts */}
                {charts && charts.length > 0 && (
                    <section className="mb-6">
                        <ChartSection charts={charts} color={color} />
                    </section>
                )}

                {/* Quick Actions - horizontal row */}
                {quickActions && quickActions.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-label mb-3">Quick Actions</h3>
                        <div className="flex flex-wrap gap-2">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className="action-inline"
                                >
                                    <span className="text-sm">{action.icon}</span>
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Custom Children */}
                {children && (
                    <section className="space-y-4">
                        {children}
                    </section>
                )}
            </div>
        </DashboardShell>
    );
}

// Re-export
export * from './types';
export { MetricsGrid } from './MetricsGrid';
export { ChartSection } from './ChartSection';
