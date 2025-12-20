'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, FileText, TrendingUp } from 'lucide-react';

export default function B2BContentPage({ params: { locale } }: { params: { locale: string } }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-lime-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-lime-400">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-lime-500/20 border border-lime-500/30 rounded">B2B CONTENT</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-lime-500/20 text-lime-400' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                    ))}
                </div>
            </nav>
            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <h1 className="text-4xl font-bold mb-8 text-lime-400">📄 B2B Content Hub</h1>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Content Assets</div>
                        <div className="text-2xl font-bold text-lime-400">156</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Downloads</div>
                        <div className="text-2xl font-bold text-emerald-400">8.5K</div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-5">
                        <div className="text-xs text-gray-500 mb-2">Lead Gen</div>
                        <div className="text-2xl font-bold text-blue-400">2.1K</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
