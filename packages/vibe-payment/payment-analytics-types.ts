/**
 * Vibe Payment SDK — Payment Analytics Types
 *
 * Pure type definitions for billing analytics dashboards.
 * Tracks payment metrics, revenue breakdowns, and event history.
 * No runtime dependencies — import types only.
 */

import type { PaymentProviderName, VibePaymentStatusCode } from './types';

// ─── Payment Event Tracking ────────────────────────────────────

/** Individual payment event for audit/analytics trail */
export interface PaymentEvent {
  id: string;
  orderCode: number;
  provider: PaymentProviderName;
  status: VibePaymentStatusCode;
  amount: number;
  currency: string;
  userId: string | null;
  orgId: string | null;
  isSubscription: boolean;
  planSlug: string | null;
  billingCycle: 'monthly' | 'yearly' | null;
  createdAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

// ─── Aggregated Metrics ────────────────────────────────────────

/** Summary metrics for a billing period */
export interface PaymentMetricsSummary {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  averageOrderValue: number;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  refundedAmount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

/** Revenue breakdown by time period */
export interface RevenueByPeriod {
  period: string;
  revenue: number;
  transactionCount: number;
  newSubscriptions: number;
  renewals: number;
  churned: number;
}

// ─── Query Interface ───────────────────────────────────────────

/** Query params for fetching payment analytics */
export interface PaymentAnalyticsQuery {
  startDate: string;
  endDate: string;
  provider?: PaymentProviderName;
  orgId?: string;
  groupBy?: 'day' | 'week' | 'month';
  includeRefunds?: boolean;
}
