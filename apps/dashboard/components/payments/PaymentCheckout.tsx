'use client'

/**
 * 🏦 Unified Payment Checkout & Management Component
 * ==================================================
 * A unified interface for all payment gateways (Stripe, PayPal, Braintree).
 * Handles both initial checkout and subscription management (Cancel/Resume).
 */

import { useState, useEffect } from 'react'
import BraintreeCheckout from './BraintreeCheckout'
import PayPalSmartButton from './PayPalSmartButton'
import { StripeCheckout } from './StripeCheckout'
import type { PaymentGateway } from '@/lib/billing/gateways'

export interface UnifiedCheckoutProps {
  gateway: PaymentGateway | 'braintree' | 'paypal'
  amount: string | number
  currency?: string
  description?: string
  customerEmail?: string
  tenantId?: string
  returnUrl?: string
  cancelUrl?: string
  planId?: string
  mode?: 'payment' | 'subscription'
  subscriptionId?: string // If provided, switches to management mode
  onSuccess?: (result: unknown) => void
  onError?: (error: string) => void
  className?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export function PaymentCheckout({
  gateway,
  amount,
  currency = 'USD',
  description = 'Payment',
  customerEmail,
  tenantId,
  returnUrl,
  cancelUrl,
  planId,
  mode = 'payment',
  subscriptionId,
  onSuccess,
  onError,
  className = '',
}: UnifiedCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subDetails, setSubDetails] = useState<any>(null)

  // Fetch subscription details if in management mode
  useEffect(() => {
    if (subscriptionId && gateway === 'paypal') {
      const fetchSub = async () => {
        try {
          const res = await fetch(`${API_URL}/payments/paypal/subscription/${subscriptionId}`)
          if (res.ok) {
            const data = await res.json()
            setSubDetails(data)
          }
        } catch (err) {
          console.error('Failed to fetch subscription details:', err)
        }
      }
      fetchSub()
    }
  }, [subscriptionId, gateway])

  const handleCancel = async () => {
    if (!subscriptionId || !window.confirm('Are you sure you want to cancel your subscription?')) return

    setLoading(true)
    setError(null)
    try {
      const endpoint = gateway === 'paypal'
        ? `${API_URL}/payments/paypal/subscription/${subscriptionId}/cancel`
        : '#' // Implement Stripe cancel if needed

      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to cancel subscription')

      alert('Subscription canceled successfully.')
      onSuccess?.({ status: 'CANCELED' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed'
      setError(msg)
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }

  // Management Mode UI
  if (subscriptionId) {
    return (
      <div className={`w-full max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
        <h3 className="text-xl font-bold text-white mb-4">Manage Subscription</h3>
        {subDetails && (
          <div className="mb-6 space-y-2">
            <p className="text-sm text-neutral-400">Status:
              <span className={`ml-2 font-medium ${subDetails.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'}`}>
                {subDetails.status}
              </span>
            </p>
            <p className="text-sm text-neutral-400">Plan: <span className="text-white">{subDetails.plan_id}</span></p>
          </div>
        )}

        {error && <div className="mb-4 text-red-400 text-sm">⚠️ {error}</div>}

        <div className="flex flex-col gap-3">
          {subDetails?.status === 'ACTIVE' && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors text-sm font-medium"
            >
              {loading ? 'Processing...' : 'Cancel Subscription'}
            </button>
          )}
          {/* Add Resume button if status is SUSPENDED or similar if supported by flow */}
        </div>
      </div>
    )
  }

  // Checkout Mode UI
  const amountStr = amount.toString()
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount

  const renderContent = () => {
    switch (gateway) {
      case 'braintree':
        return (
          <BraintreeCheckout
            amount={amountStr}
            description={description}
            onSuccess={onSuccess}
            onError={onError}
            className={className}
          />
        )

      case 'paypal':
        return (
          <PayPalSmartButton
            amount={amountStr}
            planId={planId}
            mode={mode as 'payment' | 'subscription'}
            currency={currency}
            description={description}
            customerEmail={customerEmail}
            tenantId={tenantId}
            onSuccess={onSuccess}
            onError={onError}
            apiBaseUrl={API_URL}
          />
        )

      case 'stripe':
      case 'payos':
      case 'omise':
      case 'xendit':
        if (!customerEmail || !tenantId || !returnUrl || !cancelUrl) {
          return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              Missing required props for {gateway} checkout (email, tenantId, urls)
            </div>
          )
        }

        return (
          <StripeCheckout
            amount={amountNum}
            currency={currency}
            description={description}
            customerEmail={customerEmail}
            tenantId={tenantId}
            returnUrl={returnUrl}
            cancelUrl={cancelUrl}
            onSuccess={onSuccess}
            onError={onError}
            className={className}
          />
        )

      default:
        return (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            Unsupported payment gateway: {gateway}
          </div>
        )
    }
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {renderContent()}
    </div>
  )
}
