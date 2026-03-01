/**
 * Vibe Subscription SDK — Billing Period Calculator (Pure Logic)
 *
 * Pure date utilities for subscription period management.
 * No database dependency — works with any billing system.
 */

import type { BillingCycle } from './types';

/**
 * Calculate the end date for a subscription period starting from a given date.
 */
export function calculatePeriodEnd(startDate: Date, cycle: BillingCycle): Date {
  const end = new Date(startDate);
  if (cycle === 'monthly') {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

/**
 * Check if a subscription period is still active (not expired).
 */
export function isPeriodActive(periodEnd: string | Date): boolean {
  const end = typeof periodEnd === 'string' ? new Date(periodEnd) : periodEnd;
  return end.getTime() > Date.now();
}

/**
 * Calculate days remaining in the current billing period.
 * Returns 0 if period has expired.
 */
export function daysRemaining(periodEnd: string | Date): number {
  const end = typeof periodEnd === 'string' ? new Date(periodEnd) : periodEnd;
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
