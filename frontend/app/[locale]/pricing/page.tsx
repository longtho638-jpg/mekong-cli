'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

const PLANS = [
    {
        id: 'startup',
        price: '$2K',
        period: 'per_month',
        features: ['5% Equity', 'Success Fee: 2%', 'Strategic Consulting', 'Anti-Dilution Support'],
        color: 'green'
    },
    {
        id: 'growth',
        price: '$5K',
        period: 'per_month',
        features: ['3-5% Equity', 'Success Fee: 1.5%', 'Full Hub Access', 'Priority Support'],
        color: 'blue',
        popular: true
    },
    {
        id: 'enterprise',
        price: 'custom',
        period: '',
        features: ['15-30% Co-founder', 'Deferred Payment', 'Venture Studio', 'Shared Exit'],
        color: 'purple'
    }
];

export default function PricingPage({ params: { locale } }: { params: { locale: string } }) {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Pricing');

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">AGENCY OS</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/20 rounded">PRICING</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-white/20 text-white' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                    ))}
                </div>
            </nav>
            <main className="pt-24 px-6 max-w-[1400px] mx-auto pb-20">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">💰 {t('title')}</h1>
                    <p className="text-gray-400">{t('subtitle')}</p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-[#0A0A0A] border rounded-lg p-8 ${plan.popular ? 'border-blue-500 relative' : 'border-white/10'}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                                    {t('popular')}
                                </div>
                            )}
                            <h3 className="text-2xl font-bold mb-2">{t(plan.id)}</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">{plan.price === 'custom' ? t('custom') : plan.price}</span>
                                <span className="text-gray-400">{plan.period ? t(plan.period) : ''}</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-400" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button className={`w-full py-3 rounded-lg font-bold ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}>
                                {t('get_started')}
                            </button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

