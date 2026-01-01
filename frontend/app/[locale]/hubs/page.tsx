'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

const HUBS = [
    { id: 'warroom', icon: '🏯', path: '/warroom', color: 'red' },
    { id: 'executive', icon: '👑', path: '/executive', color: 'yellow' },
    { id: 'agentops', icon: '🎯', path: '/agentops', color: 'blue' },
    { id: 'sales', icon: '💰', path: '/sales', color: 'yellow' },
    { id: 'crm', icon: '💼', path: '/crm', color: 'pink' },
    { id: 'marketing', icon: '📢', path: '/marketing', color: 'red' },
    { id: 'analytics', icon: '📊', path: '/analytics', color: 'green' },
    { id: 'hr', icon: '👥', path: '/hr', color: 'purple' },
    { id: 'operations', icon: '⚙️', path: '/operations', color: 'orange' },
    { id: 'product', icon: '🚀', path: '/product', color: 'blue' },
    { id: 'binhphap', icon: '🏯', path: '/binhphap', color: 'red' },
    { id: 'portfolio', icon: '💎', path: '/vc/portfolio', color: 'green' },
];

export default function HubsPage({ params: { locale } }: { params: { locale: string } }) {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('HubsPage');

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/20 rounded">HUBS</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-white/20 text-white' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                    ))}
                </div>
            </nav>
            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <h1 className="text-4xl font-bold mb-8 text-white">🏯 {t('title')}</h1>
                <div className="grid grid-cols-4 gap-4">
                    {HUBS.map((hub) => (
                        <Link
                            key={hub.id}
                            href={`/${locale}${hub.path}`}
                            className="bg-[#0A0A0A] border border-white/10 rounded-lg p-6 hover:border-white/30 transition-all"
                        >
                            <div className="text-4xl mb-3">{hub.icon}</div>
                            <div className="text-lg font-bold mb-1">{t(hub.id)}</div>
                            <div className="text-xs text-gray-500">{hub.id}</div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}

