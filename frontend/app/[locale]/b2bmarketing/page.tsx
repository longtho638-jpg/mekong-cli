'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Command, Briefcase, TrendingUp, Users, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const leadScoring = [
    { score: '90-100', count: 45, color: '#22c55e' },
    { score: '80-89', count: 78, color: '#10b981' },
    { score: '70-79', count: 124, color: '#3b82f6' },
    { score: '60-69', count: 89, color: '#f59e0b' },
    { score: '<60', count: 34, color: '#ef4444' },
];

export default function B2BMarketingPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Common');
    const pathname = usePathname();
    const router = useRouter();

    const switchLocale = (newLocale: string) => {
        router.push(pathname.replace(`/${locale}`, `/${newLocale}`));
    };

    const totalLeads = leadScoring.reduce((s, l) => s + l.count, 0);

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-blue-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 border border-blue-500/30 rounded">B2B</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => switchLocale(l)} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500'}`}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <h1 className="text-4xl font-bold mb-8 text-blue-400">🏢 B2B Marketing</h1>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Total Leads</div>
                        <div className="text-2xl font-bold text-blue-400">{totalLeads}</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">High Quality</div>
                        <div className="text-2xl font-bold text-emerald-400">{leadScoring[0].count + leadScoring[1].count}</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">MQL Rate</div>
                        <div className="text-2xl font-bold text-purple-400">32%</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Conversion</div>
                        <div className="text-2xl font-bold text-yellow-400">8.5%</div>
                    </div>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Lead Scoring Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={leadScoring}>
                            <XAxis dataKey="score" stroke="#6b7280" fontSize={10} />
                            <YAxis stroke="#6b7280" fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {leadScoring.map((entry, i) => (
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
