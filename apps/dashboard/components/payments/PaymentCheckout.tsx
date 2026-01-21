'use client'

/**
 * 🏦 Unified Payment Checkout Component
 * =====================================
 * A unified interface for all payment gateways (Stripe, PayPal, Braintree).
 * Uses the Provider pattern to switch between implementations.
 */

import BraintreeCheckout from './BraintreeCheckout'
import PayPalCheckout from './PayPalCheckout'
import { StripeCheckout } from './StripeCheckout'
import type { PaymentGateway } from '@/lib/billing/gateways'

export interface UnifiedCheckoutProps {
  gateway: PaymentGateway | 'braintree' | 'paypal'
  amount: string | number
  currency?: string
  description?: string
  customerEmail?: string // Required for Stripe/Gateways
  tenantId?: string // Required for Stripe/Gateways
  returnUrl?: string // Required for Stripe/Gateways
  cancelUrl?: string // Required for Stripe/Gateways
  onSuccess?: (result: unknown) => void
  onError?: (error: string) => void
  className?: string
}

export function PaymentCheckout({
  gateway,
  amount,
  currency = 'USD',
  description = 'Payment',
  customerEmail,
  tenantId,
  returnUrl,
  cancelUrl,
  onSuccess,
  onError,
  className = '',
}: UnifiedCheckoutProps) {
  // Normalize amount to string for Braintree/PayPal and number for Stripe
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
          <PayPalCheckout
            amount={amountStr}
            currency={currency}
            description={description}
            onSuccess={onSuccess}
            onError={onError}
            className={className}
          />
        )

      case 'stripe':
      case 'payos':
      case 'omise':
      case 'xendit':
        // These gateways require additional props for redirect flow
        if (!customerEmail || !tenantId || !returnUrl || !cancelUrl) {
          return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              Missing required props for {gateway} checkout (email, tenantId, urls)
            </div>
          )
        }

        // For now, we map all these to the Stripe-like redirect flow
        // In a full implementation, we might have specific UI components for each
        // but they all share the 'createPayment' redirect pattern.
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
