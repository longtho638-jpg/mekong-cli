'use client';

import { DollarSign, TrendingUp, BarChart3, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

// Pricing Metrics
const pricingMetrics = [
    { label: 'Avg Market Rate', value: '$125/hr', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$8', direction: 'up' as const } },
    { label: 'Your Rate', value: '$140/hr', icon: <TrendingUp className="w-5 h-5" />, color: '#3b82f6', trend: { value: 'Top 25%', direction: 'up' as const } },
    { label: 'Rate Floor', value: '$85/hr', icon: <Target className="w-5 h-5" />, color: '#f59e0b', trend: { value: 'Standard', direction: 'up' as const } },
    { label: 'Submissions', value: '89', icon: <BarChart3 className="w-5 h-5" />, color: '#a855f7', trend: { value: '+12', direction: 'up' as const } },
];

// Rate Distribution
const rateDistribution = [
    { name: '$75-100', value: 15, color: '#22c55e' },
    { name: '$100-125', value: 35, color: '#3b82f6' },
    { name: '$125-150', value: 28, color: '#a855f7' },
    { name: '$150-200', value: 18, color: '#f59e0b' },
    { name: '$200+', value: 4, color: '#ef4444' },
];

// Rate Trends
const rateTrends = [
    { name: 'Jul', value: 115 }, { name: 'Aug', value: 118 }, { name: 'Sep', value: 120 },
    { name: 'Oct', value: 122 }, { name: 'Nov', value: 124 }, { name: 'Dec', value: 125 },
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

// Service benchmarks
const serviceBenchmarks = [
    { service: 'Web Development', floor: '$85/hr', avg: '$125/hr', top: '$200/hr', yourRate: '$140/hr', position: 'top25' },
    { service: 'UI/UX Design', floor: '$75/hr', avg: '$110/hr', top: '$175/hr', yourRate: '$120/hr', position: 'top25' },
    { service: 'SEO Services', floor: '$65/hr', avg: '$95/hr', top: '$150/hr', yourRate: '$100/hr', position: 'avg' },
    { service: 'Content Writing', floor: '$45/hr', avg: '$70/hr', top: '$120/hr', yourRate: '$80/hr', position: 'top25' },
    { service: 'Video Production', floor: '$100/hr', avg: '$150/hr', top: '$250/hr', yourRate: '$160/hr', position: 'avg' },
];

export default function PricingPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard
            title="Pricing Intel"
            subtitle="Market Benchmarks • Rate Floors • Collective Intelligence"
            icon="💰"
            color="green"
            statusLabel="Avg Rate"
            statusValue="$125/hr"
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
                </h3>

                <div className="relative h-20 bg-white/5 rounded-lg overflow-hidden">
                    {/* Scale */}
                    <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500" />

                    {/* Markers */}
                    <div className="absolute bottom-4 left-[15%] text-center">
                        <div className="text-xs text-gray-500">Floor</div>
                        <div className="text-sm font-bold text-yellow-400">$85</div>
                    </div>
                    <div className="absolute bottom-4 left-[50%] -translate-x-1/2 text-center">
                        <div className="text-xs text-gray-500">Average</div>
                        <div className="text-sm font-bold text-green-400">$125</div>
                    </div>
                    <div className="absolute bottom-4 left-[75%] text-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1 animate-pulse" />
                        <div className="text-xs text-blue-400 font-bold">YOU</div>
                        <div className="text-lg font-bold text-blue-400">$140</div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-300">
                            You're in the <strong>Top 25%</strong> of market rates. Keep it up! 🎯
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
                            {serviceBenchmarks.map((svc) => (
                                <tr key={svc.service} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 font-medium text-white">{svc.service}</td>
                                    <td className="py-3 text-right text-yellow-400">{svc.floor}</td>
                                    <td className="py-3 text-right text-gray-400">{svc.avg}</td>
                                    <td className="py-3 text-right text-green-400">{svc.top}</td>
                                    <td className="py-3 text-right text-blue-400 font-bold">{svc.yourRate}</td>
                                    <td className="py-3 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${svc.position === 'top25' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {svc.position === 'top25' ? 'Top 25%' : 'Average'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DepartmentDashboard>
    );
}
