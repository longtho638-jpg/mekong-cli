'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';

const SHOWCASES = [
    { title: 'VC Portfolio Galaxy', path: '/vc/portfolio', color: 'green', description: '6 interactive Recharts visualizations' },
    { title: 'War Room Command', path: '/warroom', color: 'red', description: 'Real-time mission control' },
    { title: 'Binh Pháp Strategy', path: '/binhphap', color: 'red', description: '13 Sun Tzu chapters' },
    { title: 'AgentOps Dashboard', path: '/agentops', color: 'blue', description: '156 AI agents monitored' },
    { title: 'Sales Pipeline', path: '/sales', color: 'yellow', description: 'Sankey flow visualization' },
    { title: 'Analytics Hub', path: '/analytics', color: 'green', description: 'Business intelligence' },
    { title: 'Marketing Command', path: '/marketing', color: 'red', description: 'Multi-channel attribution' },
    { title: 'HR Dashboard', path: '/hr', color: 'purple', description: 'People analytics' },
];

export default function ShowcasePage({ params: { locale } }: { params: { locale: string } }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/20 rounded">SHOWCASE</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-white/20 text-white' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                    ))}
                </div>
            </nav>
            <main className="pt-24 px-6 max-w-[1400px] mx-auto pb-20">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">🎨 Showcase</h1>
                    <p className="text-gray-400">Explore our Pro Max dashboards with interactive visualizations</p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {SHOWCASES.map((item) => (
                        <Link
                            key={item.path}
                            href={`/${locale}${item.path}`}
                            className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6 hover:border-white/30 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-bold">{item.title}</h3>
                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-sm text-gray-400">{item.description}</p>
                            <div className={`mt-4 inline-block px-2 py-1 text-xs bg-${item.color}-500/20 border border-${item.color}-500/30 rounded`}>
                                Interactive
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 bg-[#0A0A0A] border border-white/10 rounded-lg p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">🏯 Built with Pro Max Standard</h2>
                    <p className="text-gray-400 mb-6">All dashboards feature Fintech Dark theme, Recharts visualizations, and full i18n support (EN/VI/ZH)</p>
                    <div className="flex gap-4 justify-center text-sm">
                        <div className="px-4 py-2 bg-white/5 rounded">Next.js 14</div>
                        <div className="px-4 py-2 bg-white/5 rounded">Recharts</div>
                        <div className="px-4 py-2 bg-white/5 rounded">next-intl</div>
                        <div className="px-4 py-2 bg-white/5 rounded">Tailwind CSS</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
