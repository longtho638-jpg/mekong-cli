'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                </div>
                <div className="flex gap-4 items-center">
                    <Link href={`/${locale}/hubs`} className="text-sm hover:text-blue-400">Hubs</Link>
                    <Link href={`/${locale}/pricing`} className="text-sm hover:text-blue-400">Pricing</Link>
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py -1 text-xs rounded ${locale === l ? 'bg-white/20 text-white' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                    ))}
                </div>
            </nav>
            <main className="pt-24 px-6 max-w-[1200px] mx-auto pb-20">
                <div className="text-center py-20">
                    <h1 className="text-6xl font-bold mb-6">
                        🏯 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Agency OS</span>
                    </h1>
                    <p className="text-2xl text-gray-400 mb-8">WIN-WIN-WIN Operating System for Modern Agencies</p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href={`/${locale}/hubs`}
                            className="px-8 py-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 flex items-center gap-2"
                        >
                            Explore Hubs <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href={`/${locale}/pricing`}
                            className="px-8 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20"
                        >
                            View Pricing
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-20">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                        <div className="text-3xl mb-4">🎯</div>
                        <h3 className="text-xl font-bold mb-2">168 Modules</h3>
                        <p className="text-gray-400 text-sm">Complete agency management suite</p>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                        <div className="text-3xl mb-4">🤖</div>
                        <h3 className="text-xl font-bold mb-2">156 AI Agents</h3>
                        <p className="text-gray-400 text-sm">Automated workflows & intelligence</p>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6">
                        <div className="text-3xl mb-4">🏯</div>
                        <h3 className="text-xl font-bold mb-2">13 Binh Pháp</h3>
                        <p className="text-gray-400 text-sm">Strategic wisdom integrated</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
