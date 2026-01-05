'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';

import { Search, TrendingUp, BarChart3, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const serpPositions = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    avgPosition: 15 - i * 0.8 + Math.random() * 2,
    keywords: 45 + i * 3,
}));

const organicTraffic = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    sessions: 2500 + i * 350 + Math.random() * 500,
    pageviews: 8000 + i * 1200 + Math.random() * 800,
}));

const topKeywords = [
    { keyword: 'agency management software', position: 3, volume: 8900, traffic: 1240, difficulty: 68 },
    { keyword: 'venture studio platform', position: 5, volume: 2400, traffic: 520, difficulty: 72 },
    { keyword: 'startup operations tool', position: 7, volume: 3600, traffic: 380, difficulty: 58 },
    { keyword: 'investment portfolio tracker', position: 12, volume: 5200, traffic: 280, difficulty: 65 },
    { keyword: 'marketing automation hub', position: 18, volume: 6800, traffic: 150, difficulty: 75 },
];

const backlinkData = [
    { source: 'Product Hunt', count: 145, authority: 92 },
    { source: 'TechCrunch', count: 12, authority: 95 },
    { source: 'Y Combinator', count: 28, authority: 94 },
    { source: 'Indie Hackers', count: 67, authority: 78 },
    { source: 'Medium', count: 89, authority: 85 },
];

export default function SEOPage() {
    const { analytics } = useAnalytics();
    const avgPosition = Math.max(1, 20 - analytics.activeClients * 2);
    const totalKeywords = analytics.totalProjects * 10 + analytics.activeClients * 5;
    const totalTraffic = analytics.activeClients * 500 + analytics.totalProjects * 200;
    const totalBacklinks = analytics.paidInvoices * 5 + analytics.activeClients * 10;

    return (
        <MD3AppShell title="🔍 SEO Performance" subtitle="SERP Tracking • Keyword Rankings • Organic Growth">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Avg Position</div>
                        <Target className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-bold text-indigo-400">#{avgPosition}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Keywords Ranked</div>
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{totalKeywords}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Organic Traffic</div>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{totalTraffic.toLocaleString()}</div>
                </MD3Surface>
                <MD3Surface shape="large" className="auto-safe">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Backlinks</div>
                        <Search className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-400">{totalBacklinks}</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">SERP Position Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={serpPositions}>
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                            <YAxis reversed domain={[1, 20]} stroke="#6b7280" fontSize={10} />
                            <Tooltip />
                            <Line type="monotone" dataKey="avgPosition" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe">
                    <h3 className="text-lg font-bold mb-6">Organic Traffic Growth</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={organicTraffic}>
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                            <YAxis stroke="#6b7280" fontSize={10} />
                            <Tooltip />
                            <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="pageviews" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </MD3Surface>
            </div>

            <MD3Surface shape="extra-large" className="auto-safe mb-6">
                <h3 className="text-lg font-bold mb-6">Top Keywords</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left p-3 text-gray-400">Keyword</th>
                                <th className="text-center p-3 text-gray-400">Position</th>
                                <th className="text-right p-3 text-gray-400">Volume</th>
                                <th className="text-right p-3 text-gray-400">Traffic</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topKeywords.map((kw, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-3 font-bold text-indigo-300">{kw.keyword}</td>
                                    <td className="text-center p-3">
                                        <span className={`px-2 py-1 rounded font-bold ${kw.position <= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            #{kw.position}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right text-gray-400">{kw.volume.toLocaleString()}</td>
                                    <td className="p-3 text-right text-emerald-400 font-bold">{kw.traffic}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </MD3Surface>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h3 className="text-lg font-bold mb-6">Backlink Sources</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {backlinkData.map((source) => (
                        <div key={source.source} className="p-4 bg-white/5 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">{source.source}</div>
                            <div className="text-2xl font-bold text-indigo-400 mb-1">{source.count}</div>
                            <div className="text-xs text-gray-400">DA: {source.authority}</div>
                        </div>
                    ))}
                </div>
            </MD3Surface>
        </MD3AppShell>
    );
}
