/**
 * BullMQ job payload types and Zod validation schemas for all job queues.
 * Covers: backtest, strategy-scan, webhook-delivery queues.
 * All job data is validated at enqueue time via Zod.
 */

import { z } from 'zod';

// ─── Backtest Job ───────────────────────────────────────────────────────────

export const BacktestJobDataSchema = z.object({
  tenantId: z.string().min(1),
  strategyName: z.string().min(1),
  pair: z.string().min(1),           // e.g. 'BTC/USDT'
  timeframe: z.string().default('1m'),
  days: z.number().int().positive().max(365).default(30),
  initialBalance: z.number().positive().default(10000),
  feeRate: z.number().min(0).max(0.1).optional(),
  riskPercentage: z.number().min(0.1).max(100).optional(),
  slippageBps: z.number().min(0).max(500).optional(),
});

export type BacktestJobData = z.infer<typeof BacktestJobDataSchema>;

export interface BacktestJobResult {
  tenantId: string;
  strategyName: string;
  finalBalance: number;
  totalReturn: number;
  maxDrawdown: number;
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  completedAt: number;
}

// ─── Strategy Scan Job ──────────────────────────────────────────────────────

export const ScanJobDataSchema = z.object({
  tenantId: z.string().min(1),
  pairs: z.array(z.string()).min(1),
  exchange: z.string().default('binance'),
});

export type ScanJobData = z.infer<typeof ScanJobDataSchema>;

export interface ScanJobResult {
  tenantId: string;
  opportunitiesFound: number;
  pairs: string[];
  completedAt: number;
}

// ─── Webhook Delivery Job ───────────────────────────────────────────────────

export const WebhookJobDataSchema = z.object({
  tenantId: z.string().min(1),
  url: z.string().url(),
  payload: z.record(z.string(), z.unknown()),
  hmacSecret: z.string().optional(),
  eventType: z.string().default('signal'),
});

export type WebhookJobData = z.infer<typeof WebhookJobDataSchema>;

export interface WebhookJobResult {
  tenantId: string;
  url: string;
  statusCode: number;
  success: boolean;
  deliveredAt: number;
}

// ─── Queue Names ────────────────────────────────────────────────────────────

// ─── Optimization Job ──────────────────────────────────────────────────────
export const OptimizationJobDataSchema = z.object({
  tenantId: z.string().min(1),
  strategyName: z.string().min(1),
  pair: z.string().min(1),
  timeframe: z.string().default('1m'),
  days: z.number().int().positive().max(90).default(30),
  initialBalance: z.number().positive().default(10000),
  paramRanges: z.array(z.object({
    name: z.string(),
    values: z.array(z.number()),
  })).min(1).max(10),
  metric: z.enum(['sharpe', 'sortino', 'composite']).default('composite'),
});
export type OptimizationJobData = z.infer<typeof OptimizationJobDataSchema>;

export interface OptimizationJobResult {
  tenantId: string;
  strategyName: string;
  totalCombinations: number;
  bestParams: Record<string, number>;
  bestScore: number;
  topResults: Array<{ params: Record<string, number>; score: number; sharpe: number; maxDrawdown: number }>;
  completedAt: number;
}

export const QUEUE_NAMES = {
  BACKTEST: 'backtest',
  SCAN: 'strategy-scan',
  WEBHOOK: 'webhook-delivery',
  OPTIMIZATION: 'optimization',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ─── Redis Pub/Sub Channels ─────────────────────────────────────────────────

export const PUBSUB_CHANNELS = {
  backtest: (tenantId: string) => `backtest:done:${tenantId}`,
  signal: (tenantId: string) => `signal:${tenantId}`,
  trade: (tenantId: string) => `trade:${tenantId}`,
  optimization: (tenantId: string) => `optimization:${tenantId}:done`,
} as const;
