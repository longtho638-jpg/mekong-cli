'use client';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { TrendingUp, Activity, DollarSign, Target, Loader2, Zap } from 'lucide-react';
import { AreaChart, Area, PieChart as RePieChart, Pie, Cell, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { useMRR, formatCurrency } from '@/hooks/useMRR';

// Portfolio mock data (would come from real portfolio API in production)
const portfolioHeatmapData = [
    { x: 3, y: 85, z: 2400, name: 'Startup A' },
    { x: 12, y: 62, z: 1800, name: 'Startup B' },
    { x: 18, y: 91, z: 4200, name: 'Startup C' },
    { x: 8, y: 78, z: 3100, name: 'Startup D' },
    { x: 24, y: 45, z: 850, name: 'Startup E' },
    { x: 6, y: 88, z: 5600, name: 'Startup F' },
];

const equityDistribution = [
    { name: 'Founders', value: 45, color: '#10b981' },
    { name: 'Angels', value: 15, color: '#3b82f6' },
    { name: 'Series A', value: 25, color: '#8b5cf6' },
    { name: 'Reserved', value: 15, color: '#6b7280' },
];

export default function PortfolioPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('VC');
    const { metrics, loading, isMock, growthRate } = useMRR(true, 60000);

    // Derive portfolio metrics from MRR data
    const totalInvested = metrics ? metrics.arr * 0.35 : 4200000; // Example: 35% of ARR
    const avgRunway = metrics ? Math.round(18.5 + (metrics.netNewMRR / 10000)) : 18.5;
    const irr = metrics ? Math.min(50, 30 + (growthRate * 0.8)) : 38.2;
    const portfolioValuation = metrics ? metrics.arr * 3 : 12400000; // 3x ARR multiple

    return (
        <MD3AppShell title="💎 Portfolio Galaxy" subtitle="Real-time monitoring of deployed capital and strategic unlock status">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">{t('invested')}</div>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatCurrency(totalInvested)}
                    </div>
                    <div className="text-xs text-gray-500">{isMock ? 'Demo' : '+12% YTD'}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">{t('runway')}</div>
                        <Activity className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{avgRunway}</div>
                    <div className="text-xs text-gray-500">Avg months</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">{t('irr')}</div>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{irr.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Top quartile</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">{t('valuation')}</div>
                        <Target className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatCurrency(portfolioValuation)}
                    </div>
                    <div className="text-xs text-emerald-400">{growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <MD3Surface shape="extra-large" className="auto-safe lg:col-span-2">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Portfolio Heatmap
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <ZAxis type="number" dataKey="z" range={[200, 2000]} />
                            <Scatter name="Startups" data={portfolioHeatmapData}>
                                {portfolioHeatmapData.map((entry, i) => (
                                    <Cell key={i} fill={entry.y > 70 ? '#10b981' : entry.y > 50 ? '#eab308' : '#ef4444'} opacity={0.7} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-6 gap-2 mt-4">
                        {portfolioHeatmapData.map((s, i) => (
                            <div key={i} className="text-center p-2 bg-white/5 rounded">
                                <div className="text-[10px] text-gray-400">{s.name}</div>
                                <div className="text-sm font-bold text-emerald-400">{s.y}%</div>
                            </div>
                        ))}
                    </div>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Equity Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <RePieChart>
                            <Pie data={equityDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                {equityDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                        </RePieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                        {equityDistribution.map(e => (
                            <div key={e.name} className="flex justify-between p-2 bg-white/5 rounded">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                                    <span className="text-sm">{e.name}</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: e.color }}>{e.value}%</span>
                            </div>
                        ))}
                    </div>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">MRR Growth Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={metrics?.growth || []}>
                        <Area type="monotone" dataKey="mrr" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-8 mt-4 text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span>MRR</span></div>
                    {isMock && <span className="text-yellow-400">Demo Data</span>}
                </div>
            </MD3Surface>
        </MD3AppShell>
    );
}
