/**
 * @agencyos/vibe-subscription — Subscription Lifecycle SDK
 *
 * Reusable across all SaaS projects (sophia-ai-factory, agencyos-web, etc.).
 * Plan management, trial logic, upgrade/downgrade, churn prevention, usage metering.
 *
 * Usage:
 *   import { createSubscriptionEngine, PlanTier } from '@agencyos/vibe-subscription';
 *   const engine = createSubscriptionEngine({ trialDays: 14 });
 *
 * Sub-path imports:
 *   import { createChurnAnalyzer } from '@agencyos/vibe-subscription/churn-analyzer';
 *   import { createUsageMeter } from '@agencyos/vibe-subscription/usage-meter';
 *   import type { ProrateInput } from '@agencyos/vibe-subscription/proration-calculator';
 */

// ─── Core Types ─────────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'growth' | 'premium' | 'master' | 'enterprise';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  price: Record<BillingCycle, number>;
  currency: string;
  features: string[];
  limits: PlanLimits;
  trialDays: number;
}

export interface PlanLimits {
  maxUsers?: number;
  maxProjects?: number;
  maxStorage?: number; // MB
  maxApiCalls?: number; // per month
  maxRenders?: number; // for video SaaS
  [key: string]: number | undefined;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAt?: string;
  createdAt: string;
}

export interface UsageRecord {
  subscriptionId: string;
  metric: string;
  value: number;
  timestamp: string;
}

// ─── Subscription Engine ────────────────────────────────────────

export { createSubscriptionEngine } from './subscription-engine';
export type { SubscriptionEngineConfig } from './subscription-engine';

// ─── Usage Metering ─────────────────────────────────────────────

export { createUsageMeter } from './usage-meter';

// ─── Churn Prevention ───────────────────────────────────────────

export { createChurnAnalyzer } from './churn-analyzer';
export type { ChurnRisk, ChurnSignals, ChurnAssessment } from './churn-analyzer';

// ─── RaaS Modular SDK (Well-extracted) ──────────────────────────

// Types (provider-agnostic plan/subscription/org types)
export type {
  BillingCycle as RaaSBillingCycle,
  SubscriptionStatus as RaaSSubscriptionStatus,
  SubscriptionPlan,
  UserSubscription,
  ActivePlanInfo,
  Organization,
  OrgRole,
  OrgMember,
  FeatureGateConfig,
  OrgBillingDashboard,
  OrgRevenueMetrics,
} from './types';

// Feature gate utilities (pure logic)
export {
  canAccessFeature,
  getAccessibleFeatures,
  getMinPlanForFeature,
} from './feature-gate';

// Billing period utilities (pure date logic)
export {
  calculatePeriodEnd as calculateBillingPeriodEnd,
  isPeriodActive,
  daysRemaining as billingDaysRemaining,
} from './billing-period';

// Multi-org billing engine (dependency-injected orchestration)
export {
  resolveOrgSubscription,
  canOrgAccessFeature,
  getOrgAccessibleFeatures,
  computeActivationParams,
  needsRenewal,
} from './multi-org-billing-engine';

export type {
  OrgSubscriptionContext,
  OrgBillingDeps,
  SubscriptionActivationResult,
} from './multi-org-billing-engine';

// Proration calculator (mid-cycle plan changes)
export { calculateProration } from './proration-calculator';
export type { ProrateInput, ProrateResult } from './proration-calculator';

// Renewal scheduler (auto-renewal detection)
export {
  findRenewableSubscriptions,
  createRenewalIntent,
} from './renewal-scheduler';
export type {
  RenewalSchedulerConfig,
  RenewalIntent,
  RenewalSchedulerDeps,
} from './renewal-scheduler';
