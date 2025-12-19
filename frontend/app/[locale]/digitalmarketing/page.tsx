'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, TrendingUp, DollarSign, Users, MousePointerClick, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const channelPerformance = [
    { channel: 'Search Ads', spend: 45000, conversions: 890, roas: 3.8, color: '#3b82f6' },
    { channel: 'Display', spend: 25000, conversions: 320, roas: 2.1, color: '#8b5cf6' },
    { channel: 'Social Ads', spend: 38000, conversions: 720, roas: 3.2, color: '#a855f7' },
    { channel: 'Video', spend: 32000, conversions: 580, roas: 2.9, color: '#10b981' },
    { channel: 'Shopping', spend: 28000, conversions: 650, roas: 4.2, color: '#22c55e' },
];

const budgetAllocation = [
    { channel: 'Search', value: 35, fill: '#3b82f6' },
    { channel: 'Social', value: 28, fill: '#a855f7' },
    { channel: 'Display', fill: '#8b5cf6', value: 20 },
    { channel: 'Video', value: 12, fill: '#10b981' },
    { channel: 'Other', value: 5, fill: '#6b7280' },
];

const monthlyROI = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    roi: 250 + i * 25 + Math.random() * 50,
}));

export default function DigitalMarketingPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');
    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalSpend = channelPerformance.reduce((sum, c) => sum + c.spend, 0);
    const totalConversions = channelPerformance.reduce((sum, c) => sum + c.conversions, 0);
    const avgROAS = (channelPerformance.reduce((sum, c) => sum + c.roas, 0) / channelPerformance.length).toFixed(1);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-violet-500/30">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-violet-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-violet-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-violet-500/20 border border-violet-500/30 rounded text-violet-300 animate-pulse">
                            DIGITAL
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                        <Target className="w-3 h-3 text-violet-400" />
                        <span className="text-xs text-violet-300 font-bold">{avgROAS}x ROAS</span>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        {['en', 'vi', 'zh'].map((l) => (
                            <button
                                key={l}
                                onClick={() => switchLocale(l)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${locale === l ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-white'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-violet-400">
                        📊 Digital Marketing Dashboard
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse box-content border-4 border-violet-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm">Multi-Channel Attribution • ROAS Optimization • Budget Allocation</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Spend" value={`$${(totalSpend / 1000).toFixed(0)}K`} icon={<DollarSign />} color="text-violet-400" />
                    <StatCard label="Conversions" value={totalConversions.toLocaleString()} icon={<MousePointerClick />} color="text-blue-400" />
                    <StatCard label="Avg ROAS" value={`${avgROAS}x`} icon={<Target />} color="text-emerald-400" />
                    <StatCard label="Channels" value="5" icon={<TrendingUp />} color="text-purple-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Channel Performance</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={channelPerformance} layout="vertical">
                                <XAxis type="number" stroke="#6b7280" fontSize={10} />
                                <YAxis type="category" dataKey="channel" stroke="#6b7280" fontSize={12} width={80} />
                                <Tooltip />
                                <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
                                    {channelPerformance.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Budget Allocation</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={budgetAllocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                    {budgetAllocation.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">ROI Trend (12 Months)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyROI}>
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                            <YAxis stroke="#6b7280" fontSize={10} />
                            <Line type="monotone" dataKey="roi" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
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
