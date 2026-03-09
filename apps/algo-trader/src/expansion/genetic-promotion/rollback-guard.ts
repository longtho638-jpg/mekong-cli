/**
 * Monitors a promoted strategy for a configurable window.
 * Auto-rollback if cumulative PnL drops below a loss threshold.
 */

import { EventEmitter } from 'events';

export interface RollbackGuardConfig {
  monitoringWindowMs: number;
  maxDrawdownPercent: number; // e.g. 5 means 5% loss triggers rollback
}

export interface GuardedStrategy {
  id: string;
  entryPnl: number;
  currentPnl: number;
  promotedAt: number;
  rolledBack: boolean;
}

export class RollbackGuard extends EventEmitter {
  private readonly guarded: Map<string, GuardedStrategy> = new Map();
  private readonly config: RollbackGuardConfig;
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(config: RollbackGuardConfig) {
    super();
    this.config = config;
  }

  /** Start monitoring a newly promoted strategy. */
  watch(id: string, entryPnl: number): void {
    this.guarded.set(id, {
      id,
      entryPnl,
      currentPnl: entryPnl,
      promotedAt: Date.now(),
      rolledBack: false,
    });
    this.emit('watching', id);
  }

  /** Update the current PnL for a watched strategy. */
  updatePnl(id: string, currentPnl: number): void {
    const entry = this.guarded.get(id);
    if (!entry || entry.rolledBack) return;
    entry.currentPnl = currentPnl;
    this.checkRollback(entry);
  }

  private checkRollback(entry: GuardedStrategy): void {
    const drawdown =
      entry.entryPnl !== 0
        ? ((entry.entryPnl - entry.currentPnl) / Math.abs(entry.entryPnl)) * 100
        : entry.currentPnl < 0 ? 100 : 0;

    const windowExpired = Date.now() - entry.promotedAt >= this.config.monitoringWindowMs;

    if (drawdown >= this.config.maxDrawdownPercent) {
      entry.rolledBack = true;
      this.emit('rollback', { id: entry.id, drawdown, reason: 'drawdown-exceeded' });
    } else if (windowExpired) {
      this.emit('monitoring-complete', { id: entry.id, finalPnl: entry.currentPnl });
      this.guarded.delete(entry.id);
    }
  }

  /** Manually trigger a check pass for all watched strategies. */
  checkAll(): void {
    for (const entry of this.guarded.values()) {
      if (!entry.rolledBack) this.checkRollback(entry);
    }
  }

  getGuarded(): GuardedStrategy[] {
    return Array.from(this.guarded.values());
  }

  isRolledBack(id: string): boolean {
    return this.guarded.get(id)?.rolledBack ?? false;
  }

  /** Start a periodic check loop. */
  startMonitoring(intervalMs: number): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => this.checkAll(), intervalMs);
  }

  stopMonitoring(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
