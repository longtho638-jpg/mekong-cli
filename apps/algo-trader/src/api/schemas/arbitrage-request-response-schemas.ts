/**
 * Zod schemas for arbitrage API endpoints — request validation + response types.
 */

import { z } from 'zod';

// ── Request schemas ────────────────────────────────────────────────────────────

export const ArbScanRequestSchema = z.object({
  symbols: z.array(z.string()).min(1).default(['BTC/USDT']),
  exchanges: z.array(z.string()).min(2).default(['binance', 'okx', 'bybit']),
  minSpreadPct: z.number().min(0).default(0.05),
});

export const ArbExecuteRequestSchema = z.object({
  symbol: z.string().min(1),
  buyExchange: z.string().min(1),
  sellExchange: z.string().min(1),
  amount: z.number().positive(),
  maxSlippagePct: z.number().min(0).default(0.1),
  /** Requested leverage multiplier (1x = spot, max 20x for enterprise) */
  leverage: z.number().min(1).max(20).default(1),
});

export const ArbHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  symbol: z.string().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

// ── Response types ─────────────────────────────────────────────────────────────

export interface SpreadResult {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spreadPct: number;
  profitable: boolean;
}

export interface ArbScanResponse {
  scannedAt: number;
  spreads: SpreadResult[];
  profitable: SpreadResult[];
}

export interface ArbExecuteResponse {
  positionId: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  amount: number;
  leverage: number;
  buyPrice: number;
  sellPrice: number;
  netSpreadPct: number;
  status: 'open' | 'closed' | 'failed';
  openedAt: number;
}

export interface ArbPositionResponse {
  id: string;
  tenantId: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  amount: number;
  netSpreadPct: number;
  pnl: number;
  status: 'open' | 'closed' | 'failed';
  openedAt: number;
  closedAt?: number;
}

export interface ArbStatsResponse {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  bestSpreadPct: number;
  avgPnl: number;
}

export type ArbScanRequest = z.infer<typeof ArbScanRequestSchema>;
export type ArbExecuteRequest = z.infer<typeof ArbExecuteRequestSchema>;
export type ArbHistoryQuery = z.infer<typeof ArbHistoryQuerySchema>;
