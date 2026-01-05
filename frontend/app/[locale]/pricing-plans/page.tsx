'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { Check, Sparkles, ArrowRight, Star, Users, Zap, Crown } from 'lucide-react';

const PRICING_TIERS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 29,
        description: 'Automate your agency with 125+ AI commands',
        icon: <Zap className="w-6 h-6" />,
        color: 'blue',
        features: ['125+ AI commands', 'Marketing automation', 'Sales proposals', 'Community support', 'Basic analytics'],
        popular: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 99,
        description: 'Scale with your team and API access',
        icon: <Star className="w-6 h-6" />,
        color: 'purple',
        features: ['Everything in Starter', '5 team seats', 'Priority support', 'API access', 'Dashboard analytics', 'Custom reports'],
        popular: true,
    },
    {
        id: 'franchise',
        name: 'Franchise',
        price: 299,
        description: 'White-label AgencyOS and resell to clients',
        icon: <Crown className="w-6 h-6" />,
        color: 'amber',
        features: ['Everything in Pro', 'White-label rights', 'Custom domain', '85% revenue share', 'Remove branding', 'Dedicated support'],
        popular: false,
    },
];

const TESTIMONIALS = [
    { name: 'Minh Tran', role: 'CEO, Saigon Digital', quote: 'Agency OS transformed how we manage our 50+ clients!' },
    { name: 'Linh Nguyen', role: 'Founder, Creative Hub', quote: 'The Binh Phap framework is worth 10x the price.' },
    { name: 'Duc Pham', role: 'Director, Growth Agency', quote: 'White label launched our platform in 2 weeks.' },
];

export default function PricingPlansPage() {
    const [annual, setAnnual] = useState(false);
    const getPrice = (price: number) => annual ? Math.round(price * 10) : price;

    return (
        <MD3AppShell title="💰 Pricing Plans" subtitle="Simple, transparent pricing for every agency">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-300">Start free, upgrade when ready</span>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <span className={annual ? 'text-gray-500' : 'text-white'}>Monthly</span>
                    <button onClick={() => setAnnual(!annual)} className="relative w-14 h-8 bg-white/10 rounded-full">
                        <div className={`absolute top-1 w-6 h-6 bg-purple-500 rounded-full transition-all ${annual ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className={annual ? 'text-white' : 'text-gray-500'}>
                        Annual <span className="text-green-400 text-sm">(Save 17%)</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {PRICING_TIERS.map((tier) => (
                    <MD3Surface key={tier.id} shape="extra-large" className={`auto-safe relative ${tier.popular ? 'border-2 border-purple-500 scale-105' : ''}`}>
                        {tier.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-sm font-bold rounded-full">
                                Most Popular
                            </div>
                        )}
                        <div className={`w-12 h-12 rounded-xl bg-${tier.color}-500/20 flex items-center justify-center mb-4 text-${tier.color}-400`}>
                            {tier.icon}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                        <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold">${getPrice(tier.price)}</span>
                            <span className="text-gray-400">{annual ? '/year' : '/mo'}</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {tier.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-400" />
                                    <span className="text-gray-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${tier.popular ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}>
                            Get {tier.name} <ArrowRight className="w-4 h-4" />
                        </button>
                    </MD3Surface>
                ))}
            </div>

            <MD3Surface shape="extra-large" className="auto-safe mb-8">
                <h2 className="text-2xl font-bold text-center mb-8">What Agencies Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-xl">
                            <p className="text-gray-300 mb-4">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="font-bold">{t.name}</div>
                                    <div className="text-xs text-gray-500">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </MD3Surface>

            <MD3Surface shape="extra-large" className="auto-safe">
                <h2 className="text-2xl font-bold text-center mb-6">FAQ</h2>
                <div className="space-y-4 max-w-2xl mx-auto">
                    {[
                        { q: 'Can I change plans anytime?', a: 'Yes! Upgrade or downgrade at any time.' },
                        { q: 'Is there a free trial?', a: 'Yes, 14-day free trial. No credit card required.' },
                        { q: 'What payment methods?', a: 'Credit cards, PayPal, and bank transfer.' },
                    ].map((faq, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-xl">
                            <h4 className="font-bold mb-2">{faq.q}</h4>
                            <p className="text-gray-400 text-sm">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </MD3Surface>
        </MD3AppShell>
    );
}
