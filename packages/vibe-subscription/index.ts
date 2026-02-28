/**
 * @agencyos/vibe-subscription — Subscription Lifecycle SDK
 *
 * Reusable across all SaaS projects (sophia-ai-factory, agencyos-web, etc.).
 * Plan management, trial logic, upgrade/downgrade, churn prevention, usage metering.
 *
 * Usage:
 *   import { createSubscriptionEngine, PlanTier } from '@agencyos/vibe-subscription';
 *   const engine = createSubscriptionEngine({ trialDays: 14 });
 *   const sub = engine.createSubscription({ userId: '...', plan: 'growth' });
 */

// ─── Types ──────────────────────────────────────────────────────

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

export interface SubscriptionEngineConfig {
  trialDays: number;
  gracePeriodDays?: number;
}

export function createSubscriptionEngine(config: SubscriptionEngineConfig) {
  const { trialDays, gracePeriodDays = 3 } = config;

  return {
    /**
     * Tính ngày kết thúc period dựa trên billing cycle
     */
    calculatePeriodEnd(startDate: Date, cycle: BillingCycle): Date {
      const end = new Date(startDate);
      switch (cycle) {
        case 'monthly': end.setMonth(end.getMonth() + 1); break;
        case 'quarterly': end.setMonth(end.getMonth() + 3); break;
        case 'yearly': end.setFullYear(end.getFullYear() + 1); break;
      }
      return end;
    },

    /**
     * Tính trial end date
     */
    calculateTrialEnd(startDate: Date): Date {
      const end = new Date(startDate);
      end.setDate(end.getDate() + trialDays);
      return end;
    },

    /**
     * Check subscription còn trong trial không
     */
    isInTrial(subscription: Subscription): boolean {
      if (subscription.status !== 'trialing' || !subscription.trialEnd) return false;
      return new Date() < new Date(subscription.trialEnd);
    },

    /**
     * Check subscription đã hết hạn chưa (có grace period)
     */
    isExpired(subscription: Subscription): boolean {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      periodEnd.setDate(periodEnd.getDate() + gracePeriodDays);
      return new Date() > periodEnd;
    },

    /**
     * Xác định có thể upgrade/downgrade không
     */
    canChangePlan(current: PlanTier, target: PlanTier): { allowed: boolean; direction: 'upgrade' | 'downgrade' | 'same' } {
      const tiers: PlanTier[] = ['free', 'starter', 'growth', 'premium', 'master', 'enterprise'];
      const currentIdx = tiers.indexOf(current);
      const targetIdx = tiers.indexOf(target);
      if (currentIdx === targetIdx) return { allowed: false, direction: 'same' };
      return { allowed: true, direction: targetIdx > currentIdx ? 'upgrade' : 'downgrade' };
    },

    /**
     * Tính proration khi upgrade/downgrade giữa cycle
     */
    calculateProration(
      currentPrice: number,
      newPrice: number,
      daysRemaining: number,
      totalDays: number,
    ): { credit: number; charge: number; net: number } {
      const dailyOld = currentPrice / totalDays;
      const dailyNew = newPrice / totalDays;
      const credit = Math.round(dailyOld * daysRemaining);
      const charge = Math.round(dailyNew * daysRemaining);
      return { credit, charge, net: charge - credit };
    },

    /**
     * Tính yearly discount so với monthly
     */
    calculateYearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
      const monthlyTotal = monthlyPrice * 12;
      return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
    },
  };
}

// ─── Usage Metering ─────────────────────────────────────────────

export function createUsageMeter() {
  return {
    /**
     * Check usage có vượt limit không
     */
    checkLimit(currentUsage: number, limit: number | undefined): { withinLimit: boolean; usagePercent: number } {
      if (limit === undefined) return { withinLimit: true, usagePercent: 0 };
      const usagePercent = Math.round((currentUsage / limit) * 100);
      return { withinLimit: currentUsage <= limit, usagePercent };
    },

    /**
     * Tính overage charge
     */
    calculateOverage(currentUsage: number, limit: number, overageRate: number): number {
      if (currentUsage <= limit) return 0;
      return Math.round((currentUsage - limit) * overageRate);
    },

    /**
     * Gợi ý upgrade khi usage gần limit
     */
    shouldSuggestUpgrade(usagePercent: number, threshold: number = 80): boolean {
      return usagePercent >= threshold;
    },
  };
}

// ─── Churn Prevention ───────────────────────────────────────────

export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical';

export function createChurnAnalyzer() {
  return {
    /**
     * Đánh giá risk churn dựa trên signals
     */
    assessRisk(signals: {
      daysSinceLastLogin: number;
      usageDeclinePercent: number;
      supportTickets: number;
      failedPayments: number;
    }): { risk: ChurnRisk; score: number; actions: string[] } {
      let score = 0;
      const actions: string[] = [];

      if (signals.daysSinceLastLogin > 30) { score += 30; actions.push('Gửi re-engagement email'); }
      else if (signals.daysSinceLastLogin > 14) { score += 15; actions.push('Gửi usage tips email'); }

      if (signals.usageDeclinePercent > 50) { score += 25; actions.push('Offer personalized onboarding'); }
      else if (signals.usageDeclinePercent > 25) { score += 10; actions.push('Share feature highlights'); }

      if (signals.supportTickets > 3) { score += 20; actions.push('Escalate to customer success'); }
      if (signals.failedPayments > 0) { score += 25; actions.push('Update payment method reminder'); }

      let risk: ChurnRisk = 'low';
      if (score >= 70) risk = 'critical';
      else if (score >= 50) risk = 'high';
      else if (score >= 25) risk = 'medium';

      return { risk, score, actions };
    },
  };
}
