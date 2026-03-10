/**
 * State Manager for Historical Backtesting
 * Maintains portfolio state: cash, positions, orders, equity curve
 */

import { Trade } from '../../backtest/backtest-types';

export interface Position {
  asset: string;
  quantity: number;
  avgPrice: number;
  exchange: string;
  unrealizedPnl: number;
}

export interface Order {
  id: string;
  asset: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  exchange: string;
  timestamp: number;
}

export interface EquityPoint {
  timestamp: number;
  equity: number;
}

export interface PortfolioState {
  cash: number;
  positions: Map<string, Position>;
  openOrders: Order[];
  totalEquity: number;
  equityCurve: EquityPoint[];
}

export class StateManager {
  private cash: number;
  private positions: Map<string, Position>;
  private openOrders: Order[];
  private equityCurve: EquityPoint[];
  private orderCounter = 0;

  constructor(initialCapital: number) {
    this.cash = initialCapital;
    this.positions = new Map();
    this.openOrders = [];
    this.equityCurve = [];
  }

  getState(): PortfolioState {
    return {
      cash: this.cash,
      positions: new Map(this.positions),
      openOrders: [...this.openOrders],
      totalEquity: this.getTotalEquity(new Map()),
      equityCurve: [...this.equityCurve],
    };
  }

  openOrder(order: Omit<Order, 'id'>): Order {
    const fullOrder: Order = { ...order, id: `order-${++this.orderCounter}` };
    this.openOrders.push(fullOrder);
    return fullOrder;
  }

  cancelOrder(orderId: string): boolean {
    const idx = this.openOrders.findIndex(o => o.id === orderId);
    if (idx === -1) return false;
    this.openOrders.splice(idx, 1);
    return true;
  }

  executeFill(order: Order, fillPrice: number, fees: number): Trade {
    const cost = fillPrice * order.quantity + fees;
    const posKey = `${order.asset}:${order.exchange}`;
    const entryTime = order.timestamp;
    const exitTime = order.timestamp + 1;

    if (order.side === 'buy') {
      this.cash -= cost;
      const existing = this.positions.get(posKey);
      if (existing) {
        const totalQty = existing.quantity + order.quantity;
        existing.avgPrice = (existing.avgPrice * existing.quantity + fillPrice * order.quantity) / totalQty;
        existing.quantity = totalQty;
        existing.unrealizedPnl = 0;
      } else {
        this.positions.set(posKey, {
          asset: order.asset,
          quantity: order.quantity,
          avgPrice: fillPrice,
          exchange: order.exchange,
          unrealizedPnl: 0,
        });
      }
    } else {
      const pos = this.positions.get(posKey);
      const avgEntry = pos ? pos.avgPrice : fillPrice;
      const proceeds = fillPrice * order.quantity - fees;
      this.cash += proceeds;

      if (pos) {
        pos.quantity -= order.quantity;
        if (pos.quantity <= 0) this.positions.delete(posKey);
      }

      const profit = (fillPrice - avgEntry) * order.quantity - fees;
      const profitPercent = avgEntry > 0 ? profit / (avgEntry * order.quantity) : 0;

      return {
        entryPrice: avgEntry,
        exitPrice: fillPrice,
        entryTime,
        exitTime,
        profit,
        profitPercent,
        positionSize: order.quantity,
        fees,
      };
    }

    // Buy trade — entry recorded, no realized PnL yet
    return {
      entryPrice: fillPrice,
      exitPrice: fillPrice,
      entryTime,
      exitTime,
      profit: 0,
      profitPercent: 0,
      positionSize: order.quantity,
      fees,
    };
  }

  recordEquityPoint(timestamp: number, currentPrices: Map<string, number>): void {
    const equity = this.getTotalEquity(currentPrices);
    this.equityCurve.push({ timestamp, equity });
  }

  getTotalEquity(currentPrices: Map<string, number>): number {
    let equity = this.cash;
    for (const [key, pos] of this.positions) {
      const price = currentPrices.get(key) ?? currentPrices.get(pos.asset) ?? pos.avgPrice;
      equity += pos.quantity * price;
    }
    return equity;
  }

  getEquityCurve(): EquityPoint[] {
    return [...this.equityCurve];
  }
}
