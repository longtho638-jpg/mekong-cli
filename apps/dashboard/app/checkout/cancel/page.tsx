/**
 * ❌ CHECKOUT CANCEL PAGE
 * =======================
 * Handles cancelled PayPal payments
 *
 * Flow:
 * 1. User cancels payment on PayPal
 * 2. Redirected to this page
 * 3. Display friendly message
 * 4. Offer retry or support options
 *
 * Architecture: PayPal Cancel → This Page → User Options
 */

'use client'

import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-2">Thanh Toán Đã Hủy</h1>
          <p className="text-white/60">Giao dịch của bạn đã được hủy bỏ</p>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-500/10 rounded-xl border border-yellow-500/20 p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">📌 Điều gì đã xảy ra?</h3>
          <p className="text-white/80 text-sm leading-relaxed">
            Bạn đã hủy thanh toán trên PayPal. Đơn hàng của bạn chưa được xử lý và bạn chưa bị trừ tiền.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">🤔 Bạn muốn làm gì tiếp theo?</h3>
          <ul className="space-y-3 text-white/80 text-sm">
            <li className="flex gap-3">
              <span className="text-blue-400">•</span>
              <span>Thử lại thanh toán với phương thức khác</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">•</span>
              <span>Xem lại các gói dịch vụ khác</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">•</span>
              <span>Liên hệ support để được tư vấn</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold text-center hover:opacity-90 transition-opacity"
          >
            🔄 Thử Lại Thanh Toán
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-white/10 text-white rounded-lg font-semibold text-center hover:bg-white/20 transition-colors"
          >
            🏠 Về Trang Chủ
          </Link>
        </div>

        {/* Support Section */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span>💬</span>
            <span>Cần Hỗ Trợ?</span>
          </h4>
          <p className="text-white/60 text-sm mb-3">
            Đội ngũ của chúng tôi luôn sẵn sàng giúp bạn giải đáp thắc mắc về thanh toán.
          </p>
          <div className="flex gap-3">
            <a
              href="mailto:support@agencyos.dev"
              className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium text-center hover:bg-blue-500/30 transition-colors"
            >
              📧 Email Support
            </a>
            <a
              href="https://t.me/agencyos"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium text-center hover:bg-blue-500/30 transition-colors"
            >
              💬 Live Chat
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-6">
          <details className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <summary className="px-4 py-3 text-white font-semibold cursor-pointer hover:bg-white/10 transition-colors">
              ❓ Tại sao thanh toán bị hủy?
            </summary>
            <div className="px-4 py-3 text-white/70 text-sm border-t border-white/10">
              <p className="mb-2">Một số lý do phổ biến:</p>
              <ul className="space-y-1 ml-4">
                <li>• Bạn nhấn nút "Cancel" trên PayPal</li>
                <li>• Đóng cửa sổ thanh toán giữa chừng</li>
                <li>• Phiên làm việc hết hạn (timeout)</li>
                <li>• Vấn đề kết nối mạng</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
