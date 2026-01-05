'use client';

/**
 * Pricing Plans Page
 * VC-Ready SaaS Pricing with SEA Localization
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, Rocket } from 'lucide-react';
import { useLocale } from 'next-intl';
import { MD3Button } from '@/components/md3/MD3Button';
import { MD3Card } from '@/components/ui/MD3Card';
import {
    PRICING_TIERS,
    CURRENCIES,
    LOCALIZED_PRICING,
    getCurrencyFromLocale,
    formatCurrency,
    type CurrencyCode
} from '@/lib/billing';

export default function PricingPage() {
    const locale = useLocale();
    const defaultCurrency = getCurrencyFromLocale(locale);
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(defaultCurrency);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const pricing = LOCALIZED_PRICING[selectedCurrency];
    const yearlyDiscount = 0.17; // 17% discount for yearly

    const getPrice = (basePrice: number) => {
        if (billingPeriod === 'yearly') {
            return basePrice * 12 * (1 - yearlyDiscount);
        }
        return basePrice;
    };

    const plans = [
        {
            id: 'free',
            name: 'Starter',
            description: 'Perfect for trying out AgencyOS',
            price: pricing.free,
            icon: Rocket,
            features: PRICING_TIERS.FREE.features,
            cta: 'Start Free',
            popular: false,
        },
        {
            id: 'pro',
            name: 'Professional',
            description: 'For growing agencies',
            price: pricing.pro,
            icon: Zap,
            features: PRICING_TIERS.PRO.features,
            cta: 'Upgrade to Pro',
            popular: true,
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'For large organizations',
            price: pricing.enterprise,
            icon: Building2,
            features: PRICING_TIERS.ENTERPRISE.features,
            cta: 'Contact Sales',
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen py-20 px-4" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1
                        className="text-4xl md:text-5xl font-bold mb-4"
                        style={{ color: 'var(--md-sys-color-on-surface)' }}
                    >
                        Simple, Transparent Pricing
                    </h1>
                    <p
                        className="text-xl max-w-2xl mx-auto"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                    >
                        Choose the plan that fits your agency. Scale as you grow.
                    </p>
                </motion.div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
                    {/* Billing Toggle */}
                    <div
                        className="flex rounded-full p-1"
                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
                    >
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'monthly' ? 'shadow-md' : ''
                                }`}
                            style={{
                                backgroundColor: billingPeriod === 'monthly'
                                    ? 'var(--md-sys-color-primary)'
                                    : 'transparent',
                                color: billingPeriod === 'monthly'
                                    ? 'var(--md-sys-color-on-primary)'
                                    : 'var(--md-sys-color-on-surface-variant)',
                            }}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'yearly' ? 'shadow-md' : ''
                                }`}
                            style={{
                                backgroundColor: billingPeriod === 'yearly'
                                    ? 'var(--md-sys-color-primary)'
                                    : 'transparent',
                                color: billingPeriod === 'yearly'
                                    ? 'var(--md-sys-color-on-primary)'
                                    : 'var(--md-sys-color-on-surface-variant)',
                            }}
                        >
                            Yearly <span className="text-xs opacity-75">(-17%)</span>
                        </button>
                    </div>

                    {/* Currency Selector */}
                    <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                        className="px-4 py-2 rounded-full text-sm border-0"
                        style={{
                            backgroundColor: 'var(--md-sys-color-surface-container)',
                            color: 'var(--md-sys-color-on-surface)',
                        }}
                    >
                        {Object.entries(CURRENCIES).map(([code, currency]) => (
                            <option key={code} value={code}>
                                {currency.symbol} {currency.code}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative"
                        >
                            {plan.popular && (
                                <div
                                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        backgroundColor: 'var(--md-sys-color-tertiary)',
                                        color: 'var(--md-sys-color-on-tertiary)',
                                    }}
                                >
                                    Most Popular
                                </div>
                            )}

                            <MD3Card
                                className={`h-full flex flex-col ${plan.popular ? 'ring-2' : ''}`}
                                style={{
                                    borderColor: plan.popular ? 'var(--md-sys-color-primary)' : undefined,
                                }}
                            >
                                <div className="p-8 flex-1">
                                    {/* Plan Icon */}
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                                        style={{ backgroundColor: 'var(--md-sys-color-primary-container)' }}
                                    >
                                        <plan.icon
                                            className="w-6 h-6"
                                            style={{ color: 'var(--md-sys-color-on-primary-container)' }}
                                        />
                                    </div>

                                    {/* Plan Name */}
                                    <h3
                                        className="text-xl font-bold mb-2"
                                        style={{ color: 'var(--md-sys-color-on-surface)' }}
                                    >
                                        {plan.name}
                                    </h3>
                                    <p
                                        className="text-sm mb-6"
                                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                    >
                                        {plan.description}
                                    </p>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <span
                                            className="text-4xl font-bold"
                                            style={{ color: 'var(--md-sys-color-on-surface)' }}
                                        >
                                            {formatCurrency(getPrice(plan.price), selectedCurrency)}
                                        </span>
                                        {plan.price > 0 && (
                                            <span
                                                className="text-sm"
                                                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                            >
                                                /{billingPeriod === 'yearly' ? 'year' : 'month'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <Check
                                                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                                                    style={{ color: 'var(--md-sys-color-primary)' }}
                                                />
                                                <span
                                                    className="text-sm"
                                                    style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                                                >
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CTA */}
                                <div className="p-8 pt-0">
                                    <MD3Button
                                        variant={plan.popular ? 'filled' : 'outlined'}
                                        className="w-full"
                                    >
                                        {plan.cta}
                                    </MD3Button>
                                </div>
                            </MD3Card>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <p
                        className="text-sm mb-4"
                        style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                    >
                        Trusted by 500+ agencies across Southeast Asia
                    </p>
                    <div className="flex justify-center items-center gap-8 opacity-60">
                        <span className="text-2xl font-bold">🇻🇳</span>
                        <span className="text-2xl font-bold">🇹🇭</span>
                        <span className="text-2xl font-bold">🇮🇩</span>
                        <span className="text-2xl font-bold">🇵🇭</span>
                        <span className="text-2xl font-bold">🇸🇬</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
