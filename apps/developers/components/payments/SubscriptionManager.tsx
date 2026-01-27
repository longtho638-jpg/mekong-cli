'use client'

import { useState, useEffect, useCallback } from 'react'
import { MD3Card } from '../md3/MD3Card'
import { MD3Button } from '../md3/MD3Button'
import { MD3Text } from '../md3-dna/MD3Text'
import { PaymentCheckout } from './PaymentCheckout'

interface Subscription {
  id: string
  plan_id: string
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'APPROVAL_PENDING'
  next_billing_time?: string
  create_time?: string
}

interface SubscriptionManagerProps {
  subscriptionId?: string
  tenantId: string
  apiBaseUrl?: string
}

export function SubscriptionManager({
  subscriptionId,
  tenantId,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
}: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchSubscription = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`${apiBaseUrl}/payments/paypal/subscription/${id}`)
      if (!res.ok) throw new Error('Failed to fetch subscription')
      const data = await res.json()
      setSubscription(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback for demo purposes if API fails
      if (process.env.NODE_ENV === 'development') {
        setSubscription({
          id: id,
          plan_id: 'P-DEMO-PLAN-01',
          status: 'ACTIVE',
          next_billing_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          create_time: new Date().toISOString()
        })
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscription(subscriptionId)
    }
  }, [subscriptionId, fetchSubscription])

  const handleCancel = async () => {
    if (!subscription || !window.confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) return

    try {
      setCancelLoading(true)
      const res = await fetch(`${apiBaseUrl}/payments/paypal/subscription/${subscription.id}/cancel`, {
        method: 'POST'
      })

      if (!res.ok) throw new Error('Failed to cancel subscription')

      // Refresh state
      await fetchSubscription(subscription.id)
      alert('Subscription canceled successfully')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed'
      alert(msg)
    } finally {
      setCancelLoading(false)
    }
  }

  if (loading && !subscription) {
    return (
      <MD3Card className="w-full max-w-2xl animate-pulse">
        <div className="h-40 bg-white/5 rounded-xl"></div>
      </MD3Card>
    )
  }

  if (isUpgrading) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <MD3Text variant="headline-small">Upgrade Plan</MD3Text>
            <MD3Text variant="body-medium" color="on-surface-variant">
              Choose a plan that fits your needs
            </MD3Text>
          </div>
          <MD3Button variant="text" onClick={() => setIsUpgrading(false)}>
            Cancel
          </MD3Button>
        </div>

        {/* Plan Selection UI would go here - simplified for now */}
        <div className="grid md:grid-cols-2 gap-4">
            <MD3Card variant="outlined" className="cursor-pointer hover:border-[var(--md-sys-color-primary)] transition-colors">
                <MD3Text variant="title-medium">Warrior Plan</MD3Text>
                <MD3Text variant="display-small" className="my-2">$2,000<span className="text-sm text-white/50">/mo</span></MD3Text>
                <ul className="space-y-2 mb-4 text-sm text-white/70">
                    <li>✓ Pre-Seed / Seed Stage</li>
                    <li>✓ 5-8% Equity</li>
                    <li>✓ Survival & PMF Focus</li>
                </ul>
                <PaymentCheckout
                    gateway="paypal"
                    amount="2000"
                    mode="subscription"
                    planId="P-WARRIOR-001" // Example Plan ID
                    tenantId={tenantId}
                    description="Warrior Plan Subscription"
                    onSuccess={() => {
                        setIsUpgrading(false)
                        // Trigger refresh
                        if (subscriptionId) fetchSubscription(subscriptionId)
                    }}
                />
            </MD3Card>

            <MD3Card variant="outlined" className="cursor-pointer hover:border-[var(--md-sys-color-primary)] transition-colors">
                <MD3Text variant="title-medium">General Plan</MD3Text>
                <MD3Text variant="display-small" className="my-2">$5,000<span className="text-sm text-white/50">/mo</span></MD3Text>
                <ul className="space-y-2 mb-4 text-sm text-white/70">
                    <li>✓ Series A Stage</li>
                    <li>✓ +3-5% Additional Equity</li>
                    <li>✓ Scaling & Growth Focus</li>
                </ul>
                <PaymentCheckout
                    gateway="paypal"
                    amount="5000"
                    mode="subscription"
                    planId="P-GENERAL-001" // Example Plan ID
                    tenantId={tenantId}
                    description="General Plan Subscription"
                    onSuccess={() => {
                        setIsUpgrading(false)
                        if (subscriptionId) fetchSubscription(subscriptionId)
                    }}
                />
            </MD3Card>
        </div>
      </div>
    )
  }

  return (
    <MD3Card className="w-full max-w-3xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[var(--md-sys-color-outline-variant)] pb-4">
          <div>
            <MD3Text variant="headline-small" className="mb-1">Subscription Details</MD3Text>
            <MD3Text variant="body-medium" color="on-surface-variant">
              Manage your plan and billing preferences
            </MD3Text>
          </div>
          {subscription && (
            <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${
              subscription.status === 'ACTIVE'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {subscription.status}
            </div>
          )}
        </div>

        {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                <MD3Text variant="label-large" className="block mb-1">Error fetching subscription</MD3Text>
                {error}
            </div>
        )}

        {subscription ? (
          <div className="space-y-6">
            {/* Plan Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-high)]">
                <MD3Text variant="label-medium" color="on-surface-variant" className="mb-1">Current Plan</MD3Text>
                <MD3Text variant="headline-small">{subscription.plan_id}</MD3Text>
                <div className="mt-2 text-sm text-[var(--md-sys-color-primary)]">
                    {subscription.plan_id.includes('WARRIOR') ? 'Warrior Tier' :
                     subscription.plan_id.includes('GENERAL') ? 'General Tier' : 'Standard Plan'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container-high)]">
                <MD3Text variant="label-medium" color="on-surface-variant" className="mb-1">Next Billing</MD3Text>
                <MD3Text variant="headline-small">
                    {subscription.next_billing_time
                        ? new Date(subscription.next_billing_time).toLocaleDateString()
                        : 'N/A'}
                </MD3Text>
                <div className="mt-2 text-sm opacity-70">
                    ID: {subscription.id}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <MD3Button
                    variant="filled"
                    onClick={() => setIsUpgrading(true)}
                    className="flex-1"
                >
                    Change Plan
                </MD3Button>

                {subscription.status === 'ACTIVE' && (
                    <MD3Button
                        variant="outlined"
                        onClick={handleCancel}
                        disabled={cancelLoading}
                        className="text-red-400 border-red-400/50 hover:bg-red-500/10 hover:border-red-400"
                    >
                        {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
                    </MD3Button>
                )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MD3Text variant="body-large" className="mb-4">No active subscription found.</MD3Text>
            <MD3Button variant="filled" onClick={() => setIsUpgrading(true)}>
                Subscribe to a Plan
            </MD3Button>
          </div>
        )}
      </div>
    </MD3Card>
  )
}
