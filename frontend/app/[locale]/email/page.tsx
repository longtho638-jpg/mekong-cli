'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Mail, Send, Users, TrendingUp, Target, MousePointerClick } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Email funnel stages
const emailFunnel = [
    { stage: 'Sent', count: 50000, rate: 100, color: '#3b82f6' },
    { stage: 'Delivered', count: 48500, rate: 97, color: '#8b5cf6' },
    { stage: 'Opened', count: 14550, rate: 30, color: '#a855f7' },
    { stage: 'Clicked', count: 2910, rate: 6, color: '#10b981' },
    { stage: 'Converted', count: 437, rate: 0.87, color: '#22c55e' },
];

// Campaign performance
const campaigns = [
    { name: 'Welcome Series', emails: 12500, opened: 5000, clicked: 750, conversions: 125, revenue: 25000 },
    { name: 'Product Launch', emails: 8000, opened: 2800, clicked: 560, conversions: 89, revenue: 35600 },
    { name: 'Re-engagement', emails: 15000, opened: 3000, clicked: 450, conversions: 45, revenue: 9000 },
    { name: 'Newsletter', emails: 25000, opened: 7500, clicked: 1125, conversions: 112, revenue: 11200 },
    { name: 'Abandoned Cart', emails: 5000, opened: 2000, clicked: 600, conversions: 120, revenue: 36000 },
];

// Monthly email metrics
const monthlyMetrics = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    sent: 40000 + i * 2000 + Math.random() * 5000,
    opened: 12000 + i * 800 + Math.random() * 2000,
    clicked: 2400 + i * 180 + Math.random() * 400,
}));

export default function EmailPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');

    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalSent = emailFunnel[0].count;
    const totalOpened = emailFunnel[2].count;
    const totalClicked = emailFunnel[3].count;
    const totalConverted = emailFunnel[4].count;
    const openRate = ((totalOpened / totalSent) * 100).toFixed(1);
    const clickRate = ((totalClicked / totalSent) * 100).toFixed(1);
    const conversionRate = ((totalConverted / totalSent) * 100).toFixed(2);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-teal-500/30 selection:text-teal-300">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />
            <div className="fixed top-[15%] right-[25%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(20,184,166,0.08)_0%,transparent_70%)] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-teal-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-teal-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-teal-500/20 border border-teal-500/30 rounded text-teal-300 animate-pulse">
                            EMAIL
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span className="opacity-50">/</span>
                        <span>Email Marketing</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                        <Mail className="w-3 h-3 text-teal-400" />
                        <span className="text-xs text-teal-300 font-bold">{openRate}% Open</span>
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
                                        ? 'bg-teal-500/20 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-teal-400">
                        📧 Email Marketing Dashboard
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse box-content border-4 border-teal-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm max-w-xl">
                        Funnel Analytics • Campaign Performance • Automation Metrics
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Open Rate" value={`${openRate}%`} icon={<Mail />} color="text-teal-400" />
                    <StatCard label="Click Rate" value={`${clickRate}%`} icon={<MousePointerClick />} color="text-blue-400" />
                    <StatCard label="Conversions" value={totalConverted.toString()} icon={<Target />} color="text-emerald-400" />
                    <StatCard label="Conv. Rate" value={`${conversionRate}%`} icon={<TrendingUp />} color="text-purple-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Email Funnel Waterfall */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Email Funnel Waterfall</h3>

                        <div className="space-y-3">
                            {emailFunnel.map((stage, i) => (
                                <div key={stage.stage}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                                            <span className="text-sm font-bold">{stage.stage}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold" style={{ color: stage.color }}>
                                                {stage.count.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2">({stage.rate}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-3">
                                        <div
                                            className="h-3 rounded-full transition-all"
                                            style={{
                                                width: `${stage.rate}%`,
                                                backgroundColor: stage.color,
                                            }}
                                        />
                                    </div>
                                    {i < emailFunnel.length - 1 && (
                                        <div className="text-xs text-gray-500 mt-1 text-right">
                                            ↓ {((emailFunnel[i + 1].count / stage.count) * 100).toFixed(1)}% conversion
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Email Metrics */}
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6">Monthly Email Metrics</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyMetrics}>
                                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                                <YAxis stroke="#6b7280" fontSize={10} />
                                <Tooltip
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        return (
                                            <div className="bg-black/90 border border-white/20 rounded p-2">
                                                <div className="text-xs text-gray-400">{payload[0].payload.month}</div>
                                                <div className="text-sm text-teal-400">Sent: {Math.round(payload[0].payload.sent).toLocaleString()}</div>
                                                <div className="text-sm text-blue-400">Opened: {Math.round(payload[0].payload.opened).toLocaleString()}</div>
                                                <div className="text-sm text-emerald-400">Clicked: {Math.round(payload[0].payload.clicked).toLocaleString()}</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Line type="monotone" dataKey="sent" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 3 }} />
                                <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                                <Line type="monotone" dataKey="clicked" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                            <div className="p-2 bg-teal-500/10 rounded text-center">
                                <div className="text-teal-400 font-bold">Sent</div>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded text-center">
                                <div className="text-blue-400 font-bold">Opened</div>
                            </div>
                            <div className="p-2 bg-emerald-500/10 rounded text-center">
                                <div className="text-emerald-400 font-bold">Clicked</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campaign Performance */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Campaign Performance</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400">Campaign</th>
                                    <th className="text-right p-3 text-gray-400">Sent</th>
                                    <th className="text-right p-3 text-gray-400">Opens</th>
                                    <th className="text-right p-3 text-gray-400">Clicks</th>
                                    <th className="text-right p-3 text-gray-400">Conv.</th>
                                    <th className="text-right p-3 text-gray-400">Revenue</th>
                                    <th className="text-right p-3 text-gray-400">ROI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((camp, i) => {
                                    const openRate = ((camp.opened / camp.emails) * 100).toFixed(1);
                                    const clickRate = ((camp.clicked / camp.emails) * 100).toFixed(1);
                                    const roi = ((camp.revenue / (camp.emails * 0.05)) * 100).toFixed(0); // Assuming $0.05 cost per email
                                    return (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-bold text-teal-300">{camp.name}</td>
                                            <td className="p-3 text-right font-mono">{camp.emails.toLocaleString()}</td>
                                            <td className="p-3 text-right">
                                                <div className="text-blue-400 font-bold">{camp.opened.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">{openRate}%</div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="text-emerald-400 font-bold">{camp.clicked.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">{clickRate}%</div>
                                            </td>
                                            <td className="p-3 text-right text-purple-400 font-bold">{camp.conversions}</td>
                                            <td className="p-3 text-right text-green-400 font-bold">${(camp.revenue / 1000).toFixed(1)}K</td>
                                            <td className="p-3 text-right">
                                                <span
                                                    className={`px-2 py-1 rounded font-bold ${parseInt(roi) >= 400
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : parseInt(roi) >= 200
                                                                ? 'bg-blue-500/20 text-blue-400'
                                                                : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}
                                                >
                                                    {roi}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
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
