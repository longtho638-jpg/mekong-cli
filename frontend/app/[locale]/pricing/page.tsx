'use client';

import { DollarSign, TrendingUp, BarChart3, Target, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';
import { usePricingBenchmarks } from '@/hooks/useBlueOcean';

export default function PricingPage({ params: { locale } }: { params: { locale: string } }) {
    const { data: pricing, isLoading } = usePricingBenchmarks();

    const avgRate = pricing?.avg_rate || 125;
    const yourRate = pricing?.your_rate || 140;
    const rateFloor = pricing?.rate_floor || 85;
    const position = pricing?.position || 'top_25';

    // Build metrics from API
    const pricingMetrics = [
        { label: 'Avg Market Rate', value: `$${avgRate}/hr`, icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$8', direction: 'up' as const } },
        { label: 'Your Rate', value: `$${yourRate}/hr`, icon: <TrendingUp className="w-5 h-5" />, color: '#3b82f6', trend: { value: 'Top 25%', direction: 'up' as const } },
        { label: 'Rate Floor', value: `$${rateFloor}/hr`, icon: <Target className="w-5 h-5" />, color: '#f59e0b', trend: { value: 'Standard', direction: 'up' as const } },
        { label: 'Submissions', value: '89', icon: <BarChart3 className="w-5 h-5" />, color: '#a855f7', trend: { value: '+12', direction: 'up' as const } },
    ];

    // Rate Distribution from API
    const rateDistribution = pricing?.rate_distribution.map(r => ({
        name: r.range,
        value: r.pct,
        color: r.range.includes('$75') ? '#22c55e' :
            r.range.includes('$100') ? '#3b82f6' :
                r.range.includes('$125') ? '#a855f7' :
                    r.range.includes('$150') ? '#f59e0b' : '#ef4444'
    })) || [
            { name: '$75-100', value: 15, color: '#22c55e' },
            { name: '$100-125', value: 35, color: '#3b82f6' },
            { name: '$125-150', value: 28, color: '#a855f7' },
            { name: '$150-200', value: 18, color: '#f59e0b' },
            { name: '$200+', value: 4, color: '#ef4444' },
        ];

    // Rate Trends (static for now)
    const rateTrends = [
        { name: 'Jul', value: 115 }, { name: 'Aug', value: 118 }, { name: 'Sep', value: 120 },
        { name: 'Oct', value: 122 }, { name: 'Nov', value: 124 }, { name: 'Dec', value: avgRate },
    ];

    const pricingCharts = [
        { type: 'bar' as const, title: 'Rate Distribution ($/hr)', data: rateDistribution },
        { type: 'area' as const, title: 'Market Rate Trend', data: rateTrends },
    ];

    const pricingActions = [
        { icon: '📊', label: 'Benchmark', onClick: () => console.log('Benchmark') },
        { icon: '📝', label: 'Submit Rate', onClick: () => console.log('Submit') },
        { icon: '🎯', label: 'My Position', onClick: () => console.log('Position') },
        { icon: '📈', label: 'Trends', onClick: () => console.log('Trends') },
        { icon: '🏷️', label: 'Services', onClick: () => console.log('Services') },
        { icon: '⚙️', label: 'Settings', onClick: () => console.log('Settings') },
    ];

    // Service benchmarks from API
    const serviceBenchmarks = pricing?.services || [
        { name: 'Web Development', floor: 85, avg: 125, top: 200, your: 140 },
        { name: 'UI/UX Design', floor: 75, avg: 110, top: 175, your: 120 },
        { name: 'SEO Services', floor: 65, avg: 95, top: 150, your: 100 },
        { name: 'Content Writing', floor: 45, avg: 70, top: 120, your: 80 },
        { name: 'Video Production', floor: 100, avg: 150, top: 250, your: 160 },
    ];

    // Calculate position percentage
    const yourPosition = ((yourRate - rateFloor) / (200 - rateFloor)) * 100;

    return (
        <DepartmentDashboard
            title="Pricing Intel"
            subtitle="Market Benchmarks • Rate Floors • Collective Intelligence"
            icon="💰"
            color="green"
            statusLabel="Avg Rate"
            statusValue={isLoading ? '...' : `$${avgRate}/hr`}
            metrics={pricingMetrics}
            charts={pricingCharts}
            quickActions={pricingActions}
            locale={locale}
        >
            {/* Your Market Position */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    Your Market Position
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
                </h3>

                <div className="relative h-20 bg-white/5 rounded-lg overflow-hidden">
                    {/* Scale */}
                    <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500" />

                    {/* Markers */}
                    <div className="absolute bottom-4 left-[15%] text-center">
                        <div className="text-xs text-gray-500">Floor</div>
                        <div className="text-sm font-bold text-yellow-400">${rateFloor}</div>
                    </div>
                    <div className="absolute bottom-4 left-[50%] -translate-x-1/2 text-center">
                        <div className="text-xs text-gray-500">Average</div>
                        <div className="text-sm font-bold text-green-400">${avgRate}</div>
                    </div>
                    <div className="absolute bottom-4" style={{ left: `${Math.min(90, 15 + yourPosition * 0.75)}%` }}>
                        <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1 animate-pulse" />
                        <div className="text-xs text-blue-400 font-bold">YOU</div>
                        <div className="text-lg font-bold text-blue-400">${yourRate}</div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-300">
                            You're in the <strong>{position === 'top_25' ? 'Top 25%' : 'Average'}</strong> of market rates. Keep it up! 🎯
                        </span>
                    </div>
                </div>
            </div>

            {/* Service Benchmarks */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Service Rate Benchmarks
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 text-gray-400 font-normal">Service</th>
                                <th className="text-right py-3 text-gray-400 font-normal">Floor</th>
                                <th className="text-right py-3 text-gray-400 font-normal">Avg</th>
                                <th className="text-right py-3 text-gray-400 font-normal">Top 10%</th>
                                <th className="text-right py-3 text-gray-400 font-normal">Your Rate</th>
                                <th className="text-right py-3 text-gray-400 font-normal">Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serviceBenchmarks.map((svc) => {
                                const isTop25 = svc.your >= svc.avg;
                                return (
                                    <tr key={svc.name} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 font-medium text-white">{svc.name}</td>
                                        <td className="py-3 text-right text-yellow-400">${svc.floor}/hr</td>
                                        <td className="py-3 text-right text-gray-400">${svc.avg}/hr</td>
                                        <td className="py-3 text-right text-green-400">${svc.top}/hr</td>
                                        <td className="py-3 text-right text-blue-400 font-bold">${svc.your}/hr</td>
                                        <td className="py-3 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${isTop25 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {isTop25 ? 'Top 25%' : 'Average'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </DepartmentDashboard>
    );
}
