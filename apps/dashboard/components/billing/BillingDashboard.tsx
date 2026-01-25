'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  type LucideIcon
} from 'lucide-react'
import { AgencyCard } from '@/components/ui/agency-card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Billing Dashboard Component
 *
 * Displays subscription and billing information based on SCHEMA_SYNC.md User model:
 * - subscription_tier: 'free', 'starter', 'pro', 'franchise', 'enterprise'
 * - billing_status: 'active', 'trialing', 'past_due', 'canceled', 'incomplete'
 * - subscription_end_date: Current period end or cancellation date
 */

interface BillingData {
  subscription_tier: 'free' | 'starter' | 'pro' | 'franchise' | 'enterprise'
  billing_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  subscription_start_date: string | null
  subscription_end_date: string | null
  trial_end_date: string | null
  lifetime_value: number
  monthly_recurring_revenue: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

interface BillingDashboardProps {
  data?: BillingData
  loading?: boolean
  onUpgrade?: () => void
  onDowngrade?: () => void
  onManageBilling?: () => void
}

// Tier display configuration
const TIER_CONFIG: Record<string, { label: string; color: string; price: string }> = {
  free: { label: 'Free', color: 'from-gray-500 to-slate-500', price: '$0/mo' },
  starter: { label: 'Starter', color: 'from-blue-500 to-indigo-500', price: '$29/mo' },
  pro: { label: 'Pro', color: 'from-purple-500 to-pink-500', price: '$99/mo' },
  franchise: { label: 'Franchise', color: 'from-orange-500 to-red-500', price: '$299/mo' },
  enterprise: { label: 'Enterprise', color: 'from-emerald-500 to-teal-500', price: 'Custom' }
}

// Status indicator configuration
const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bgColor: string
  icon: LucideIcon
  description: string
}> = {
  active: {
    label: 'Active',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    icon: CheckCircle,
    description: 'Your subscription is active and current'
  },
  trialing: {
    label: 'Trial',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    icon: Calendar,
    description: 'You are in your free trial period'
  },
  past_due: {
    label: 'Past Due',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    icon: AlertCircle,
    description: 'Payment failed - please update your payment method'
  },
  canceled: {
    label: 'Canceled',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    icon: XCircle,
    description: 'Your subscription has been canceled'
  },
  incomplete: {
    label: 'Incomplete',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    icon: AlertCircle,
    description: 'Awaiting first payment confirmation'
  }
}

// Default data for demonstration
const DEFAULT_DATA: BillingData = {
  subscription_tier: 'pro',
  billing_status: 'active',
  subscription_start_date: '2024-01-15T00:00:00Z',
  subscription_end_date: '2024-02-15T00:00:00Z',
  trial_end_date: null,
  lifetime_value: 297.00,
  monthly_recurring_revenue: 99.00,
  stripe_customer_id: 'cus_demo_123',
  stripe_subscription_id: 'sub_demo_456'
}

/**
 * Calculate days remaining until subscription end
 */
