'use client'

/**
 * 💰 Pricing Page
 * ================
 * Customer-facing pricing page with three tiers.
 * Handles PayPal checkout flow and redirects.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PricingTier {
  id: string
  name: string
  price: string
  yearlyPrice: string
  features: string[]
  popular?: boolean
  cta: string
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'solo',
    name: 'Solo',
    price: '395',
    yearlyPrice: '395',
    cta: 'Start Solo',
    features: [
      '1 user seat',
      '3 AI agents',
      '10,000 requests/month',
      'Basic analytics',
      'Email support',
      'Core integrations',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: '995',
    yearlyPrice: '995',
    popular: true,
    cta: 'Start Team',
    features: [
      '5 user seats',
      '10 AI agents',
      '50,000 requests/month',
      'Advanced analytics',
      'Priority support',
      'All integrations',
      'Custom workflows',
      'Team collaboration',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    yearlyPrice: 'Custom',
    cta: 'Contact Sales',
    features: [
      'Unlimited users',
      'Unlimited agents',
      'Unlimited requests',
      'Enterprise analytics',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'White-label options',
      'On-premise deployment',
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBuyNow = async (tierId: string, price: string) => {
    // Enterprise tier goes to contact form
    if (tierId === 'enterprise') {
      router.push('/contact')
      return
    }

    setLoading(tierId)
    setError(null)

    try {
      // Create PayPal checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price,
          currency: 'USD',
          description: `AgencyOS ${tierId.charAt(0).toUpperCase() + tierId.slice(1)} Plan`,
          plan: tierId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const data = await response.json()

      // Redirect to PayPal
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      } else {
        throw new Error('No approval URL received')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout'
      setError(message)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your <span className="text-blue-400">AgencyOS</span> Plan
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Scale your agency with AI-powered automation. All plans include annual billing.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`
                relative rounded-2xl border p-8
                ${
                  tier.popular
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-white/10 bg-white/5'
                }
                hover:border-blue-400/50 transition-all duration-300
              `}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier Name */}
              <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>

              {/* Price */}
              <div className="mb-6">
                {tier.price === 'Custom' ? (
                  <div className="text-4xl font-bold text-white">Custom</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${tier.price}</span>
                    <span className="text-white/60">/year</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-white/80">
                    <svg
                      className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleBuyNow(tier.id, tier.price)}
                disabled={loading === tier.id}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold text-white
                  transition-all duration-200
                  ${
                    tier.popular
                      ? 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl'
                      : 'bg-white/10 hover:bg-white/20 border border-white/20'
                  }
                  ${loading === tier.id ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {loading === tier.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </span>
                ) : (
                  tier.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ / Trust Signals */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Secure PayPal Checkout
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Instant License Delivery
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Email Support Included
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
