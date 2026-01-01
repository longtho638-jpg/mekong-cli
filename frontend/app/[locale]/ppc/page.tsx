'use client';
import { useTranslations } from 'next-intl';

import { usePathname, useRouter } from 'next/navigation';
import { Shield, TrendingUp, MousePointerClick, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const keywords = [
    { keyword: 'agency software', cpc: 12.5, conversions: 145, color: '#3b82f6' },
    { keyword: 'marketing platform', cpc: 8.2, conversions: 89, color: '#8b5cf6' },
    { keyword: 'crm solution', cpc: 15.0, conversions: 234, color: '#10b981' },
    { keyword: 'sales automation', cpc: 11.3, conversions: 178, color: '#f59e0b' },
];

export default function PPCPage({ params: { locale } }: { params: { locale: string } }) {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-orange-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-orange-400">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-orange-500/20 border border-orange-500/30 rounded">PPC</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500'}`}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <h1 className="text-4xl font-bold mb-8 text-orange-400">💰 PPC Campaigns</h1>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Avg CPC</div>
                        <div className="text-2xl font-bold text-orange-400">$11.75</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Total Conv.</div>
                        <div className="text-2xl font-bold text-emerald-400">646</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">CTR</div>
                        <div className="text-2xl font-bold text-blue-400">3.8%</div>
                    </div>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Top Keywords by Conversions</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={keywords} layout="vertical">
                            <XAxis type="number" stroke="#6b7280" fontSize={10} />
                            <YAxis type="category" dataKey="keyword" stroke="#6b7280" fontSize={10} width={120} />
                            <Tooltip />
                            <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
                                {keywords.map((e, i) => (
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