function calculateDaysRemaining(endDate: string | null): number {
  if (!endDate) return 0
  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

/**
 * Format date
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString))
}

export function BillingDashboard({
  data = DEFAULT_DATA,
  loading = false,
  onUpgrade,
  onDowngrade,
  onManageBilling
}: BillingDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <AgencyCard key={i} className="h-48">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </AgencyCard>
        ))}
      </div>
    )
  }

  const tierConfig = TIER_CONFIG[data.subscription_tier]
  const statusConfig = STATUS_CONFIG[data.billing_status]
  const daysRemaining = calculateDaysRemaining(data.subscription_end_date)
  const isTrialing = data.billing_status === 'trialing'
  const isPastDue = data.billing_status === 'past_due'
  const isCanceled = data.billing_status === 'canceled'

  return (
    <div className="space-y-6">
      {/* Status Alert Banner */}
      {(isPastDue || isCanceled) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${statusConfig.bgColor} border border-${statusConfig.color.replace('text-', '')}/20 rounded-lg p-4`}
        >
          <div className="flex items-center gap-3">
            <statusConfig.icon className={`w-5 h-5 ${statusConfig.color}`} />
            <div className="flex-1">
              <p className="font-medium text-white">{statusConfig.label}</p>
              <p className="text-sm text-neutral-400">{statusConfig.description}</p>
            </div>
            {isPastDue && onManageBilling && (
              <button
                onClick={onManageBilling}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                Update Payment
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Billing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Current Tier Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <AgencyCard variant="glass-pro" className="relative overflow-hidden group hover-lift h-full">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
              <CreditCard className="w-12 h-12 text-white" />
            </div>
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tierConfig.color} flex items-center justify-center mb-3 shadow-lg`}>
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <p className="text-neutral-400 text-xs font-medium mb-1">Current Plan</p>
              <h3 className="text-2xl font-bold text-white mb-1">{tierConfig.label}</h3>
              <p className="text-sm text-neutral-300 font-medium">{tierConfig.price}</p>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                {data.subscription_tier !== 'enterprise' && onUpgrade && (
                  <button
                    onClick={onUpgrade}
                    className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    Upgrade
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
                {data.subscription_tier !== 'free' && onDowngrade && (
                  <button
                    onClick={onDowngrade}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"
                  >
                    Downgrade
                  </button>
                )}
              </div>
            </div>
          </AgencyCard>
        </motion.div>

        {/* Billing Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AgencyCard variant="glass-pro" className="relative overflow-hidden group hover-lift h-full">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <statusConfig.icon className="w-12 h-12 text-white" />
            </div>
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center mb-3`}>
                <statusConfig.icon className={`w-5 h-5 ${statusConfig.color}`} />
              </div>
              <p className="text-neutral-400 text-xs font-medium mb-1">Billing Status</p>
              <h3 className={`text-2xl font-bold mb-1 ${statusConfig.color}`}>{statusConfig.label}</h3>
              <p className="text-xs text-neutral-400">{statusConfig.description}</p>

              {/* Status Details */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Started</span>
                  <span className="text-white font-medium">{formatDate(data.subscription_start_date)}</span>
                </div>
              </div>
            </div>
          </AgencyCard>
        </motion.div>

        {/* Subscription Period Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AgencyCard variant="glass-pro" className="relative overflow-hidden group hover-lift h-full">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-3 shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <p className="text-neutral-400 text-xs font-medium mb-1">
                {isTrialing ? 'Trial Ends' : isCanceled ? 'Ended On' : 'Renews On'}
              </p>
              <h3 className="text-2xl font-bold text-white mb-1">
                {isTrialing && data.trial_end_date
                  ? formatDate(data.trial_end_date)
                  : formatDate(data.subscription_end_date)
                }
              </h3>

              {/* Days Countdown */}
              {!isCanceled && daysRemaining > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min((daysRemaining / 30) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-cyan-400 font-medium">{daysRemaining}d</span>
                </div>
              )}

              {/* Revenue Stats */}
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">MRR</span>
                  <span className="text-white font-medium">{formatCurrency(data.monthly_recurring_revenue)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Lifetime Value</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(data.lifetime_value)}</span>
                </div>
              </div>
            </div>
          </AgencyCard>
        </motion.div>
      </div>

      {/* Additional Info */}
      <AgencyCard variant="outlined" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white mb-1">Subscription Management</p>
            <p className="text-xs text-neutral-400">
              {data.stripe_subscription_id
                ? `Subscription ID: ${data.stripe_subscription_id.slice(0, 20)}...`
                : 'No active subscription'
              }
            </p>
          </div>
          {onManageBilling && (
            <button
              onClick={onManageBilling}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              Manage Billing
            </button>
          )}
        </div>
      </AgencyCard>
    </div>
  )
}
