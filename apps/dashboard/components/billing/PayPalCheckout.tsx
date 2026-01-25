'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Loader2 } from 'lucide-react'
import { AgencyCard } from '@/components/ui/agency-card'

/**
 * PayPal Checkout Button Component
 *
 * Integrates with backend PayPal orchestrator via /api/checkout/paypal
 * Handles redirect-based PayPal flow with automatic failover to Polar
 */

interface PayPalCheckoutProps {
  amount: number
  currency?: string
  priceId?: string
  customerEmail?: string
  tenantId?: string
  mode?: 'subscription' | 'payment'
  onSuccess?: (checkoutId: string) => void
  onError?: (error: string) => void
  className?: string
  variant?: 'primary' | 'secondary'
  label?: string
}

interface CheckoutResponse {
  checkout_id: string
  approval_url: string
  provider: string
  status: string
}

export function PayPalCheckout({
  amount,
  currency = 'USD',
  priceId,
  customerEmail,
  tenantId,
  mode = 'subscription',
  onSuccess,
  onError,
  className = '',
  variant = 'primary',
  label = 'Pay with PayPal'
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayPalCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      // Call backend API to create PayPal checkout session
      const response = await fetch('/api/checkout/paypal/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          price_id: priceId,
          customer_email: customerEmail,
          tenant_id: tenantId,
          mode,
          success_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Payment initialization failed' }))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      const data: CheckoutResponse = await response.json()

      // Log provider used (may be PayPal or Polar via failover)
      console.log(`Payment checkout created via ${data.provider}: ${data.checkout_id}`)

      // Notify parent component
      onSuccess?.(data.checkout_id)

      // Redirect to PayPal approval page
      window.location.href = data.approval_url

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initialization failed'
      setError(errorMessage)
      onError?.(errorMessage)
      console.error('PayPal checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  const buttonStyles = variant === 'primary'
    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20'
    : 'bg-white/10 hover:bg-white/20 text-white'

  return (
    <div className={className}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}

      <button
        onClick={handlePayPalCheckout}
        disabled={loading}
        className={`
          w-full px-4 py-3 rounded-lg font-medium transition-all
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${buttonStyles}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {label}
          </>
        )}
      </button>

      {/* Billing info */}
      <p className="text-xs text-neutral-400 mt-2 text-center">
        Secure payment powered by PayPal
        {mode === 'subscription' && ' • Cancel anytime'}
      </p>
    </div>
  )
}

/**
 * PayPal Payment Card - Wrapper for billing dashboard integration
 */
interface PayPalPaymentCardProps {
  tier: 'starter' | 'pro' | 'franchise' | 'enterprise'
  customerEmail?: string
  tenantId?: string
  currency?: string
}

const TIER_PRICING: Record<string, { amount: number; planId: string | undefined }> = {
  starter: { amount: 29, planId: process.env.NEXT_PUBLIC_PAYPAL_STARTER_PLAN_ID },
  pro: { amount: 99, planId: process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID },
  franchise: { amount: 299, planId: process.env.NEXT_PUBLIC_PAYPAL_FRANCHISE_PLAN_ID },
  enterprise: { amount: 0, planId: undefined } // Custom pricing
}

export function PayPalPaymentCard({
  tier,
  customerEmail,
  tenantId,
  currency = 'USD'
}: PayPalPaymentCardProps) {
  const config = TIER_PRICING[tier]

  if (!config.planId) {
    return (
      <AgencyCard variant="glass-pro" className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Enterprise Plan</h3>
          <p className="text-sm text-neutral-400 mb-4">
            Contact sales for custom pricing
          </p>
          <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
            Contact Sales
          </button>
        </div>
      </AgencyCard>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <AgencyCard variant="glass-pro" className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">
            Subscribe to {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </h3>
          <p className="text-sm text-neutral-400">
            ${config.amount}/month • Billed monthly
          </p>
        </div>

        <PayPalCheckout
          amount={config.amount}
          currency={currency}
          priceId={config.planId}
          customerEmail={customerEmail}
          tenantId={tenantId}
          mode="subscription"
          label={`Subscribe for $${config.amount}/mo`}
          variant="primary"
        />
      </AgencyCard>
    </motion.div>
  )
}
