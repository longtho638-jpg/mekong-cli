'use client'

/**
 * 💳 Stripe Checkout Component
 * ============================
 * Initiates a Stripe Checkout Session via backend redirect.
 */

import { useState } from 'react'
import { createPayment, PaymentRequest } from '@/lib/billing/gateways'

interface StripeCheckoutProps {
  amount: number
  currency?: string
  description?: string
  customerEmail: string
  tenantId: string
  returnUrl: string
  cancelUrl: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

export function StripeCheckout({
  amount,
  currency = 'USD',
  description = 'Payment',
  customerEmail,
  tenantId,
  returnUrl,
  cancelUrl,
  onError,
  className = '',
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const request: PaymentRequest = {
        amount,
        currency,
        description,
        customerEmail,
        tenantId,
        returnUrl,
        cancelUrl,
      }

      const result = await createPayment(request, 'stripe')

      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl
      } else {
        throw new Error(result.error || 'Failed to initiate Stripe checkout')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stripe checkout error'
      onError?.(message)
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">💳 Pay with Stripe</h3>
        <p className="text-white/60 text-sm">
          {description} - ${amount} {currency}
        </p>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-white
          transition-all duration-200 flex items-center justify-center gap-3
          ${
            loading
              ? 'bg-white/10 cursor-not-allowed'
              : 'bg-[#635BFF] hover:bg-[#5851E2] shadow-lg hover:shadow-xl'
          }
        `}
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block">⏳</span>
            Redirecting...
          </>
        ) : (
          <>
            <span>Pay with Stripe</span>
          </>
        )}
      </button>

      <p className="text-center text-white/40 text-xs mt-4">
        🔒 Secure payment processing by Stripe
      </p>
    </div>
  )
}
