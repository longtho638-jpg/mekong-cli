/**
 * Allocation Executor — rebalance LP and hedge positions.
 * Dry-run by default; logs intended actions without submitting.
 */

import { EventEmitter } from 'events';

export interface RebalanceAction {
  type: 'add-liquidity' | 'remove-liquidity' | 'open-hedge' | 'close-hedge';
  poolId: string;
  amountUsd: number;
  instrument?: string;
  dryRun: boolean;
  executedAt: number;
}

export interface AllocationState {
  poolId: string;
  lpValueUsd: number;
  hedgeRatio: number;
  hedgeNotionalUsd: number;
  lastRebalancedAt: number;
}

export interface AllocationExecutorConfig {
  dryRun: boolean;
  /** Minimum USD change to trigger rebalance (avoids dust trades). */
  minRebalanceUsd: number;
}

const DEFAULT_CONFIG: AllocationExecutorConfig = {
  dryRun: true,
  minRebalanceUsd: 100,
};

export class AllocationExecutor extends EventEmitter {
  private readonly cfg: AllocationExecutorConfig;
  private readonly positions = new Map<string, AllocationState>();
  private readonly actionLog: RebalanceAction[] = [];

  constructor(config: Partial<AllocationExecutorConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Rebalance a pool position to a target LP value and hedge ratio.
   * In dry-run: records intended action only.
   */
  rebalance(
    poolId: string,
    targetLpUsd: number,
    targetHedgeRatio: number,
    hedgeInstrument = 'eth_perp_binance',
  ): RebalanceAction[] {
    const current = this.positions.get(poolId) ?? {
      poolId,
      lpValueUsd: 0,
      hedgeRatio: 0,
      hedgeNotionalUsd: 0,
      lastRebalancedAt: 0,
    };

    const actions: RebalanceAction[] = [];
    const lpDelta = targetLpUsd - current.lpValueUsd;

    if (Math.abs(lpDelta) >= this.cfg.minRebalanceUsd) {
      const action: RebalanceAction = {
        type: lpDelta > 0 ? 'add-liquidity' : 'remove-liquidity',
        poolId,
        amountUsd: Math.abs(lpDelta),
        dryRun: this.cfg.dryRun,
        executedAt: Date.now(),
      };
      actions.push(action);
      this.actionLog.push(action);
      this.emit('action:executed', action);
    }

    const targetHedgeNotional = targetLpUsd * targetHedgeRatio;
    const hedgeDelta = targetHedgeNotional - current.hedgeNotionalUsd;

    if (Math.abs(hedgeDelta) >= this.cfg.minRebalanceUsd) {
      const hedgeAction: RebalanceAction = {
        type: hedgeDelta > 0 ? 'open-hedge' : 'close-hedge',
        poolId,
        amountUsd: Math.abs(hedgeDelta),
        instrument: hedgeInstrument,
        dryRun: this.cfg.dryRun,
        executedAt: Date.now(),
      };
      actions.push(hedgeAction);
      this.actionLog.push(hedgeAction);
      this.emit('action:executed', hedgeAction);
    }

    // Update state
    this.positions.set(poolId, {
      poolId,
      lpValueUsd: targetLpUsd,
      hedgeRatio: targetHedgeRatio,
      hedgeNotionalUsd: targetHedgeNotional,
      lastRebalancedAt: Date.now(),
    });

    return actions;
  }

  getPosition(poolId: string): AllocationState | undefined {
    return this.positions.get(poolId);
  }

  getActionLog(): RebalanceAction[] {
    return [...this.actionLog];
  }

  getActionCount(): number {
    return this.actionLog.length;
  }
}
