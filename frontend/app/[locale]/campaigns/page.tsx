'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Target, TrendingUp, DollarSign, Users, Eye } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Mock campaign data
const campaigns = [
    { name: 'Q4 Product Launch', channel: 'Multi-Channel', budget: 50000, spent: 38500, leads: 1240, conversions: 89, roi: 3.2, status: 'active' },
    { name: 'SEO Content Push', channel: 'Organic', budget: 15000, spent: 12300, leads: 890, conversions: 124, roi: 4.8, status: 'active' },
    { name: 'Paid Social Blitz', channel: 'Social', budget: 30000, spent: 30000, leads: 2100, conversions: 156, roi: 2.1, status: 'completed' },
    { name: 'Email Nurture Series', channel: 'Email', budget: 8000, spent: 7200, leads: 450, conversions: 67, roi: 5.2, status: 'active' },
    { name: 'Partnership Campaign', channel: 'Partnerships', budget: 20000, spent: 18000, leads: 320, conversions: 45, roi: 2.8, status: 'active' },
];

const performanceByChannel = [
    { channel: 'Email', roi: 5.2, color: '#10b981' },
    { channel: 'SEO', roi: 4.8, color: '#3b82f6' },
    { channel: 'Multi', roi: 3.2, color: '#a855f7' },
    { channel: 'Partner', roi: 2.8, color: '#f59e0b' },
    { channel: 'Social', roi: 2.1, color: '#ef4444' },
];

const spendTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    budget: 30000 + Math.random() * 20000,
    actual: 25000 + Math.random() * 22000,
}));

const channelDistribution = [
    { name: 'Paid Social', value: 35, fill: '#3b82f6' },
    { name: 'SEO/Content', value: 28, fill: '#10b981' },
    { name: 'Email', value: 18, fill: '#a855f7' },
    { name: 'Partnerships', value: 12, fill: '#f59e0b' },
    { name: 'Events', value: 7, fill: '#ef4444' },
];

export default function CampaignsPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const avgROI = (campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(1);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-orange-500/30 selection:text-orange-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[12%] left-[25%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(249,115,22,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-orange-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-orange-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-orange-500/20 border border-orange-500/30 rounded text-orange-300 animate-pulse">
                            CAMPAIGNS
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>Marketing</span>
                        <span className="opacity-50">/</span>
                        <span className="text-white">Campaigns</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <Target className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-orange-300 font-bold">{campaigns.length} Active</span>
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
                                        ? 'bg-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-orange-400">
                        🎯 Campaign Dashboard
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse box-content border-4 border-orange-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Multi-Channel Performance • ROI Tracking • Budget Management
                    </p>
                </header>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <StatCard label="Total Budget" value={`$${(totalBudget / 1000).toFixed(0)}K`} icon={<DollarSign />} color="text-orange-400" />
                    <StatCard label="Total Spent" value={`$${(totalSpent / 1000).toFixed(0)}K`} icon={<TrendingUp />} color="text-blue-400" />
                    <StatCard label="Total Leads" value={totalLeads.toLocaleString()} icon={<Users />} color="text-purple-400" />
                    <StatCard label="Conversions" value={totalConversions.toString()} icon={<Target />} color="text-emerald-400" />
                    <StatCard label="Avg ROI" value={`${avgROI}x`} icon={<Eye />} color="text-yellow-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* ROI by Channel */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">ROI by Channel (Ranked)</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={performanceByChannel} layout="vertical">
                                <XAxis type="number" stroke="#6b7280" fontSize={10} />
                                <YAxis type="category" dataKey="channel" stroke="#6b7280" fontSize={12} width={60} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs text-gray-400">{payload[0].payload.channel}</div>
                                                <div className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
                                                    {payload[0].value}x ROI
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                                    {performanceByChannel.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Channel Budget Distribution */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Budget Allocation by Channel</h3>

                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={channelDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                            {channelDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.9} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex-1 space-y-2">
                                {channelDistribution.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                            <span className="text-sm">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: item.fill }}>
                                            {item.value}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spend Trend */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-6">Budget vs Actual Spend (12-Month Trend)</h3>

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
                                            <div className="text-sm text-orange-400">Budget: ${(payload[0].payload.budget / 1000).toFixed(0)}K</div>
                                            <div className="text-sm text-blue-400">Actual: ${(payload[0].payload.actual / 1000).toFixed(0)}K</div>
                                        </div>
                                    );
                                }}
                            />
                            <Line type="monotone" dataKey="budget" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
                            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                        <div className="p-2 bg-orange-500/10 rounded text-center">
                            <div className="text-orange-400 font-bold">Budgeted</div>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded text-center">
                            <div className="text-blue-400 font-bold">Actual Spend</div>
                        </div>
                    </div>
                </div>

                {/* Campaign Table */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Active Campaigns</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Campaign</th>
                                    <th className="text-left p-3 text-gray-400">Channel</th>
                                    <th className="text-right p-3 text-gray-400">Budget</th>
                                    <th className="text-right p-3 text-gray-400">Spent</th>
                                    <th className="text-right p-3 text-gray-400">Leads</th>
                                    <th className="text-right p-3 text-gray-400">Conv.</th>
                                    <th className="text-right p-3 text-gray-400">ROI</th>
                                    <th className="text-left p-3 text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-bold text-orange-300">{c.name}</td>
                                        <td className="p-3 text-gray-400">{c.channel}</td>
                                        <td className="p-3 text-right font-mono">${(c.budget / 1000).toFixed(0)}K</td>
                                        <td className="p-3 text-right font-mono">${(c.spent / 1000).toFixed(1)}K</td>
                                        <td className="p-3 text-right">{c.leads}</td>
                                        <td className="p-3 text-right text-emerald-400 font-bold">{c.conversions}</td>
                                        <td className="p-3 text-right">
                                            <span
                                                className={`px-2 py-1 rounded font-bold ${c.roi >= 4 ? 'bg-emerald-500/20 text-emerald-400' : c.roi >= 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}
                                            >
                                                {c.roi.toFixed(1)}x
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                                                    }`}
                                            >
                                                {c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
