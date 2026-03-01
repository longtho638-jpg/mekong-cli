/**
 * Vibe Subscription SDK — Proration Calculator for Mid-Cycle Plan Changes
 *
 * Pure logic for calculating prorated amounts when upgrading/downgrading
 * subscription plans mid-billing-cycle. No database or provider dependencies.
 */

// ─── Types ──────────────────────────────────────────────────────

export interface ProrateInput {
  /** Current plan price per period (VND) */
  currentPlanPrice: number;
  /** New plan price per period (VND) */
  newPlanPrice: number;
  /** Current period start date */
  periodStart: string | Date;
  /** Current period end date */
  periodEnd: string | Date;
  /** Date of the plan change (defaults to now) */
  changeDate?: string | Date;
}

export interface ProrateResult {
  /** Amount to charge (positive) or credit (negative) */
  adjustmentAmount: number;
  /** Days already used in current period */
  daysUsed: number;
  /** Total days in current period */
  totalDays: number;
  /** Days remaining in current period */
  daysRemaining: number;
  /** Unused credit from current plan */
  unusedCredit: number;
  /** Cost for remaining days on new plan */
  newPlanCost: number;
  /** Is this an upgrade (positive adjustment) or downgrade (negative/zero)? */
  isUpgrade: boolean;
}

// ─── Calculator ─────────────────────────────────────────────────

/**
 * Calculate prorated adjustment for a mid-cycle plan change.
 * Returns the net amount to charge or credit.
 */
export function calculateProration(input: ProrateInput): ProrateResult {
  const periodStart = toDate(input.periodStart);
  const periodEnd = toDate(input.periodEnd);
  const changeDate = input.changeDate ? toDate(input.changeDate) : new Date();

  const totalDays = daysBetween(periodStart, periodEnd);
  const daysUsed = daysBetween(periodStart, changeDate);
  const daysRemaining = Math.max(0, totalDays - daysUsed);

  if (totalDays <= 0) {
    return {
      adjustmentAmount: input.newPlanPrice,
      daysUsed: 0,
      totalDays: 0,
      daysRemaining: 0,
      unusedCredit: 0,
      newPlanCost: input.newPlanPrice,
      isUpgrade: input.newPlanPrice > input.currentPlanPrice,
    };
  }

  const dailyRateCurrent = input.currentPlanPrice / totalDays;
  const dailyRateNew = input.newPlanPrice / totalDays;

  const unusedCredit = Math.round(dailyRateCurrent * daysRemaining);
  const newPlanCost = Math.round(dailyRateNew * daysRemaining);
  const adjustmentAmount = newPlanCost - unusedCredit;

  return {
    adjustmentAmount,
    daysUsed,
    totalDays,
    daysRemaining,
    unusedCredit,
    newPlanCost,
    isUpgrade: input.newPlanPrice > input.currentPlanPrice,
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function toDate(d: string | Date): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

function daysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
