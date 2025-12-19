'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Newspaper, TrendingUp } from 'lucide-react';

export default function PRPage({ params: { locale } }: { params: { locale: string } }) {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-cyan-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 border border-cyan-500/30 rounded">PR</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                    ))}
                </div>
            </nav>
            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <h1 className="text-4xl font-bold mb-8 text-cyan-400">📰 Public Relations</h1>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Media Coverage</div>
                        <div className="text-2xl font-bold text-cyan-400">24</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Total Reach</div>
                        <div className="text-2xl font-bold text-emerald-400">2.5M</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Sentiment</div>
                        <div className="text-2xl font-bold text-blue-400">+85%</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
