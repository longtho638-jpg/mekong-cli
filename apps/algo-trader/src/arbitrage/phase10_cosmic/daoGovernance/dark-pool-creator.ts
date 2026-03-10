/**
 * Dark Pool Creator — Mock dark pool contract deployment.
 * Simulates anonymous order matching without external deps.
 * All ops default to dry-run mode.
 */

import { createHash, randomBytes } from 'crypto';

export interface DarkPoolConfig {
  /** Minimum order size. Default: 1. */
  minOrderSize: number;
  /** Max open orders in pool. Default: 1000. */
  maxOrders: number;
  /** Dry-run: skip state changes. Default: true. */
  dryRun: boolean;
}

export interface DarkPoolOrder {
  orderId: string;
  trader: string;
  side: 'buy' | 'sell';
  asset: string;
  quantity: number;
  limitPrice: number;
  submittedAt: number;
}

export interface MatchedTrade {
  tradeId: string;
  buyOrderId: string;
  sellOrderId: string;
  asset: string;
  quantity: number;
  executionPrice: number;
  executedAt: number;
}

const DEFAULT_CONFIG: DarkPoolConfig = {
  minOrderSize: 1,
  maxOrders: 1000,
  dryRun: true,
};

function mockId(prefix: string): string {
  return prefix + '-' + randomBytes(8).toString('hex');
}

export class DarkPoolCreator {
  private readonly cfg: DarkPoolConfig;
  private contractAddress: string | null = null;
  private orders: Map<string, DarkPoolOrder> = new Map();
  private trades: MatchedTrade[] = [];

  constructor(config: Partial<DarkPoolConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Deploy dark pool contract (mock). Returns contract address. */
  deploy(): string {
    const seed = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update('darkpool-' + seed).digest('hex');
    this.contractAddress = '0x' + hash.substring(0, 40);
    this.orders.clear();
    this.trades = [];
    return this.contractAddress;
  }

  /** Submit an order to the dark pool. Returns assigned orderId. */
  submitOrder(
    trader: string,
    side: 'buy' | 'sell',
    asset: string,
    quantity: number,
    limitPrice: number,
  ): string {
    if (!trader) throw new Error('submitOrder: trader address required');
    if (quantity < this.cfg.minOrderSize) {
      throw new Error(`submitOrder: quantity below minOrderSize (${this.cfg.minOrderSize})`);
    }
    if (limitPrice <= 0) throw new Error('submitOrder: limitPrice must be positive');
    if (this.orders.size >= this.cfg.maxOrders) {
      throw new Error('submitOrder: pool at maxOrders capacity');
    }
    const orderId = mockId('ord');
    if (!this.cfg.dryRun) {
      this.orders.set(orderId, {
        orderId,
        trader,
        side,
        asset,
        quantity,
        limitPrice,
        submittedAt: Date.now(),
      });
    }
    return orderId;
  }

  /**
   * Attempt to match buy/sell orders for the given asset.
   * Returns number of matches executed.
   */
  matchOrders(asset: string): number {
    if (this.cfg.dryRun) return 0;
    const buys = [...this.orders.values()]
      .filter((o) => o.asset === asset && o.side === 'buy')
      .sort((a, b) => b.limitPrice - a.limitPrice);
    const sells = [...this.orders.values()]
      .filter((o) => o.asset === asset && o.side === 'sell')
      .sort((a, b) => a.limitPrice - b.limitPrice);

    let matched = 0;
    let bi = 0;
    let si = 0;
    while (bi < buys.length && si < sells.length) {
      const buy = buys[bi];
      const sell = sells[si];
      if (buy.limitPrice < sell.limitPrice) break;
      const qty = Math.min(buy.quantity, sell.quantity);
      const execPrice = (buy.limitPrice + sell.limitPrice) / 2;
      const trade: MatchedTrade = {
        tradeId: mockId('trd'),
        buyOrderId: buy.orderId,
        sellOrderId: sell.orderId,
        asset,
        quantity: qty,
        executionPrice: execPrice,
        executedAt: Date.now(),
      };
      this.trades.push(trade);
      this.orders.delete(buy.orderId);
      this.orders.delete(sell.orderId);
      matched++;
      bi++;
      si++;
    }
    return matched;
  }

  /** Returns all matched trades (optionally filtered by asset). */
  getMatchedTrades(asset?: string): MatchedTrade[] {
    if (asset) return this.trades.filter((t) => t.asset === asset);
    return [...this.trades];
  }

  getContractAddress(): string | null {
    return this.contractAddress;
  }

  getOpenOrderCount(): number {
    return this.orders.size;
  }

  isDryRun(): boolean {
    return this.cfg.dryRun;
  }
}
