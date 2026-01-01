'use client';
import { useTranslations } from 'next-intl';

import { usePathname, useRouter } from 'next/navigation';
import { Shield, Users, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const influencers = [
    { name: '@techinfluencer', followers: 125000, engagement: 4.5, roi: 320, color: '#3b82f6' },
    { name: '@marketingguru', followers: 89000, engagement: 6.2, roi: 450, color: '#8b5cf6' },
    { name: '@startuphero', followers: 210000, engagement: 3.8, roi: 280, color: '#10b981' },
    { name: '@bizleader', followers: 156000, engagement: 5.1, roi: 380, color: '#f59e0b' },
];

export default function InfluencerPage({ params: { locale } }: { params: { locale: string } }) {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-purple-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 border border-purple-500/30 rounded">INFLUENCER</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500'}`}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <h1 className="text-4xl font-bold mb-8 text-purple-400">🌟 Influencer Marketing</h1>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Total Reach</div>
                        <div className="text-2xl font-bold text-purple-400">580K</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Avg Engagement</div>
                        <div className="text-2xl font-bold text-emerald-400">4.9%</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Avg ROI</div>
                        <div className="text-2xl font-bold text-blue-400">358%</div>
                    </div>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Influencer ROI Performance</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={influencers} layout="vertical">
                            <XAxis type="number" stroke="#6b7280" fontSize={10} />
                            <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={10} width={120} />
                            <Tooltip />
                            <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                                {influencers.map((e, i) => (
                                    <Cell key={i} fill={e.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </main>
        </div>
    );
}
