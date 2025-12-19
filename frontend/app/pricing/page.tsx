'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { PRICING_TIERS } from '@/lib/polar/client'

export default function PricingPage() {
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const handleCheckout = async (productId: string, tierName: string) => {
        if (!productId) return

        setIsLoading(productId)

        try {
            // Redirect to Polar.sh hosted checkout
            // In production, this would use the Polar SDK or API
            const polarOrgSlug = process.env.NEXT_PUBLIC_POLAR_ORG_SLUG || 'agency-os'
            const checkoutUrl = `https://polar.sh/${polarOrgSlug}/subscriptions/new?product=${productId}`

            // Open in new tab for smoother UX
            window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Unable to start checkout. Please try again.')
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
            {/* Header */}
            <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        🏯 Agency OS
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link href="/" className="text-gray-400 hover:text-white">Home</Link>
                        <Link href="/pricing" className="text-white">Pricing</Link>
                        <Link href="/auth/login" className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30">
                            Sign In
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="text-center py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Choose the plan that fits your agency. Start free, upgrade when you grow.
                    </p>
                </motion.div>
            </section>

            {/* Pricing Cards */}
            <section className="max-w-7xl mx-auto px-8 pb-24">
                <div className="grid grid-cols-4 gap-6">
                    {PRICING_TIERS.map((tier, idx) => (
                        <motion.div
                            key={tier.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative bg-gray-800/50 backdrop-blur-xl rounded-2xl border p-6 ${tier.popular
                                ? 'border-purple-500 ring-2 ring-purple-500/20'
                                : 'border-gray-700/50'
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-medium text-white">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold text-white">
                                        ${tier.price}
                                    </span>
                                    {tier.price > 0 && (
                                        <span className="text-gray-500">/{tier.period}</span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm mt-2">{tier.description}</p>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                                        <span className="text-green-400">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => tier.productId && handleCheckout(tier.productId, tier.name)}
                                disabled={isLoading === tier.productId || (!tier.productId && tier.price > 0)}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${tier.popular
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                                    : tier.price === 0
                                        ? 'bg-gray-700/50 text-white hover:bg-gray-700'
                                        : 'bg-gray-700/50 border border-gray-600 text-white hover:border-purple-500'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isLoading === tier.productId ? 'Loading...' : tier.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: 'Can I change plans later?',
                                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
                            },
                            {
                                q: 'Is there a free trial?',
                                a: 'Yes, all paid plans come with a 14-day free trial. No credit card required.',
                            },
                            {
                                q: 'What payment methods do you accept?',
                                a: 'We accept all major credit cards via Polar.sh. Invoicing is available for Agency and Franchise plans.',
                            },
                            {
                                q: 'Can I cancel anytime?',
                                a: 'Absolutely. Cancel your subscription at any time with no questions asked.',
                            },
                        ].map((faq, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6"
                            >
                                <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                                <p className="text-gray-400">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-24 text-center">
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-500/20 p-12">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to scale your agency?
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                            Join 100+ agencies using Agency OS to grow their business. Start your free trial today.
                        </p>
                        <Link
                            href="/auth/signup"
                            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                            Start Free Trial →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-700/50 py-8">
                <div className="max-w-7xl mx-auto px-8 text-center text-gray-500 text-sm">
                    Powered by Agency OS v2.0 • Payments by Polar.sh
                </div>
            </footer>
        </div>
    )
}
