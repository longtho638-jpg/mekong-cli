/**
 * Subscription Manager for AgencyOS
 * Handles plan management, upgrades, and billing status
 */

import { createClient } from '@supabase/supabase-js'
import type { PricingTier } from './stripe'
import {
  PRICING_TIERS,
  createCheckoutSession,
  cancelSubscription,
  updateSubscription,
} from './stripe'

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Subscription {
  id: string
  tenantId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  plan: PricingTier
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'

export interface UsageLimits {
  teamMembers: { used: number; limit: number }
  projects: { used: number; limit: number }
  storage: { used: number; limit: number; unit: string }
  apiCalls: { used: number; limit: number }
}

/** Raw subscription row from database */
interface SubscriptionRow {
  id: string
  tenant_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end?: boolean
  created_at: string
  updated_at: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 SUBSCRIPTION MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class SubscriptionManager {
  private supabase

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────────────────────

  async getSubscription(tenantId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error || !data) return null

    return this.mapToSubscription(data)
  }

  async getOrCreateSubscription(tenantId: string): Promise<Subscription> {
    let subscription = await this.getSubscription(tenantId)

    if (!subscription) {
      // Create free tier subscription
      const { data, error } = await this.supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantId,
          plan: 'FREE',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        })
        .select()
        .single()

      if (error) throw new Error(`Failed to create subscription: ${error.message}`)
      subscription = this.mapToSubscription(data)
    }

    return subscription
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UPGRADE / DOWNGRADE
  // ─────────────────────────────────────────────────────────────────────────────

  async initiateUpgrade(
    tenantId: string,
    targetPlan: PricingTier,
    email: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const tier = PRICING_TIERS[targetPlan]

    if (tier.price === 0) {
      throw new Error('Cannot upgrade to free tier')
    }

    if (!tier.stripePriceId) {
      throw new Error(`No Stripe price configured for ${targetPlan}`)
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      customerEmail: email,
      priceId: tier.stripePriceId,
      tenantId,
      successUrl,
      cancelUrl,
    })

    return session
  }

  async activateSubscription(
    tenantId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    plan: PricingTier
  ) {
    const { error } = await this.supabase
      .from('subscriptions')
      .update({
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        plan,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)

    if (error) throw new Error(`Failed to activate subscription: ${error.message}`)
  }

  async cancelSubscription(tenantId: string) {
    const subscription = await this.getSubscription(tenantId)

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription to cancel')
    }

    // Cancel at period end (graceful)
    await cancelSubscription(subscription.stripeSubscriptionId)

    // Update local record
    await this.supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
  }

  async changePlan(tenantId: string, newPlan: PricingTier) {
    const subscription = await this.getSubscription(tenantId)

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription')
    }

    const tier = PRICING_TIERS[newPlan]
    const priceId = 'stripePriceId' in tier ? tier.stripePriceId : undefined
    if (!priceId) {
      throw new Error(`No Stripe price for ${newPlan}`)
    }

    await updateSubscription(subscription.stripeSubscriptionId, priceId)

    await this.supabase
      .from('subscriptions')
      .update({
        plan: newPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // USAGE LIMITS
  // ─────────────────────────────────────────────────────────────────────────────

  async getUsageLimits(tenantId: string): Promise<UsageLimits> {
    const subscription = await this.getOrCreateSubscription(tenantId)
    const tier = PRICING_TIERS[subscription.plan]

    // Get actual usage from database
    const [teamCount, projectCount] = await Promise.all([
      this.getTeamMemberCount(tenantId),
      this.getProjectCount(tenantId),
    ])

    return {
      teamMembers: {
        used: teamCount,
        limit: tier.limits.teamMembers,
      },
      projects: {
        used: projectCount,
        limit: tier.limits.projects,
      },
      storage: {
        used: 0, // TODO: Calculate from storage
        limit: parseFloat(tier.limits.storage),
        unit: tier.limits.storage.replace(/[0-9]/g, ''),
      },
      apiCalls: {
        used: 0, // TODO: Track API usage
        limit: tier.limits.apiCalls,
      },
    }
  }

  async checkLimit(tenantId: string, resource: keyof UsageLimits): Promise<boolean> {
    const usage = await this.getUsageLimits(tenantId)
    const limit = usage[resource].limit

    // -1 means unlimited
    if (limit === -1) return true

    return usage[resource].used < limit
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async getTeamMemberCount(tenantId: string): Promise<number> {
    const { count } = await this.supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    return count || 0
  }

  private async getProjectCount(tenantId: string): Promise<number> {
    const { count } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    return count || 0
  }

  private mapToSubscription(data: SubscriptionRow): Subscription {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      plan: data.plan as PricingTier,
      status: data.status as SubscriptionStatus,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}

// Export singleton
export const subscriptionManager = new SubscriptionManager()
