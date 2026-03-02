/**
 * Shared interfaces for TenantArbPositionTracker.
 * Exported separately to keep the tracker file under 200 lines.
 */

export interface ArbPosition {
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
  /** Highest price observed since position opened */
  highWaterMark?: number;
  /** Current ATR-based trailing stop level */
  trailingStopPrice?: number;
  /** True when trailing stop has been hit and position auto-closed */
  trailingStopTriggered?: boolean;
}

export interface ArbStats {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  bestSpreadPct: number;
  avgPnl: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  symbol?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedHistory {
  items: ArbPosition[];
  total: number;
  page: number;
  limit: number;
}

export interface TrailingStopConfig {
  enabled: boolean;
  /** Stop placed at highWaterMark * (1 - atrMultiplier * ATR / highWaterMark), e.g. 2.0 */
  atrMultiplier: number;
  /** ATR look-back period, e.g. 14 */
  atrPeriod: number;
}
