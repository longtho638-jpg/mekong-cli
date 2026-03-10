/**
 * Liquidity Provider — manages LP positions on own DEX and external AMMs.
 * Optimizes fee yield vs impermanent loss (IL) using simple heuristics:
 *   - IL estimate = |price_change_pct| * 0.5 (simplified IL formula)
 *   - Stay in position if fee_yield > il_estimate
 *   - Withdraw if il_estimate > il_threshold
 * Mock: generates simulated fee accrual and IL over time.
 */

import { randomBytes } from 'crypto';

export interface LPConfig {
  /** IL threshold %. Withdraw if IL exceeds this. Default: 5. */
  ilThresholdPct: number;
  /** Target fee APY %. Default: 10. */
  targetFeeApyPct: number;
  /** Rebalance interval in ms (simulated). Default: 3600_000. */
  rebalanceIntervalMs: number;
}

export interface LPPosition {
  positionId: string;
  pool: string;
  token0Amount: number;
  token1Amount: number;
  entryPrice: number;
  currentPrice: number;
  feesEarned: number;
  ilEstimatePct: number;
  netPnlPct: number;
  isActive: boolean;
  openedAt: number;
}

export interface LPReport {
  positions: LPPosition[];
  totalFeesEarned: number;
  totalIlPct: number;
  activePositions: number;
  recommendation: 'hold' | 'rebalance' | 'withdraw';
  generatedAt: number;
}

const DEFAULT_CONFIG: LPConfig = {
  ilThresholdPct: 5,
  targetFeeApyPct: 10,
  rebalanceIntervalMs: 3_600_000,
};

export class LiquidityProvider {
  private readonly cfg: LPConfig;
  private positions: LPPosition[] = [];

  constructor(config: Partial<LPConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Open a new LP position on the given pool.
   * @param pool Pool identifier (e.g. 'ETH/USDC').
   * @param token0Amount Amount of token0 to deposit.
   * @param token1Amount Amount of token1 to deposit.
   * @param entryPrice Current price ratio at entry.
   */
  openPosition(
    pool: string,
    token0Amount: number,
    token1Amount: number,
    entryPrice: number,
  ): LPPosition {
    const positionId = randomBytes(6).toString('hex');
    const position: LPPosition = {
      positionId,
      pool,
      token0Amount,
      token1Amount,
      entryPrice,
      currentPrice: entryPrice,
      feesEarned: 0,
      ilEstimatePct: 0,
      netPnlPct: 0,
      isActive: true,
      openedAt: Date.now(),
    };
    this.positions.push(position);
    return { ...position };
  }

  /**
   * Update all positions with new market prices and accrued fees.
   * Calculates IL and net P&L. Returns updated LPReport.
   */
  updatePositions(priceUpdates: Record<string, number>): LPReport {
    for (const pos of this.positions) {
      if (!pos.isActive) continue;
      const newPrice = priceUpdates[pos.pool] ?? pos.currentPrice * (1 + (Math.random() - 0.5) * 0.02);
      const priceChangePct = Math.abs((newPrice - pos.entryPrice) / pos.entryPrice) * 100;

      // Simplified IL: ~0.5 * price_change_pct for small moves
      pos.ilEstimatePct = parseFloat((priceChangePct * 0.5).toFixed(4));
      pos.currentPrice = parseFloat(newPrice.toFixed(6));

      // Simulate fees: small random accrual per update cycle
      const feeAccrual = (pos.token0Amount + pos.token1Amount) * 0.0003 * (0.8 + Math.random() * 0.4);
      pos.feesEarned = parseFloat((pos.feesEarned + feeAccrual).toFixed(4));
      pos.netPnlPct = parseFloat((pos.feesEarned / (pos.token0Amount + pos.token1Amount) * 100 - pos.ilEstimatePct).toFixed(4));

      if (pos.ilEstimatePct > this.cfg.ilThresholdPct) {
        pos.isActive = false;
      }
    }
    return this.generateReport();
  }

  /** Generate summary report across all positions. */
  generateReport(): LPReport {
    const active = this.positions.filter((p) => p.isActive);
    const totalFees = this.positions.reduce((s, p) => s + p.feesEarned, 0);
    const avgIl = active.length
      ? active.reduce((s, p) => s + p.ilEstimatePct, 0) / active.length
      : 0;

    let recommendation: LPReport['recommendation'] = 'hold';
    if (avgIl > this.cfg.ilThresholdPct) recommendation = 'withdraw';
    else if (avgIl > this.cfg.ilThresholdPct * 0.6) recommendation = 'rebalance';

    return {
      positions: this.positions.map((p) => ({ ...p })),
      totalFeesEarned: parseFloat(totalFees.toFixed(4)),
      totalIlPct: parseFloat(avgIl.toFixed(4)),
      activePositions: active.length,
      recommendation,
      generatedAt: Date.now(),
    };
  }

  getPositions(): LPPosition[] {
    return this.positions.map((p) => ({ ...p }));
  }

  clearPositions(): void {
    this.positions.length = 0;
  }

  getConfig(): LPConfig {
    return { ...this.cfg };
  }
}
