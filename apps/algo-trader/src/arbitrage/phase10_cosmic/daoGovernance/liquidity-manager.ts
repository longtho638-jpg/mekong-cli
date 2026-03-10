/**
 * Liquidity Manager — Treasury management for stablecoins and LP tokens.
 * Tracks balances, liquidity positions, and yield accrual (mock).
 * All ops default to dry-run mode.
 */

import { randomBytes } from 'crypto';

export interface LiquidityManagerConfig {
  /** Supported asset symbols. Default: ['USDC', 'USDT', 'DAI']. */
  supportedAssets: string[];
  /** Annual yield rate for LP positions (0.05 = 5%). Default: 0.05. */
  baseYieldRate: number;
  /** Dry-run: skip state changes. Default: true. */
  dryRun: boolean;
}

export interface TreasuryBalance {
  asset: string;
  balance: number;
  lpBalance: number;
  yieldEarned: number;
  lastUpdatedAt: number;
}

interface LpPosition {
  positionId: string;
  asset: string;
  amount: number;
  openedAt: number;
}

const DEFAULT_CONFIG: LiquidityManagerConfig = {
  supportedAssets: ['USDC', 'USDT', 'DAI'],
  baseYieldRate: 0.05,
  dryRun: true,
};

export class LiquidityManager {
  private readonly cfg: LiquidityManagerConfig;
  private balances: Map<string, number> = new Map();
  private lpPositions: Map<string, LpPosition> = new Map();
  private yieldAccrued: Map<string, number> = new Map();

  constructor(config: Partial<LiquidityManagerConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    for (const asset of this.cfg.supportedAssets) {
      this.balances.set(asset, 0);
      this.yieldAccrued.set(asset, 0);
    }
  }

  /** Deposit tokens into treasury. */
  deposit(asset: string, amount: number): void {
    this.assertSupported(asset);
    if (amount <= 0) throw new Error('deposit: amount must be positive');
    if (this.cfg.dryRun) return;
    const prev = this.balances.get(asset) ?? 0;
    this.balances.set(asset, prev + amount);
  }

  /** Withdraw tokens from treasury. Throws if insufficient balance. */
  withdraw(asset: string, amount: number): void {
    this.assertSupported(asset);
    if (amount <= 0) throw new Error('withdraw: amount must be positive');
    if (this.cfg.dryRun) return;
    const current = this.balances.get(asset) ?? 0;
    if (current < amount) throw new Error(`withdraw: insufficient balance (${current})`);
    this.balances.set(asset, current - amount);
  }

  /** Returns current spot balance for an asset. */
  getBalance(asset: string): number {
    this.assertSupported(asset);
    return this.balances.get(asset) ?? 0;
  }

  /**
   * Provide liquidity — locks amount from treasury balance into LP position.
   * Returns positionId.
   */
  provideLiquidity(asset: string, amount: number): string {
    this.assertSupported(asset);
    if (amount <= 0) throw new Error('provideLiquidity: amount must be positive');
    const positionId = 'lp-' + randomBytes(8).toString('hex');
    if (this.cfg.dryRun) return positionId;
    const current = this.balances.get(asset) ?? 0;
    if (current < amount) throw new Error(`provideLiquidity: insufficient balance (${current})`);
    this.balances.set(asset, current - amount);
    this.lpPositions.set(positionId, {
      positionId,
      asset,
      amount,
      openedAt: Date.now(),
    });
    return positionId;
  }

  /**
   * Accrue and return simulated yield earned for an LP position.
   * Yield = amount * annualRate * elapsedYears.
   */
  getYieldEarned(positionId: string): number {
    const pos = this.lpPositions.get(positionId);
    if (!pos) return 0;
    const elapsedMs = Date.now() - pos.openedAt;
    const elapsedYears = elapsedMs / (365 * 24 * 3600 * 1000);
    return pos.amount * this.cfg.baseYieldRate * elapsedYears;
  }

  /** Full treasury snapshot for all supported assets. */
  getTreasurySnapshot(): TreasuryBalance[] {
    return this.cfg.supportedAssets.map((asset) => {
      const lpBalance = [...this.lpPositions.values()]
        .filter((p) => p.asset === asset)
        .reduce((sum, p) => sum + p.amount, 0);
      const yieldEarned = [...this.lpPositions.values()]
        .filter((p) => p.asset === asset)
        .reduce((sum, p) => sum + this.getYieldEarned(p.positionId), 0);
      return {
        asset,
        balance: this.balances.get(asset) ?? 0,
        lpBalance,
        yieldEarned,
        lastUpdatedAt: Date.now(),
      };
    });
  }

  getLpPositions(): LpPosition[] {
    return [...this.lpPositions.values()];
  }

  isDryRun(): boolean {
    return this.cfg.dryRun;
  }

  private assertSupported(asset: string): void {
    if (!this.cfg.supportedAssets.includes(asset)) {
      throw new Error(`asset not supported: ${asset}`);
    }
  }
}
