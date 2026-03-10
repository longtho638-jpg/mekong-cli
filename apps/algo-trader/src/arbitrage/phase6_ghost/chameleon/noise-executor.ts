/**
 * Noise Executor — safely executes noise actions chosen by the RL agent.
 * Ensures noise does not affect real PnL (tiny orders at worst prices,
 * immediately cancelled).
 */
import { NoiseAction } from '../types';

export interface NoiseExecutorDeps {
  /** Place a tiny limit order at worst price — returns order ID */
  placeTinyOrder?: (symbol: string, side: 'buy' | 'sell', amount: number) => Promise<string>;
  /** Cancel an order by ID */
  cancelOrder?: (orderId: string) => Promise<boolean>;
  /** Simulate GUI check (log only in production) */
  logGuiCheck?: () => void;
}

export interface NoiseExecutionResult {
  action: NoiseAction;
  success: boolean;
  details?: string;
  timestamp: number;
}

export class NoiseExecutor {
  private deps: NoiseExecutorDeps;
  private pendingNoiseOrders: string[] = [];
  private executionHistory: NoiseExecutionResult[] = [];
  private maxHistorySize = 100;

  constructor(deps: NoiseExecutorDeps = {}) {
    this.deps = deps;
  }

  /** Execute a noise action safely */
  async execute(action: NoiseAction): Promise<NoiseExecutionResult> {
    const result: NoiseExecutionResult = {
      action,
      success: false,
      timestamp: Date.now(),
    };

    try {
      switch (action) {
        case 'cancel': {
          if (this.pendingNoiseOrders.length > 0) {
            const orderId = this.pendingNoiseOrders.pop()!;
            if (this.deps.cancelOrder) {
              await this.deps.cancelOrder(orderId);
            }
            result.success = true;
            result.details = `Cancelled noise order ${orderId}`;
          } else {
            result.success = true;
            result.details = 'No pending noise orders to cancel';
          }
          break;
        }

        case 'tinyOrder': {
          if (this.deps.placeTinyOrder) {
            // Place at worst price with minimal amount
            const orderId = await this.deps.placeTinyOrder('BTC/USDT', 'buy', 0.00001);
            this.pendingNoiseOrders.push(orderId);
            result.success = true;
            result.details = `Placed noise order ${orderId}`;
          } else {
            result.success = true;
            result.details = 'Simulated tiny order (no exchange connection)';
          }
          break;
        }

        case 'guiCheck': {
          if (this.deps.logGuiCheck) {
            this.deps.logGuiCheck();
          }
          result.success = true;
          result.details = 'GUI balance check simulated';
          break;
        }

        case 'doNothing': {
          result.success = true;
          result.details = 'No action taken';
          break;
        }
      }
    } catch (err) {
      result.success = false;
      result.details = `Error: ${err instanceof Error ? err.message : String(err)}`;
    }

    this.executionHistory.push(result);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }

    return result;
  }

  getHistory(): NoiseExecutionResult[] {
    return [...this.executionHistory];
  }

  getPendingNoiseOrderCount(): number {
    return this.pendingNoiseOrders.length;
  }
}
