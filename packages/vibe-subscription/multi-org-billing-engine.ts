/**
 * Vibe Subscription SDK — Multi-Org Billing Engine (Pure Logic)
 *
 * Provider-agnostic org-level subscription orchestration.
 * Handles: org plan resolution, org-scoped feature gates,
 * subscription-tenant binding for RaaS multi-org scenarios.
 *
 * No database dependency — works with any data source via dependency injection.
 */

import type {
  ActivePlanInfo,
  BillingCycle,
  FeatureGateConfig,
  Organization,
  SubscriptionPlan,
  UserSubscription,
} from './types';
import { canAccessFeature, getAccessibleFeatures } from './feature-gate';
import { calculatePeriodEnd, daysRemaining, isPeriodActive } from './billing-period';

// ─── Multi-Org Billing Types ──────────────────────────────────

/** Subscription scoped to an org (not just a user) */
export interface OrgSubscriptionContext {
  org: Organization;
  subscription: UserSubscription | null;
  activePlan: ActivePlanInfo | null;
  isActive: boolean;
  daysLeft: number;
}

/** Dependency injection for org billing operations */
export interface OrgBillingDeps {
  getOrgById: (orgId: string) => Promise<Organization | null>;
  getOrgSubscription: (orgId: string) => Promise<UserSubscription | null>;
  getOrgActivePlan: (orgId: string) => Promise<ActivePlanInfo | null>;
  getPlanById: (planId: string) => Promise<SubscriptionPlan | null>;
}

/** Result of subscription activation after payment */
export interface SubscriptionActivationResult {
  subscriptionId: string;
  orgId: string | null;
  userId: string;
  planId: string;
  billingCycle: BillingCycle;
  periodEnd: Date;
  status: 'activated' | 'renewed';
}

// ─── Org Subscription Resolution ──────────────────────────────

/**
 * Resolve the full subscription context for an organization.
 * Pure orchestration — no side effects, delegates to injected deps.
 */
export async function resolveOrgSubscription(
  orgId: string,
  deps: OrgBillingDeps,
): Promise<OrgSubscriptionContext | null> {
  const org = await deps.getOrgById(orgId);
  if (!org) return null;

  const [subscription, activePlan] = await Promise.all([
    deps.getOrgSubscription(orgId),
    deps.getOrgActivePlan(orgId),
  ]);

  const isActive = subscription
    ? isPeriodActive(subscription.current_period_end)
    : false;

  const daysLeft = subscription
    ? daysRemaining(subscription.current_period_end)
    : 0;

  return { org, subscription, activePlan, isActive, daysLeft };
}

// ─── Org-Scoped Feature Gate ──────────────────────────────────

/**
 * Check if an org has access to a feature based on its subscription plan.
 */
export async function canOrgAccessFeature(
  orgId: string,
  feature: string,
  config: FeatureGateConfig,
  deps: OrgBillingDeps,
): Promise<boolean> {
  const activePlan = await deps.getOrgActivePlan(orgId);
  if (!activePlan) return false;
  return canAccessFeature(activePlan.plan_slug, feature, config);
}

/**
 * Get all features accessible by an org's current plan.
 */
export async function getOrgAccessibleFeatures(
  orgId: string,
  config: FeatureGateConfig,
  deps: OrgBillingDeps,
): Promise<string[]> {
  const activePlan = await deps.getOrgActivePlan(orgId);
  if (!activePlan) return [];
  return getAccessibleFeatures(activePlan.plan_slug, config);
}

// ─── Subscription Lifecycle Calculations ──────────────────────

/**
 * Calculate activation params for a new or renewed subscription.
 * Pure function — returns data needed to write to DB.
 */
export function computeActivationParams(params: {
  userId: string;
  planId: string;
  billingCycle: BillingCycle;
  orgId?: string | null;
  existingSubscriptionId?: string;
}): {
  periodEnd: Date;
  status: 'activated' | 'renewed';
  data: {
    user_id: string;
    plan_id: string;
    billing_cycle: BillingCycle;
    org_id: string | null;
    status: 'active';
    current_period_end: string;
    last_payment_at: string;
    next_payment_at: string;
  };
} {
  const periodEnd = calculatePeriodEnd(new Date(), params.billingCycle);
  const now = new Date().toISOString();

  return {
    periodEnd,
    status: params.existingSubscriptionId ? 'renewed' : 'activated',
    data: {
      user_id: params.userId,
      plan_id: params.planId,
      billing_cycle: params.billingCycle,
      org_id: params.orgId ?? null,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      last_payment_at: now,
      next_payment_at: periodEnd.toISOString(),
    },
  };
}

/**
 * Determine if a subscription needs renewal (within grace period).
 */
export function needsRenewal(
  subscription: UserSubscription,
  graceDays: number = 3,
): boolean {
  if (subscription.status !== 'active') return false;
  const remaining = daysRemaining(subscription.current_period_end);
  return remaining <= graceDays;
}
