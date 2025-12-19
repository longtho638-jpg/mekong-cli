'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, FileText, Eye, Heart, Share2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const contentPerformance = [
    { title: 'Ultimate Guide to...', views: 12500, engagement: 8.2, shares: 340, color: '#3b82f6' },
    { title: 'How to Build...', views: 8900, engagement: 6.5, shares: 180, color: '#8b5cf6' },
    { title: '10 Tips for...', views: 15200, engagement: 9.1, shares: 520, color: '#a855f7' },
    { title: 'Case Study:...', views: 6800, engagement: 5.2, shares: 95, color: '#10b981' },
    { title: 'Industry Report', views: 11000, engagement: 7.8, shares: 290, color: '#22c55e' },
];

export default function ContentMarketingPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');
    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
    };

    const totalViews = contentPerformance.reduce((sum, c) => sum + c.views, 0);
    const avgEngagement = (contentPerformance.reduce((sum, c) => sum + c.engagement, 0) / contentPerformance.length).toFixed(1);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono selection:bg-amber-500/30">
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,18,0)_2px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_2px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none" />

            <nav className="fixed top-0 w-full z-50 border-b border-amber-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold tracking-tighter">AGENCY OS</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 border border-amber-500/30 rounded text-amber-300 animate-pulse">
                            CONTENT
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-300 font-bold">{contentPerformance.length} Articles</span>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        {['en', 'vi', 'zh'].map((l) => (
                            <button
                                key={l}
                                onClick={() => switchLocale(l)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${locale === l ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-white'
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
                    <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3 text-amber-400">
                        📝 Content Marketing Dashboard
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse box-content border-4 border-amber-500/20" />
                    </h1>
                    <p className="text-gray-400 text-sm">Content Performance • Engagement Metrics • Distribution</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard label="Total Views" value={`${(totalViews / 1000).toFixed(1)}K`} icon={<Eye />} color="text-amber-400" />
                    <StatCard label="Avg Engagement" value={`${avgEngagement}%`} icon={<Heart />} color="text-pink-400" />
                    <StatCard label="Total Shares" value={contentPerformance.reduce((sum, c) => sum + c.shares, 0).toString()} icon={<Share2 />} color="text-blue-400" />
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Top Content Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={contentPerformance} layout="vertical">
                            <XAxis type="number" stroke="#6b7280" fontSize={10} />
                            <YAxis type="category" dataKey="title" stroke="#6b7280" fontSize={10} width={120} />
                            <Tooltip />
                            <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                                {contentPerformance.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
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
