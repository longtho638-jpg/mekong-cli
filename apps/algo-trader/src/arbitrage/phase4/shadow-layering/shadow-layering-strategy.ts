/**
 * ShadowLayeringStrategy — places large visible orders at key price levels
 * (resistance/support) to influence market perception, then cancels before fill.
 * SIMULATION ONLY — no real exchange connections.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import type { Order, OrderbookSnapshot } from './exchange-simulator';

export interface StrategyConfig {
  layerSizes: number[];       // sizes for each layer, e.g. [100, 200, 300]
  cancelThresholdPct: number; // cancel when price moves within X% of order
  maxLayers: number;
}

export interface StrategyAction {
  type: 'place' | 'cancel' | 'fill';
  orderId: string;
  price: number;
  size: number;
  timestamp: number;
  reason: string;
}

const DEFAULT_CONFIG: Required<StrategyConfig> = {
  layerSizes: [50, 100, 200],
  cancelThresholdPct: 0.5,
  maxLayers: 5,
};

export class ShadowLayeringStrategy extends EventEmitter {
  private config: Required<StrategyConfig>;
  private activeOrders: Map<string, Order> = new Map();
  private actionHistory: StrategyAction[] = [];

  constructor(config?: Partial<StrategyConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate the current orderbook state and return a list of actions to take.
   * Spoofing logic: place layers at resistance/support, cancel when price approaches.
   */
  evaluate(snapshot: OrderbookSnapshot, volatility: number): StrategyAction[] {
    const actions: StrategyAction[] = [];
    const { midPrice, spread } = snapshot;
    if (midPrice <= 0) return actions;

    // Determine key levels based on volatility
    const levelSpacing = midPrice * Math.max(0.002, volatility * 0.01);
    const cancelThresh = midPrice * (this.config.cancelThresholdPct / 100);

    // Cancel layers that price is moving too close to
    for (const [id, order] of this.activeOrders) {
      const distance = Math.abs(order.price - midPrice);
      if (distance < cancelThresh) {
        const action: StrategyAction = {
          type: 'cancel',
          orderId: id,
          price: order.price,
          size: order.size,
          timestamp: Date.now(),
          reason: `price_approaching distance=${distance.toFixed(4)} threshold=${cancelThresh.toFixed(4)}`,
        };
        actions.push(action);
        this.actionHistory.push(action);
        this.activeOrders.delete(id);
        logger.info(`[ShadowLayeringStrategy] Cancel order=${id} price=${order.price.toFixed(4)} reason: price approaching`);
      }
    }

    // Place new spoof layers if under maxLayers
    const currentLayerCount = this.activeOrders.size;
    const slotsAvailable = this.config.maxLayers - currentLayerCount;
    if (slotsAvailable <= 0) return actions;

    const layerSizes = this.config.layerSizes.slice(0, slotsAvailable);

    layerSizes.forEach((size, i) => {
      const isAsk = i % 2 === 0;
      // Place above ask (resistance) or below bid (support)
      const offset = levelSpacing * (Math.floor(i / 2) + 1);
      const price = isAsk
        ? midPrice + spread / 2 + offset
        : midPrice - spread / 2 - offset;

      // Synthesize a placeholder id — real id assigned by ExchangeSimulator on placeOrder
      const placeholderId = `SPOOF-${Date.now()}-${i}`;
      const action: StrategyAction = {
        type: 'place',
        orderId: placeholderId,
        price,
        size,
        timestamp: Date.now(),
        reason: `layer_${i} ${isAsk ? 'ask_resistance' : 'bid_support'} volatility=${volatility.toFixed(4)}`,
      };
      actions.push(action);
      this.actionHistory.push(action);
      logger.info(`[ShadowLayeringStrategy] Queue place ${isAsk ? 'sell' : 'buy'} price=${price.toFixed(4)} size=${size} reason: ${action.reason}`);
    });

    return actions;
  }

  /** Register an order that was actually placed by the engine. */
  registerOrder(order: Order): void {
    this.activeOrders.set(order.id, order);
    logger.debug(`[ShadowLayeringStrategy] Registered order=${order.id} price=${order.price} size=${order.size}`);
  }

  /** Remove an order (filled or cancelled externally). */
  removeOrder(orderId: string): void {
    this.activeOrders.delete(orderId);
  }

  getActiveOrders(): Order[] {
    return [...this.activeOrders.values()];
  }

  getActionHistory(): StrategyAction[] {
    return [...this.actionHistory];
  }

  reset(): void {
    this.activeOrders.clear();
    this.actionHistory.length = 0;
  }
}
