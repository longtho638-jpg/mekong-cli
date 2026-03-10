/**
 * ExchangeSimulator — in-memory CLOB with price-time priority matching.
 * Supports limit, market, and iceberg orders. SIMULATION ONLY.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface Order {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  type: 'limit' | 'market' | 'iceberg';
  visibleSize?: number;
  timestamp: number;
  owner: string;
}

export interface OrderbookSnapshot {
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  midPrice: number;
  spread: number;
  timestamp: number;
}

export interface Trade {
  id: string;
  price: number;
  size: number;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: number;
}

type OrderInput = Omit<Order, 'id' | 'timestamp'>;

let orderSeq = 0;
let tradeSeq = 0;

export class ExchangeSimulator extends EventEmitter {
  /** bids sorted descending by price, then ascending by timestamp */
  private bids: Order[] = [];
  /** asks sorted ascending by price, then ascending by timestamp */
  private asks: Order[] = [];
  private ordersById: Map<string, Order> = new Map();
  /** tracks hidden remaining size for iceberg orders */
  private icebergHidden: Map<string, number> = new Map();
  private trades: Trade[] = [];

  placeOrder(input: OrderInput): Order {
    const order: Order = {
      ...input,
      id: `ORD-${++orderSeq}`,
      timestamp: Date.now(),
    };

    if (order.type === 'iceberg') {
      const visible = order.visibleSize ?? order.size;
      const hidden = order.size - visible;
      order.visibleSize = visible;
      order.size = visible;
      if (hidden > 0) this.icebergHidden.set(order.id, hidden);
    }

    this.ordersById.set(order.id, order);
    logger.debug(`[ExchangeSimulator] Place ${order.type} ${order.side} id=${order.id} price=${order.price} size=${order.size} owner=${order.owner}`);

    const matched = order.type === 'market'
      ? this.matchMarket(order)
      : this.matchLimit(order);

    if (!matched) {
      this.insertResting(order);
    }

    this.emit('orderbook_update', this.getSnapshot());
    return order;
  }

  cancelOrder(orderId: string): boolean {
    const order = this.ordersById.get(orderId);
    if (!order) return false;

    this.bids = this.bids.filter(o => o.id !== orderId);
    this.asks = this.asks.filter(o => o.id !== orderId);
    this.ordersById.delete(orderId);
    this.icebergHidden.delete(orderId);

    logger.debug(`[ExchangeSimulator] Cancel id=${orderId}`);
    this.emit('orderbook_update', this.getSnapshot());
    return true;
  }

  getSnapshot(): OrderbookSnapshot {
    const bids = this.bids.map(o => ({ price: o.price, size: o.size }));
    const asks = this.asks.map(o => ({ price: o.price, size: o.size }));
    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asks[0]?.price ?? 0;
    const midPrice = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;
    const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
    return { bids, asks, midPrice, spread, timestamp: Date.now() };
  }

  getOpenOrders(owner: string): Order[] {
    return [...this.ordersById.values()].filter(o => o.owner === owner);
  }

  getTrades(): Trade[] {
    return [...this.trades];
  }

  private insertResting(order: Order): void {
    if (order.type === 'market') return; // market orders never rest
    if (order.side === 'buy') {
      this.bids.push(order);
      this.bids.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    } else {
      this.asks.push(order);
      this.asks.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
    }
  }

  /** Returns true if fully consumed (should not rest). */
  private matchMarket(order: Order): boolean {
    const oppBook = order.side === 'buy' ? this.asks : this.bids;
    let remaining = order.size;
    while (remaining > 0 && oppBook.length > 0) {
      const best = oppBook[0];
      const fill = Math.min(remaining, best.size);
      remaining -= fill;
      best.size -= fill;
      this.recordTrade(order, best, best.price, fill);
      if (best.size <= 0) {
        oppBook.shift();
        this.refillIceberg(best);
      }
    }
    return true; // market orders always consumed
  }

  /** Returns true if fully filled. */
  private matchLimit(order: Order): boolean {
    const oppBook = order.side === 'buy' ? this.asks : this.bids;
    let remaining = order.size;

    while (remaining > 0 && oppBook.length > 0) {
      const best = oppBook[0];
      const canFill = order.side === 'buy' ? order.price >= best.price : order.price <= best.price;
      if (!canFill) break;

      const fill = Math.min(remaining, best.size);
      remaining -= fill;
      order.size -= fill;
      best.size -= fill;
      this.recordTrade(order, best, best.price, fill);
      if (best.size <= 0) {
        oppBook.shift();
        this.refillIceberg(best);
      }
    }
    return remaining <= 0;
  }

  private refillIceberg(resting: Order): void {
    if (resting.type !== 'iceberg') return;
    const hidden = this.icebergHidden.get(resting.id) ?? 0;
    if (hidden <= 0) return;
    const refill = Math.min(hidden, resting.visibleSize ?? hidden);
    resting.size = refill;
    this.icebergHidden.set(resting.id, hidden - refill);
    this.insertResting(resting);
    logger.debug(`[ExchangeSimulator] Iceberg refill id=${resting.id} refill=${refill}`);
  }

  private recordTrade(taker: Order, maker: Order, price: number, size: number): void {
    const trade: Trade = {
      id: `TRD-${++tradeSeq}`,
      price,
      size,
      buyOrderId: taker.side === 'buy' ? taker.id : maker.id,
      sellOrderId: taker.side === 'sell' ? taker.id : maker.id,
      timestamp: Date.now(),
    };
    this.trades.push(trade);
    logger.debug(`[ExchangeSimulator] Trade id=${trade.id} price=${price} size=${size}`);
    this.emit('trade', trade);
  }
}
