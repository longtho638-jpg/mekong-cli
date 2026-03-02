/**
 * Shared Zod schemas for Fastify API layer.
 * Re-exports and extends existing domain schemas.
 */

import { z } from 'zod';
import { AlertRuleSchema, ALERT_METRICS, ALERT_OPERATORS, ALERT_ACTIONS } from '../../core/alert-rules-engine';

// ── Tenant schemas ────────────────────────────────────────────────────────────

export const CreateTenantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  maxStrategies: z.number().int().positive(),
  maxDailyLossUsd: z.number().positive(),
  maxPositionSizeUsd: z.number().positive(),
  allowedExchanges: z.array(z.string()).min(1),
  tier: z.enum(['free', 'pro', 'enterprise']),
});

export const AssignStrategySchema = z.object({
  strategyId: z.string().min(1),
  strategyName: z.string().min(1),
  accountName: z.string().min(1),
  configOverrides: z.record(z.string(), z.unknown()).optional(),
});

// ── Strategy marketplace schemas ──────────────────────────────────────────────

export const MarketplaceSearchSchema = z.object({
  type: z.string().optional(),
  minRating: z.coerce.number().optional(),
  tag: z.string().optional(),
  pair: z.string().optional(),
});

export const RateStrategySchema = z.object({
  rating: z.number().min(1).max(5),
});

// ── Backtest schemas ──────────────────────────────────────────────────────────

export const BacktestJobSchema = z.object({
  strategyId: z.string().min(1),
  symbol: z.string().min(1),
  days: z.number().int().positive().max(365),
  initialBalance: z.number().positive(),
  configOverrides: z.record(z.string(), z.unknown()).optional(),
});

// ── Alert schemas ─────────────────────────────────────────────────────────────

export { AlertRuleSchema, ALERT_METRICS, ALERT_OPERATORS, ALERT_ACTIONS };

export const EvaluateAlertsSchema = z.object({
  rules: z.array(AlertRuleSchema),
  metrics: z.object({
    drawdown_pct: z.number().optional(),
    daily_loss_usd: z.number().optional(),
    open_positions: z.number().optional(),
    win_rate: z.number().optional(),
  }),
});

export type CreateTenant = z.infer<typeof CreateTenantSchema>;
export type AssignStrategy = z.infer<typeof AssignStrategySchema>;
export type MarketplaceSearch = z.infer<typeof MarketplaceSearchSchema>;
export type BacktestJob = z.infer<typeof BacktestJobSchema>;
