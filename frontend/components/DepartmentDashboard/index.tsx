'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command } from 'lucide-react';
import { DepartmentDashboardProps, colorMap } from './types';
import { MetricsGrid } from './MetricsGrid';
import { ChartSection } from './ChartSection';

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
    const router = useRouter();
    const pathname = usePathname();
    const colors = colorMap[color];

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-opacity-30">
            {/* Animated background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div
                className="fixed top-[12%] right-[30%] w-[40%] h-[40%] pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${colors.bg} 0%, transparent 70%)`,
                }}
            />

            {/* Navigation */}
            <nav
                className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between"
                style={{ borderBottom: `1px solid ${colors.border}` }}
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2" style={{ color: colors.primary }}>
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span
                            className={`px-1.5 py-0.5 text-[10px] rounded animate-pulse ${colors.bgClass} ${colors.borderClass} border`}
                            style={{ color: colors.primary }}
                        >
                            {title.split(' ')[0].toUpperCase()}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{title}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    {statusLabel && statusValue && (
                        <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bgClass} ${colors.borderClass} border`}
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

                    {/* Command Palette Hint */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                        <Command className="w-3 h-3" />
                        <span>Search...</span>
                        <span className="bg-white/10 px-1 rounded text-[10px]">⌘K</span>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        {['en', 'vi', 'zh'].map((l) => (
                            <button
                                key={l}
                                onClick={() => switchLocale(l)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${locale === l
                                        ? `${colors.bgClass} shadow-lg`
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                                style={locale === l ? { color: colors.primary } : undefined}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                {/* Header */}
                <header className="mb-8">
                    <h1
                        className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3"
                        style={{ color: colors.primary }}
                    >
                        {icon} {title}
                        <span
                            className="w-2 h-2 rounded-full animate-pulse box-content border-4"
                            style={{
                                background: colors.primary,
                                borderColor: colors.bg,
                            }}
                        />
                    </h1>
                    {subtitle && (
                        <p className="text-gray-400 text-sm max-w-xl">{subtitle}</p>
                    )}
                </header>

                {/* Metrics Grid */}
                {metrics && metrics.length > 0 && (
                    <div className="mb-8">
                        <MetricsGrid metrics={metrics} color={color} />
                    </div>
                )}

                {/* Charts */}
                {charts && charts.length > 0 && (
                    <div className="mb-8">
                        <ChartSection charts={charts} color={color} />
                    </div>
                )}

                {/* Quick Actions */}
                {quickActions && quickActions.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.onClick}
                                    className="group flex flex-col items-center gap-3 p-4 bg-[#0A0A0A] border border-white/10 rounded-xl
                           hover:border-opacity-50 hover:scale-105 transition-all duration-300"
                                    style={{ '--hover-color': colors.primary } as any}
                                >
                                    <div
                                        className="text-2xl group-hover:scale-110 transition-transform"
                                        style={{ color: colors.primary }}
                                    >
                                        {action.icon}
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom Children */}
                {children}
            </main>
        </div>
    );
}

// Re-export types and components
export * from './types';
export { MetricsGrid } from './MetricsGrid';
export { ChartSection } from './ChartSection';
