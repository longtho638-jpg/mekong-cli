'use client'

import React from 'react'
import { SubscriptionManager } from '@/components/payments/SubscriptionManager'
import { MD3Text } from '@/components/md3-dna/MD3Text'
import { MD3Card } from '@/components/md3/MD3Card'

export default function BillingPage() {
  // In a real application, these values would be retrieved from:
  // 1. Server-side session (cookies/JWT)
  // 2. Client-side auth context
  // For demonstration/dev purposes, we're using placeholders that would be replaced by real data

  // Example: const { user, tenant } = useAuth()
  const tenantId = 'tenant_demo_123'
  const subscriptionId = 'I-DEMO-SUB-001' // This would come from user profile/db

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <MD3Text variant="display-small" className="font-bold">
            Billing & Subscription
          </MD3Text>
          <MD3Text variant="body-large" color="on-surface-variant">
            Manage your plan, billing details, and invoices.
          </MD3Text>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Subscription Management */}
          <div className="lg:col-span-2 space-y-6">
            <SubscriptionManager
              tenantId={tenantId}
              subscriptionId={subscriptionId}
            />

            {/* Billing History Placeholder */}
            <MD3Card variant="outlined" className="w-full">
              <MD3Text variant="headline-small" className="mb-4">Billing History</MD3Text>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div>
                      <MD3Text variant="body-medium" className="font-medium">Invoice #INV-2024-00{i}</MD3Text>
                      <MD3Text variant="label-small" color="on-surface-variant">Jan {22 - i}, 2024</MD3Text>
                    </div>
                    <div className="text-right">
                      <MD3Text variant="body-medium">$2,000.00</MD3Text>
                      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            </MD3Card>
          </div>

          {/* Right Column: Support / Contact */}
          <div className="space-y-6">
            <MD3Card variant="filled" className="bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
              <MD3Text variant="title-medium" className="mb-2">Need Help?</MD3Text>
              <MD3Text variant="body-medium" className="mb-4 opacity-80">
                Contact our support team for questions about your billing or enterprise plans.
              </MD3Text>
              <button className="text-sm font-medium underline hover:text-[var(--md-sys-color-primary)]">
                Contact Support
              </button>
            </MD3Card>

            <MD3Card variant="outlined">
              <MD3Text variant="title-medium" className="mb-3">Payment Methods</MD3Text>
              <div className="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/10">
                <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-bold">
                    PP
                </div>
                <div className="flex-1">
                    <MD3Text variant="body-small">PayPal Account</MD3Text>
                    <MD3Text variant="label-small" color="on-surface-variant">user@example.com</MD3Text>
                </div>
                <span className="text-xs text-[var(--md-sys-color-primary)]">Primary</span>
              </div>
            </MD3Card>
          </div>

        </div>
      </div>
    </div>
  )
}
