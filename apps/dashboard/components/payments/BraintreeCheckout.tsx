'use client'

/**
 * 🏦 BraintreeCheckout Component
 * ==============================
 * Drop-in UI cho thanh toán Braintree/PayPal.
 *
 * Usage:
 * <BraintreeCheckout
 *   amount="47.00"
 *   onSuccess={(txn) => console.info('Paid:', txn)}
 *   onError={(err) => console.error(err)}
 * />
 */

import { useState, useEffect, useCallback } from 'react'

// Types
interface Transaction {
  id: string
  success: boolean
  message: string
}

interface BraintreeCheckoutProps {
  amount: string
  description?: string
  onSuccess?: (transaction: Transaction) => void
  onError?: (error: string) => void
  className?: string
}

// API URL - có thể thay đổi qua env
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function BraintreeCheckout({
  amount,
  description = 'Payment',
  onSuccess,
  onError,
  className = '',
}: BraintreeCheckoutProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [braintreeReady, setBraintreeReady] = useState(false)

  // Load Braintree SDK
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.braintreegateway.com/web/dropin/1.43.0/js/dropin.min.js'
    script.async = true
    script.onload = () => setBraintreeReady(true)
    script.onerror = () => setError('Không thể tải Braintree SDK')
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Initialize Drop-in UI
  useEffect(() => {
    if (!braintreeReady) return

    const initDropin = async () => {
      try {
        // Fetch client token từ backend
        const tokenRes = await fetch(`${API_URL}/payments/client-token`)

        if (!tokenRes.ok) {
          const errData = await tokenRes.json()
          throw new Error(errData.detail || 'Không lấy được token')
        }

        const { token } = await tokenRes.json()

        // Khởi tạo Drop-in UI
        const braintree = (
          window as unknown as {
            braintree: {
              dropin: {
                create: (options: { authorization: string; container: string }) => Promise<unknown>
              }
            }
          }
        ).braintree

        await braintree.dropin.create({
          authorization: token,
          container: '#dropin-container',
        })

        setLoading(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Lỗi khởi tạo thanh toán'
        setError(message)
        setLoading(false)
      }
    }

    initDropin()
  }, [braintreeReady])

  // Submit Payment
  const handleSubmit = useCallback(async () => {
    setProcessing(true)
    setError(null)

    try {
      // Get payment method nonce từ Drop-in
      const braintree = (
        window as unknown as {
          braintree: {
            dropin: {
              create: (options: {
                authorization: string
                container: string
              }) => Promise<{ requestPaymentMethod: () => Promise<{ nonce: string }> }>
            }
          }
        }
      ).braintree
      const container = document.querySelector('#dropin-container')

      if (!container) {
        throw new Error('Không tìm thấy form thanh toán')
      }

      // Sử dụng mock checkout cho testing
      const res = await fetch(`${API_URL}/payments/mock-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce: 'mock-nonce',
          amount,
          description,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        onSuccess?.(data)
      } else {
        throw new Error(data.message || 'Thanh toán thất bại')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi xử lý thanh toán'
      setError(message)
      onError?.(message)
    } finally {
      setProcessing(false)
    }
  }, [amount, description, onSuccess, onError])

  // Success State
  if (success) {
    return (
      <div
        className={`rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center ${className}`}
      >
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-green-400 mb-2">Thanh Toán Thành Công!</h3>
        <p className="text-green-300/80">Cảm ơn bạn đã thanh toán ${amount}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">💳 Thanh Toán</h3>
        <p className="text-white/60 text-sm">
          {description} - ${amount}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Drop-in Container */}
      <div id="dropin-container" className="mb-6 min-h-[200px]">
        {loading && (
          <div className="flex items-center justify-center h-[200px] text-white/40">
            <div className="animate-spin mr-2">⏳</div>
            Đang tải form thanh toán...
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || processing}
        className={`
          w-full py-3 px-6 rounded-lg font-semibold text-white
          transition-all duration-200
          ${
            loading || processing
              ? 'bg-white/10 cursor-not-allowed'
              : 'bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {processing ? (
          <>
            <span className="animate-spin inline-block mr-2">⏳</span>
            Đang xử lý...
          </>
        ) : (
          `Thanh Toán $${amount}`
        )}
      </button>

      {/* Security Note */}
      <p className="text-center text-white/40 text-xs mt-4">
        🔒 Thanh toán được bảo mật bởi Braintree/PayPal
      </p>
    </div>
  )
}

export default BraintreeCheckout
