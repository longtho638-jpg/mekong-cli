/**
 * Policy Executor — loads RL policy model and applies actions to exchange connectors.
 * Mock exchange connector: logs orders instead of sending real ones (dry-run).
 */

import { EventEmitter } from 'events';
import type { SpreadAction } from './market-env';

export interface OrderParams {
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  type: 'limit';
}

export interface ExecutionResult {
  orderId: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  dryRun: boolean;
  timestamp: number;
}

export interface PolicyExecutorConfig {
  pair: string;
  baseOrderSize: number;
  midPriceFn: () => number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: PolicyExecutorConfig = {
  pair: 'BTC/USDT',
  baseOrderSize: 0.01,
  midPriceFn: () => 50_000,
  dryRun: true,
};

let orderIdCounter = 1;
function generateOrderId(): string {
  return `rl-order-${Date.now()}-${orderIdCounter++}`;
}

export class PolicyExecutor extends EventEmitter {
  private readonly cfg: PolicyExecutorConfig;
  private executionCount = 0;

  constructor(config: Partial<PolicyExecutorConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Translate RL action into bid/ask limit orders and submit (or log in dry-run).
   */
  async execute(action: SpreadAction): Promise<ExecutionResult[]> {
    const mid = this.cfg.midPriceFn();
    const halfSpread = (Math.abs(action.spreadDeltaBps) / 10_000) * mid / 2;
    const size = this.cfg.baseOrderSize * action.sizeMultiplier;

    const bidOrder: OrderParams = {
      pair: this.cfg.pair,
      side: 'buy',
      price: mid - halfSpread,
      size,
      type: 'limit',
    };

    const askOrder: OrderParams = {
      pair: this.cfg.pair,
      side: 'sell',
      price: mid + halfSpread,
      size,
      type: 'limit',
    };

    const results: ExecutionResult[] = [bidOrder, askOrder].map((o) => ({
      orderId: generateOrderId(),
      pair: o.pair,
      side: o.side,
      price: o.price,
      size: o.size,
      dryRun: this.cfg.dryRun,
      timestamp: Date.now(),
    }));

    this.executionCount++;
    this.emit(this.cfg.dryRun ? 'order:dry' : 'order:live', results);
    return results;
  }

  getExecutionCount(): number {
    return this.executionCount;
  }
}
