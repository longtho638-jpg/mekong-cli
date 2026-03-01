/**
 * Subscription Engine — core lifecycle logic for plan management
 *
 * Handles billing cycle calculations, trial management, plan changes,
 * proration, and yearly discount computation.
 */

import type { BillingCycle, PlanTier, Subscription } from './index';

// ─── Config ─────────────────────────────────────────────────────

export interface SubscriptionEngineConfig {
  trialDays: number;
  gracePeriodDays?: number;
}

// ─── Engine Factory ─────────────────────────────────────────────

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
