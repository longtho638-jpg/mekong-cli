'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Search, TrendingUp, BarChart3, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// SERP position tracking data
const serpPositions = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    avgPosition: 15 - i * 0.8 + Math.random() * 2,
    keywords: 45 + i * 3,
}));

// Top performing keywords
const topKeywords = [
    { keyword: 'agency management software', position: 3, volume: 8900, traffic: 1240, difficulty: 68 },
    { keyword: 'venture studio platform', position: 5, volume: 2400, traffic: 520, difficulty: 72 },
    { keyword: 'startup operations tool', position: 7, volume: 3600, traffic: 380, difficulty: 58 },
    { keyword: 'investment portfolio tracker', position: 12, volume: 5200, traffic: 280, difficulty: 65 },
    { keyword: 'marketing automation hub', position: 18, volume: 6800, traffic: 150, difficulty: 75 },
];

// Organic traffic trend
const organicTraffic = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    sessions: 2500 + i * 350 + Math.random() * 500,
    pageviews: 8000 + i * 1200 + Math.random() * 800,
}));

// Backlink profile
const backlinkData = [
    { source: 'Product Hunt', count: 145, authority: 92 },
    { source: 'TechCrunch', count: 12, authority: 95 },
    { source: 'Y Combinator', count: 28, authority: 94 },
    { source: 'Indie Hackers', count: 67, authority: 78 },
    { source: 'Medium', count: 89, authority: 85 },
];

export default function SEOPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const avgPosition = Math.round(serpPositions[serpPositions.length - 1].avgPosition);
    const totalKeywords = serpPositions[serpPositions.length - 1].keywords;
    const totalTraffic = Math.round(organicTraffic[organicTraffic.length - 1].sessions);
    const totalBacklinks = backlinkData.reduce((sum, b) => sum + b.count, 0);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-indigo-500/30 selection:text-indigo-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[20%] left-[35%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-indigo-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-indigo-500/20 border border-indigo-500/30 rounded text-indigo-300 animate-pulse">
                            SEO
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>Search Engine Optimization</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                        <Search className="w-3 h-3 text-indigo-400" />
                        <span className="text-xs text-indigo-300 font-bold">Pos #{avgPosition}</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                        <Command className="w-3 h-3" />
                        <span>Search...</span>
                        <span className="bg-white/10 px-1 rounded text-[10px]">⌘K</span>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        {['en', 'vi', 'zh'].map((l) => (
                            <button
                                key={l}
                                onClick={() => switchLocale(l)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${locale === l
                                        ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
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
                <header className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-indigo-400">
                        🔍 SEO Performance Dashboard
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse box-content border-4 border-indigo-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        SERP Tracking • Keyword Rankings • Organic Growth
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Avg Position" value={`#${avgPosition}`} icon={<Target />} color="text-indigo-400" />
                    <StatCard label="Keywords Ranked" value={totalKeywords.toString()} icon={<BarChart3 />} color="text-blue-400" />
                    <StatCard label="Organic Traffic" value={totalTraffic.toLocaleString()} icon={<TrendingUp />} color="text-emerald-400" />
                    <StatCard label="Backlinks" value={totalBacklinks.toString()} icon={<Search />} color="text-purple-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* SERP Position Trend */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Average SERP Position Trend</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={serpPositions}>
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                                <YAxis reversed domain={[1, 20]} stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs text-gray-400">{payload[0].payload.month}</div>
                                                <div className="text-sm text-indigo-400">Position: #{Math.round(payload[0].value as number)}</div>
                                                <div className="text-xs text-blue-400">{payload[0].payload.keywords} keywords</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line type="monotone" dataKey="avgPosition" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="text-center mt-4">
                            <div className="text-xs text-gray-500 mb-1">Lower is better</div>
                            <div className="text-3xl font-bold text-indigo-400">#{avgPosition}</div>
                            <div className="text-xs text-emerald-400 mt-1">↑ {Math.abs(15 - avgPosition).toFixed(1)} positions improved</div>
                        </div>
                    </div>

                    {/* Organic Traffic Growth */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Organic Traffic Growth</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={organicTraffic}>
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs text-gray-400">{payload[0].payload.month}</div>
                                                <div className="text-sm text-emerald-400">Sessions: {Math.round(payload[0].payload.sessions).toLocaleString()}</div>
                                                <div className="text-sm text-blue-400">Pageviews: {Math.round(payload[0].payload.pageviews).toLocaleString()}</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                                <Line type="monotone" dataKey="pageviews" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                            <div className="p-2 bg-emerald-500/10 rounded text-center">
                                <div className="text-emerald-400 font-bold">Sessions</div>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded text-center">
                                <div className="text-blue-400 font-bold">Pageviews</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Performing Keywords */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-6">Top Performing Keywords</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Keyword</th>
                                    <th className="text-center p-3 text-gray-400">Position</th>
                                    <th className="text-right p-3 text-gray-400">Search Volume</th>
                                    <th className="text-right p-3 text-gray-400">Traffic</th>
                                    <th className="text-right p-3 text-gray-400">Difficulty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topKeywords.map((kw, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-bold text-indigo-300">{kw.keyword}</td>
                                        <td className="text-center p-3">
                                            <span
                                                className={`px-2 py-1 rounded font-bold ${kw.position <= 3 ? 'bg-emerald-500/20 text-emerald-400' : kw.position <= 10 ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}
                                            >
                                                #{kw.position}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-mono text-gray-400">{kw.volume.toLocaleString()}</td>
                                        <td className="p-3 text-right text-emerald-400 font-bold">{kw.traffic}</td>
                                        <td className="p-3 text-right">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${kw.difficulty >= 70 ? 'bg-red-500/20 text-red-400' : kw.difficulty >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                                                    }`}
                                            >
                                                {kw.difficulty}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Backlink Profile */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Backlink Profile (Top Sources)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {backlinkData.map((source) => (
                            <div key={source.source} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-indigo-500/30 transition-colors">
                                <div className="text-xs text-gray-500 mb-1">{source.source}</div>
                                <div className="text-2xl font-bold text-indigo-400 mb-1">{source.count}</div>
                                <div className="text-xs text-gray-400">DA: {source.authority}</div>
                                <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                                    <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${source.authority}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
                <div className={color}>{icon}</div>
            </div>
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}
