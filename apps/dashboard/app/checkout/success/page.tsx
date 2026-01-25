/**
 * ✅ CHECKOUT SUCCESS PAGE
 * ========================
 * Handles successful PayPal payments
 *
 * Flow:
 * 1. Capture payment from PayPal token (URL param)
 * 2. Generate license key (AGY-{TENANT}-{TIMESTAMP}-{CHECKSUM})
 * 3. Display order confirmation
 * 4. Show next steps
 *
 * Architecture: PayPal → Success Page → Capture API → DB Update
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface CaptureResult {
  orderId: string
  transactionId: string
  status: string
  amount: string
  currency: string
  licenseKey: string
}

// Capture PayPal order via server-side API
async function capturePayPalOrder(orderId: string): Promise<CaptureResult> {
  const response = await fetch('/api/checkout/capture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to capture payment')
  }

  return response.json()
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const [result, setResult] = useState<CaptureResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token') // PayPal order ID
    if (!token) {
      setError('Missing payment token')
      setLoading(false)
      return
    }

    // Capture payment
    capturePayPalOrder(token)
      .then((data) => {
        setResult(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [searchParams])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-2">Đang xử lý thanh toán...</h2>
          <p className="text-white/60">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Thanh toán thất bại</h2>
          <p className="text-red-300/80 mb-6">{error}</p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
          >
            Thử lại
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-white mb-2">Thanh Toán Thành Công!</h1>
          <p className="text-white/60">Cảm ơn bạn đã tin tưởng AgencyOS</p>
        </div>

        {/* Order Details */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">📋 Chi Tiết Đơn Hàng</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/60">Mã đơn hàng:</span>
              <span className="text-white font-mono text-sm">{result?.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Mã giao dịch:</span>
              <span className="text-white font-mono text-sm">{result?.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Số tiền:</span>
              <span className="text-white font-semibold">{result?.amount} {result?.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Trạng thái:</span>
              <span className="text-green-400 font-semibold">{result?.status}</span>
            </div>
          </div>
        </div>

        {/* License Key */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔑 License Key</h3>
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <code className="text-blue-400 font-mono text-lg break-all">{result?.licenseKey}</code>
          </div>
          <p className="text-white/60 text-sm">
            ⚠️ Vui lòng lưu license key này. Bạn sẽ cần nó để kích hoạt tài khoản.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">🚀 Các Bước Tiếp Theo</h3>
          <ol className="space-y-3 text-white/80">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Kiểm tra email để nhận hướng dẫn kích hoạt</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Đăng nhập vào dashboard với license key</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Bắt đầu sử dụng các công cụ AI của AgencyOS</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold text-center hover:opacity-90 transition-opacity"
          >
            Vào Dashboard
          </Link>
          <Link
            href="/docs"
            className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold text-center hover:bg-white/20 transition-colors"
          >
            Xem Hướng Dẫn
          </Link>
        </div>

        {/* Support */}
        <p className="text-center text-white/40 text-sm mt-6">
          Cần hỗ trợ? <a href="mailto:support@agencyos.dev" className="text-blue-400 hover:underline">Liên hệ support</a>
        </p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-2">Đang tải...</h2>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
