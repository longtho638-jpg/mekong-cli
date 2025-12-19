'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, TrendingUp, Target, DollarSign, Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Channel performance data
const channelROI = [
    { channel: 'Email', roi: 520, spend: 12000, revenue: 62400, color: '#10b981' },
    { channel: 'SEO', roi: 480, spend: 18000, revenue: 86400, color: '#3b82f6' },
    { channel: 'Content', roi: 380, spend: 15000, revenue: 57000, color: '#a855f7' },
    { channel: 'Paid Social', roi: 240, spend: 35000, revenue: 84000, color: '#f59e0b' },
    { channel: 'PPC', roi: 210, spend: 28000, revenue: 58800, color: '#ef4444' },
];

// Marketing funnel
const marketingFunnel = [
    { stage: 'Awareness', value: 100000, color: '#3b82f6' },
    { stage: 'Interest', value: 35000, color: '#8b5cf6' },
    { stage: 'Consideration', value: 12000, color: '#a855f7' },
    { stage: 'Intent', value: 4200, color: '#10b981' },
    { stage: 'Purchase', value: 1680, color: '#22c55e' },
];

// Monthly marketing spend
const spendTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    organic: 15000 + Math.random() * 5000,
    paid: 25000 + Math.random() * 10000,
}));

export default function MarketingPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalSpend = channelROI.reduce((sum, c) => sum + c.spend, 0);
    const totalRevenue = channelROI.reduce((sum, c) => sum + c.revenue, 0);
    const blendedROI = ((totalRevenue / totalSpend) * 100).toFixed(0);
    const conversionRate = ((marketingFunnel[4].value / marketingFunnel[0].value) * 100).toFixed(2);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-pink-500/30 selection:text-pink-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[12%] right-[30%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(236,72,153,0.08)_0%,transparent_70%)] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-pink-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-pink-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-pink-500/20 border border-pink-500/30 rounded text-pink-300 animate-pulse">
                            MARKETING
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>Marketing Hub</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                        <BarChart3 className="w-3 h-3 text-pink-400" />
                        <span className="text-xs text-pink-300 font-bold">{blendedROI}% ROI</span>
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
                                        ? 'bg-pink-500/20 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-pink-400">
                        📢 Marketing Command Center
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse box-content border-4 border-pink-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Multi-Channel Attribution • ROI Optimization • Funnel Analytics
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Spend" value={`$${(totalSpend / 1000).toFixed(0)}K`} icon={<DollarSign />} color="text-pink-400" />
                    <StatCard label="Revenue" value={`$${(totalRevenue / 1000).toFixed(0)}K`} icon={<TrendingUp />} color="text-green-400" />
                    <StatCard label="Blended ROI" value={`${blendedROI}%`} icon={<Target />} color="text-purple-400" />
                    <StatCard label="Conversion" value={`${conversionRate}%`} icon={<Users />} color="text-blue-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* ROI by Channel */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">ROI by Marketing Channel</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={channelROI} layout="vertical">
                                <XAxis type="number" stroke="#6b7280" fontSize={10} />
                                <YAxis type="category" dataKey="channel" stroke="#6b7280" fontSize={12} width={80} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs font-bold mb-1">{data.channel}</div>
                                                <div className="text-sm" style={{ color: data.color }}>
                                                    ROI: {data.roi}%
                                                </div>
                                                <div className="text-xs text-gray-400">Spend: ${(data.spend / 1000).toFixed(0)}K</div>
                                                <div className="text-xs text-green-400">Revenue: ${(data.revenue / 1000).toFixed(0)}K</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                                    {channelROI.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Marketing Spend Trend */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Marketing Spend Trend (12 Months)</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={spendTrend}>
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs text-gray-400">{payload[0].payload.month}</div>
                                                <div className="text-sm text-green-400">Organic: ${(payload[0].payload.organic / 1000).toFixed(0)}K</div>
                                                <div className="text-sm text-pink-400">Paid: ${(payload[0].payload.paid / 1000).toFixed(0)}K</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line type="monotone" dataKey="organic" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                                <Line type="monotone" dataKey="paid" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                            <div className="p-2 bg-green-500/10 rounded text-center">
                                <div className="text-green-400 font-bold">Organic</div>
                            </div>
                            <div className="p-2 bg-pink-500/10 rounded text-center">
                                <div className="text-pink-400 font-bold">Paid</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Marketing Funnel */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Marketing Funnel (Full Journey)</h3>

                    <div className="grid grid-cols-5 gap-4">
                        {marketingFunnel.map((stage, i) => (
                            <div key={stage.stage} className="text-center">
                                <div
                                    className="h-32 rounded-lg flex flex-col items-center justify-center mb-2 border-2 transition-all hover:scale-105"
                                    style={{
                                        backgroundColor: `${stage.color}20`,
                                        borderColor: stage.color,
                                    }}
                                >
                                    <div className="text-3xl font-bold mb-1" style={{ color: stage.color }}>
                                        {(stage.value / 1000).toFixed(1)}K
                                    </div>
                                    <div className="text-xs text-gray-400">{stage.stage}</div>
                                </div>
                                {i < marketingFunnel.length - 1 && (
                                    <div className="text-xs text-gray-500">
                                        {((marketingFunnel[i + 1].value / stage.value) * 100).toFixed(1)}% →
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 text-center">
                        <div className="text-sm text-gray-400">Overall Conversion Rate</div>
                        <div className="text-3xl font-bold text-pink-400">{conversionRate}%</div>
                        <div className="text-xs text-gray-500 mt-1">From Awareness to Purchase</div>
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
