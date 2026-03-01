/**
 * Vibe Subscription SDK — Renewal Scheduler (Pure Logic)
 *
 * Detects subscriptions nearing expiry and generates renewal intents.
 * Provider-agnostic — works with any billing system via dependency injection.
 */

import type { BillingCycle, UserSubscription } from './types';

// ─── Types ──────────────────────────────────────────────────────

export interface RenewalSchedulerConfig {
  /** Days before expiry to trigger renewal (default: 3) */
  graceDays: number;
  /** Max subscriptions to process per batch (default: 100) */
  batchSize: number;
}

export interface RenewalIntent {
  subscriptionId: string;
  userId: string;
  planId: string;
  orgId: string | null;
  billingCycle: BillingCycle;
  currentPeriodEnd: string;
  daysUntilExpiry: number;
  renewalAmount: number;
}

export interface RenewalSchedulerDeps {
  /** Fetch subscriptions expiring within N days */
  findExpiringSubscriptions: (
    withinDays: number,
    limit: number,
  ) => Promise<UserSubscription[]>;
  /** Get plan price for renewal amount */
  getPlanPrice: (planId: string, cycle: BillingCycle) => Promise<number>;
}

const DEFAULT_CONFIG: RenewalSchedulerConfig = {
  graceDays: 3,
  batchSize: 100,
};

// ─── Scheduler Logic ────────────────────────────────────────────

/**
 * Find all subscriptions that need renewal within the grace period.
 * Returns renewal intents ready for payment processing.
 */
export async function findRenewableSubscriptions(
  deps: RenewalSchedulerDeps,
  config: Partial<RenewalSchedulerConfig> = {},
): Promise<RenewalIntent[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const expiring = await deps.findExpiringSubscriptions(
    cfg.graceDays,
    cfg.batchSize,
  );

  const intents: RenewalIntent[] = [];

  for (const sub of expiring) {
    if (sub.status !== 'active') continue;
    if (sub.canceled_at) continue;

    const renewalAmount = await deps.getPlanPrice(
      sub.plan_id,
      sub.billing_cycle,
    );

    intents.push(
      createRenewalIntent(sub, renewalAmount),
    );
  }

  return intents;
}

/**
 * Create a renewal intent from an expiring subscription.
 * Pure function — no side effects.
 */
export function createRenewalIntent(
  subscription: UserSubscription,
  renewalAmount: number,
): RenewalIntent {
  const periodEnd = new Date(subscription.current_period_end);
  const daysUntilExpiry = Math.max(
    0,
    Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return {
    subscriptionId: subscription.id,
    userId: subscription.user_id,
    planId: subscription.plan_id,
    orgId: subscription.org_id,
    billingCycle: subscription.billing_cycle,
    currentPeriodEnd: subscription.current_period_end,
    daysUntilExpiry,
    renewalAmount,
  };
}
