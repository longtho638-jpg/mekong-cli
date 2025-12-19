'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { TrendingUp, Shield, Target, PieChart, Activity, Command, Zap, Flame, DollarSign } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, ResponsiveContainer, PieChart as RePieChart, Pie, RadialBarChart, RadialBar, ScatterChart, Scatter, ZAxis } from 'recharts';

// Mock data for visualizations
const cashFlowData = [
    { month: 'Jan', inflow: 420, outflow: 180 },
    { month: 'Feb', inflow: 530, outflow: 220 },
    { month: 'Mar', inflow: 780, outflow: 250 },
    { month: 'Apr', inflow: 850, outflow: 290 },
    { month: 'May', inflow: 920, outflow: 310 },
    { month: 'Jun', inflow: 1100, outflow: 340 },
];

const portfolioHeatmapData = [
    { x: 3, y: 85, z: 2400, name: 'Startup A' },
    { x: 12, y: 62, z: 1800, name: 'Startup B' },
    { x: 18, y: 91, z: 4200, name: 'Startup C' },
    { x: 8, y: 78, z: 3100, name: 'Startup D' },
    { x: 24, y: 45, z: 850, name: 'Startup E' },
    { x: 6, y: 88, z: 5600, name: 'Startup F' },
];

const sparklineData = [
    { value: 40 }, { value: 65 }, { value: 52 }, { value: 78 }, { value: 85 }, { value: 92 }, { value: 105 },
];

const equityDistribution = [
    { name: 'Founders', value: 45, color: '#10b981' },
    { name: 'Angels', value: 15, color: '#3b82f6' },
    { name: 'Series A', value: 25, color: '#8b5cf6' },
    { name: 'Reserved', value: 15, color: '#6b7280' },
];

