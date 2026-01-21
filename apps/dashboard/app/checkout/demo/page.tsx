'use client'

/**
 * 💳 Trang Demo Thanh Toán PayPal SDK v6
 * ======================================
 * Demo checkout với nhiều mức giá.
 */

import { useState } from 'react'
import { PayPalCheckout } from '@/components/payments'

const PRODUCTS = [
  {
    id: 'starter',
    name: 'Vibe Starter',
    price: '47.00',
    description: 'Next.js Dashboard Template',
  },
  { id: 'api', name: 'FastAPI Starter', price: '37.00', description: 'Python API Boilerplate' },
  { id: 'vscode', name: 'VSCode Pack', price: '0.00', description: 'FREE Developer Settings' },
]

export default function CheckoutDemoPage() {
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0])
  const [lastTransaction, setLastTransaction] = useState<{ id: string; message: string } | null>(
    null
  )

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">💳 Demo Thanh Toán PayPal</h1>
          <p className="text-white/60">Chọn sản phẩm và thử thanh toán (SDK v6)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">📦 Chọn Sản Phẩm</h2>

            {PRODUCTS.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`
                  w-full p-4 rounded-xl border text-left transition-all
                  ${
                    selectedProduct.id === product.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }
                `}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-white">{product.name}</h3>
                    <p className="text-white/60 text-sm">{product.description}</p>
                  </div>
                  <div className="text-xl font-bold text-white">${product.price}</div>
                </div>
              </button>
            ))}

            {/* Last Transaction */}
            {lastTransaction && (
              <div className="mt-6 p-4 rounded-xl border border-green-500/20 bg-green-500/10">
                <h4 className="font-semibold text-green-400 mb-1">✅ Giao Dịch Gần Nhất</h4>
                <p className="text-green-300/80 text-sm">ID: {lastTransaction.id}</p>
                <p className="text-green-300/60 text-xs">{lastTransaction.message}</p>
              </div>
            )}
          </div>

          {/* Checkout Form */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">💳 Thanh Toán</h2>

            <PayPalCheckout
              amount={selectedProduct.price}
              description={selectedProduct.name}
              onSuccess={(txn) => {
                setLastTransaction({
                  id: txn.orderId || txn.subscriptionId || 'unknown',
                  message: `Paid $${txn.amount || selectedProduct.price}`
                })
              }}
              onError={() => {
                // Error is displayed in PayPalCheckout component
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="mt-12 text-center text-white/40 text-sm">
          <p>
            🔧 Đang ở chế độ <strong>Sandbox</strong> - Không thu tiền thật
          </p>
          <p className="mt-1">
            Cấu hình PayPal trong <code>.env</code> để bật thanh toán thật
          </p>
        </div>
      </div>
    </div>
  )
}
