'use client'

/**
 * 💳 PayPal Checkout Component (SDK v6)
 * =====================================
 * Modern PayPal checkout replacing Braintree.
 *
 * Usage:
 * <PayPalCheckout
 *   amount="47.00"
 *   description="AgencyOS Pro"
 *   onSuccess={(txn) => console.info('Paid:', txn)}
 *   onError={(err) => console.error(err)}
 * />
 */

import { useState, useEffect, useCallback } from 'react'

// Types
interface Transaction {
  orderId?: string
  subscriptionId?: string
  status: string
  amount?: string
}

interface PayPalCheckoutProps {
  amount?: string
  planId?: string
  mode?: 'payment' | 'subscription'
  description?: string
  currency?: string
  customerEmail?: string
  tenantId?: string
  onSuccess?: (transaction: Transaction) => void
  onError?: (error: string) => void
  className?: string
}

// API URL - use Next.js API routes
const API_URL = '/api'

// PayPal SDK v6 URL
const PAYPAL_SDK_URL =
  process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
    ? 'https://www.paypal.com/web-sdk/v6/core'
    : 'https://www.sandbox.paypal.com/web-sdk/v6/core'

export function PayPalCheckout({
  amount,
  planId,
  mode = 'payment',
  description = 'Payment',
  currency = 'USD',
  customerEmail,
  tenantId,
  onSuccess,
  onError,
  className = '',
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [, setSdkReady] = useState(false)

  // Load PayPal SDK v6
  useEffect(() => {
    const existingScript = document.getElementById('paypal-sdk-v6')
    if (existingScript) {
      setSdkReady(true)
      setLoading(false)
      return
    }

    const script = document.createElement('script')
    script.id = 'paypal-sdk-v6'
    script.src = PAYPAL_SDK_URL
    script.async = true
    script.onload = () => {
      setSdkReady(true)
      setLoading(false)
    }
    script.onerror = () => {
      setError('Không thể tải PayPal SDK')
      setLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      // Don't remove script on unmount to avoid reload issues
    }
  }, [])

  // Create PayPal order via backend
  const createOrder = useCallback(async () => {
    const response = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount || '0'),
        currency,
        description,
        customerEmail,
        tenantId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create order')
    }

    const data = await response.json()
    return data.orderId
  }, [amount, currency, description, customerEmail, tenantId])

  // Create PayPal subscription via backend
  const createSubscription = useCallback(async () => {
    const response = await fetch(`${API_URL}/payments/paypal/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        tenant_id: tenantId,
        customer_email: customerEmail,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create subscription')
    }

    const data = await response.json()
    // PayPal returns the subscription details directly
    return data
  }, [planId, tenantId, customerEmail])

  // Capture order after approval
  const captureOrder = useCallback(async (orderId: string) => {
    const response = await fetch(`${API_URL}/payments/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })

    if (!response.ok) {
      throw new Error('Failed to capture order')
    }

    return response.json()
  }, [])

  // Handle PayPal button click
  const handlePayPalClick = useCallback(async () => {
    setProcessing(true)
    setError(null)

    try {
      if (mode === 'subscription') {
        const result = await createSubscription()

        // Find approval URL
        const approvalUrl = result.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href
        if (approvalUrl) {
          window.location.href = approvalUrl
        } else {
          // If no redirect needed (already active or mock)
          setSuccess(true)
          onSuccess?.({
            subscriptionId: result.id,
            status: result.status,
          })
        }
        return
      }

      // Create order (one-time)
      const orderId = await createOrder()

      // For demo/mock mode - simulate approval
      if (orderId.startsWith('mock_')) {
        const result = await captureOrder(orderId)
        setSuccess(true)
        onSuccess?.({
          orderId: result.transactionId,
          status: 'COMPLETED',
          amount,
        })
        return
      }

      // Real PayPal flow - redirect to PayPal
      const paypalHost =
        process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live'
          ? 'https://www.paypal.com'
          : 'https://www.sandbox.paypal.com'
      const approvalUrl = `${paypalHost}/checkoutnow?token=${orderId}`
      window.location.href = approvalUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi thanh toán'
      setError(message)
      onError?.(message)
    } finally {
      setProcessing(false)
    }
  }, [amount, mode, createOrder, createSubscription, captureOrder, onSuccess, onError])

  // Success State
  if (success) {
    return (
      <div
        className={`rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center ${className}`}
      >
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-green-400 mb-2">Thanh Toán Thành Công!</h3>
        <p className="text-green-300/80">
          {mode === 'subscription' ? 'Đăng ký của bạn đã được kích hoạt.' : `Cảm ơn bạn đã thanh toán ${amount}`}
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">
          {mode === 'subscription' ? '💳 Đăng Ký PayPal' : '💳 Thanh Toán PayPal'}
        </h3>
        <p className="text-white/60 text-sm">
          {description} {amount ? `- $${amount} ${currency}` : ''}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* PayPal Button */}
      <button
        onClick={handlePayPalClick}
        disabled={loading || processing}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-white
          transition-all duration-200 flex items-center justify-center gap-3
          ${
            loading || processing
              ? 'bg-white/10 cursor-not-allowed'
              : 'bg-[#0070ba] hover:bg-[#003087] shadow-lg hover:shadow-xl'
          }
        `}
      >
        {processing ? (
          <>
            <span className="animate-spin inline-block">⏳</span>
            Đang xử lý...
          </>
        ) : loading ? (
          <>
            <span className="animate-spin inline-block">⏳</span>
            Đang tải PayPal...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
            </svg>
            Thanh Toán với PayPal
          </>
        )}
      </button>

      {/* Alternative: Card payment info */}
      <div className="mt-4 text-center">
        <p className="text-white/40 text-xs">Hoặc thanh toán bằng thẻ qua PayPal</p>
      </div>

      {/* Security Note */}
      <p className="text-center text-white/40 text-xs mt-4">
        🔒 Thanh toán được bảo mật bởi PayPal
      </p>
    </div>
  )
}

export default PayPalCheckout