export default function PortfolioPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('VC');
    const tStrategy = useTranslations('Strategy');
    const tHubs = useTranslations('Hubs');
    const tAI = useTranslations('AI');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-emerald-500/30 selection:text-emerald-300">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-300 animate-pulse">PRO MAX</span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>{tHubs('vc_hub')}</span>
                        <span className="opacity-50">/</span>
                        <span className="text-white">{t('portfolio')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* AI Co-Pilot Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-300 font-bold">{tAI('copilot_active')}</span>
                    </div>

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
                                    ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                    : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                {/* Header */}
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
                            {t('portfolio')}
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse box-content border-4 border-emerald-500/20" />
                        </h1>
                        <p className="text-gray-400 text-sm max-w-xl">
                            Real-time monitoring of deployed capital and strategic unlock status.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t('valuation')}</div>
                        <div className="text-3xl font-bold text-white font-mono">$12,450,000</div>
                        <div className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +24.5% this month
                        </div>
                    </div>
                </header>

                {/* Stats Grid with Sparklines */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCardWithSparkline
                        label={t('invested')}
                        value="$4.2M"
                        sub="+12% YTD"
                        data={sparklineData}
                        color="#10b981"
                    />
                    <StatCardWithSparkline
                        label={t('runway')}
                        value="18.5"
                        sub="Avg across portfolio"
                        data={[{ value: 35 }, { value: 42 }, { value: 38 }, { value: 45 }, { value: 52 }, { value: 48 }, { value: 55 }]}
                        color="#eab308"
                    />
                    <StatCardWithSparkline
                        label={t('irr')}
                        value="38.2%"
                        sub="top quartile"
                        data={[{ value: 20 }, { value: 28 }, { value: 25 }, { value: 32 }, { value: 35 }, { value: 38 }, { value: 42 }]}
                        color="#10b981"
                    />
                    <StatCardWithCircular
                        label={tStrategy('active_strategies')}
                        value="7/13"
                        sub="Sun Tzu Modules"
                        percentage={54}
                        color="#a855f7"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Portfolio Performance Heatmap */}
                    <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 opacity-50" />
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                Portfolio Performance Heatmap
                            </h3>
                            <div className="text-xs text-gray-500">
                                Size = Valuation | Y-Axis = Growth %
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={350}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <defs>
                                    <radialGradient id="scatterGlow">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </radialGradient>
                                </defs>
                                <ZAxis type="number" dataKey="z" range={[200, 2000]} />
                                <Scatter name="Startups" data={portfolioHeatmapData} fill="url(#scatterGlow)">
                                    {portfolioHeatmapData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.y > 70 ? '#10b981' : entry.y > 50 ? '#eab308' : '#ef4444'}
                                            opacity={0.7}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-6 gap-2 mt-4">
                            {portfolioHeatmapData.map((startup, i) => (
                                <div key={i} className="text-center p-2 bg-white/5 rounded border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer">
                                    <div className="text-[10px] text-gray-400 mb-1">{startup.name}</div>
                                    <div className="text-sm font-bold text-emerald-400">{startup.y}%</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Strategy Panel with Circular Progress */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 flex flex-col">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-400" />
                            {tStrategy('active_strategies')}
                        </h3>

                        <div className="space-y-6 flex-1">
                            <StrategyItem title={tStrategy('chapter_1')} progress={100} status="COMPLETED" color="bg-emerald-500" />
                            <StrategyItem title={tStrategy('chapter_2')} progress={85} status="IN PROGRESS" color="bg-blue-500" />
                            <StrategyItem title={tStrategy('chapter_3')} progress={40} status="PLANNING" color="bg-yellow-500" />
                            <StrategyItem title="Chapter 4: Tactical Dispositions" progress={0} status="LOCKED" color="bg-gray-800" locked />
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-400">{tStrategy('win_probability')}</span>
                                <span className="text-2xl font-bold text-emerald-400 font-mono">87.5%</span>
                            </div>
                            <ResponsiveContainer width="100%" height={120}>
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    data={[{ value: 87.5, fill: '#10b981' }]}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <RadialBar
                                        background={{ fill: '#1f2937' }}
                                        dataKey="value"
                                        cornerRadius={10}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Cash Flow Visualization Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cash Flow Sankey */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Flame className="w-4 h-4 text-orange-400" />
                                {t('burn_rate')} Trend
                            </h3>
                            <div className="text-xs text-orange-400 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                $340K/mo
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={cashFlowData}>
                                <defs>
                                    <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} fill="url(#inflowGradient)" />
                                <Area type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} fill="url(#outflowGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
                                <div className="text-xs text-emerald-400 mb-1">Total Inflow</div>
                                <div className="text-xl font-bold text-emerald-300">$4.6M</div>
                            </div>
                            <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded">
                                <div className="text-xs text-red-400 mb-1">Total Outflow</div>
                                <div className="text-xl font-bold text-red-300">$1.59M</div>
                            </div>
                        </div>
                    </div>

                    {/* Equity Distribution Pie */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-blue-400" />
                                {t('equity')} Distribution
                            </h3>
                        </div>

                        <ResponsiveContainer width="100%" height={200}>
                            <RePieChart>
                                <Pie
                                    data={equityDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {equityDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={0} opacity={0.9} />
                                    ))}
                                </Pie>
                            </RePieChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {equityDistribution.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <div className="flex-1">
                                        <div className="text-[10px] text-gray-400">{item.name}</div>
                                        <div className="text-sm font-bold" style={{ color: item.color }}>{item.value}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCardWithSparkline({ label, value, sub, data, color }: any) {
    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl font-bold font-mono tracking-tight mb-1" style={{ color }}>{value}</div>
            <div className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors mb-3">{sub}</div>

            <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#gradient-${label})`} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

function StatCardWithCircular({ label, value, sub, percentage, color }: any) {
    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all cursor-pointer group">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl font-bold font-mono tracking-tight mb-1" style={{ color }}>{value}</div>
            <div className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors mb-3">{sub}</div>

            <ResponsiveContainer width="100%" height={50}>
                <RadialBarChart
                    cx="50%"
                    cy="100%"
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[{ value: percentage, fill: color }]}
                    startAngle={180}
                    endAngle={0}
                >
                    <RadialBar
                        background={{ fill: '#1f2937' }}
                        dataKey="value"
                        cornerRadius={5}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
        </div>
    )
}

function StrategyItem({ title, progress, status, color, locked }: any) {
    return (
        <div className={`relative ${locked ? 'opacity-50' : ''}`}>
            <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-gray-300">{title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${locked ? 'border-gray-700 bg-gray-800' : 'border-white/10 bg-white/5'} font-mono`}>
                    {status}
                </span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}
