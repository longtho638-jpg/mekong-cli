'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCartStore } from '@/lib/cart'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCartStore()
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    if (sessionId && !cleared) {
      clearCart()
      setCleared(true)
    } else if (!sessionId) {
      router.push('/')
    }
  }, [sessionId, clearCart, cleared, router])

  if (!sessionId) return null

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
      <div className="rounded-full bg-green-100 p-6 dark:bg-green-900">
        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for your purchase. We&apos;ll send you an email with your order
          details shortly.
        </p>
        <p className="text-sm text-muted-foreground">
          Order Reference: {sessionId.slice(-8)}
        </p>
      </div>
      <div className="pt-6">
        <Link href="/products">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
