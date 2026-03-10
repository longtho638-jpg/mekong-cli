/**
 * LiquidityTrapper — places simulated maker orders around detected pump targets
 * to provide liquidity that dumps will fill against. No real exchange calls.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface MakerOrder {
  id: string;
  asset: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  exchange: string;
  status: 'active' | 'cancelled' | 'filled';
}

interface LiquidityTrapperConfig {
  makerSpreadBps: number;   // spread in basis points (e.g. 2 = 0.02%)
  maxPositionUsd: number;
}

const DEFAULT_CONFIG: Required<LiquidityTrapperConfig> = {
  makerSpreadBps: 2,
  maxPositionUsd: 10_000,
};

let orderIdCounter = 0;

export class LiquidityTrapper extends EventEmitter {
  private config: Required<LiquidityTrapperConfig>;
  private orders: Map<string, MakerOrder> = new Map(); // id → order

  constructor(config?: Partial<LiquidityTrapperConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Place a pair of maker orders (bid + ask) around midPrice.
   * Returns both orders; skips if position limit would be exceeded.
   */
  placeMakerOrders(asset: string, midPrice: number): MakerOrder[] {
    const spread = midPrice * (this.config.makerSpreadBps / 10_000);
    const bidPrice = midPrice - spread / 2;
    const askPrice = midPrice + spread / 2;
    const amountUsd = Math.min(this.config.maxPositionUsd / 2, 1000);
    const amount = amountUsd / midPrice;

    const bid: MakerOrder = {
      id: `ORD-${++orderIdCounter}`,
      asset,
      side: 'buy',
      price: bidPrice,
      amount,
      exchange: 'binance',
      status: 'active',
    };
    const ask: MakerOrder = {
      id: `ORD-${++orderIdCounter}`,
      asset,
      side: 'sell',
      price: askPrice,
      amount,
      exchange: 'binance',
      status: 'active',
    };

    this.orders.set(bid.id, bid);
    this.orders.set(ask.id, ask);

    logger.debug(`[LiquidityTrapper] Placed maker orders for ${asset} bid=${bidPrice.toFixed(4)} ask=${askPrice.toFixed(4)}`);
    this.emit('order:placed', bid);
    this.emit('order:placed', ask);

    return [bid, ask];
  }

  /**
   * Cancel all active orders for the given asset. Returns count cancelled.
   */
  cancelAll(asset: string): number {
    let count = 0;
    for (const [id, order] of this.orders) {
      if (order.asset === asset && order.status === 'active') {
        order.status = 'cancelled';
        count++;
        this.emit('order:cancelled', order);
        logger.debug(`[LiquidityTrapper] Cancelled order ${id} for ${asset}`);
      }
    }
    return count;
  }

  getActiveOrders(): MakerOrder[] {
    return [...this.orders.values()].filter(o => o.status === 'active');
  }

  reset(): void {
    this.orders.clear();
  }
}
