/**
 * DefensiveDetector — identifies spoofing patterns in the order action stream.
 * Heuristics: cancel-to-fill ratio, order lifetime, size relative to book depth.
 * SIMULATION ONLY.
 */

import { logger } from '../../../utils/logger';
import type { StrategyAction } from './shadow-layering-strategy';
import type { OrderbookSnapshot } from './exchange-simulator';

export interface SpoofingAlert {
  confidence: number;          // 0–1
  suspiciousOrders: string[];  // order IDs flagged
  pattern: string;             // human-readable pattern description
  timestamp: number;
}

// Thresholds
const MIN_ACTIONS_TO_ANALYZE = 3;
const HIGH_CANCEL_RATIO = 0.7;      // >70% cancels vs total = suspicious
const SHORT_LIFETIME_MS = 2_000;    // orders cancelled within 2s = suspicious
const LARGE_SIZE_RATIO = 3.0;       // order size > 3× avg book level = suspicious

export class DefensiveDetector {
  private alerts: SpoofingAlert[] = [];

  /**
   * Inspect recent actions and current book snapshot for spoofing signatures.
   * Returns an alert if confidence is meaningful, null otherwise.
   */
  detect(actions: StrategyAction[], snapshot: OrderbookSnapshot): SpoofingAlert | null {
    if (actions.length < MIN_ACTIONS_TO_ANALYZE) return null;

    const places = actions.filter(a => a.type === 'place');
    const cancels = actions.filter(a => a.type === 'cancel');
    const fills = actions.filter(a => a.type === 'fill');

    const total = places.length + fills.length;
    if (total === 0) return null;

    const cancelRatio = cancels.length / (total + cancels.length);
    const suspiciousOrders: string[] = [];
    let signals = 0;

    // Signal 1: high cancel-to-fill ratio
    if (cancelRatio > HIGH_CANCEL_RATIO) {
      signals++;
      cancels.forEach(c => {
        if (!suspiciousOrders.includes(c.orderId)) suspiciousOrders.push(c.orderId);
      });
      logger.debug(`[DefensiveDetector] High cancel ratio=${cancelRatio.toFixed(2)}`);
    }

    // Signal 2: short-lived orders (placed then quickly cancelled)
    const placeMap = new Map(places.map(p => [p.orderId, p.timestamp]));
    for (const cancel of cancels) {
      const placedAt = placeMap.get(cancel.orderId);
      if (placedAt !== undefined && (cancel.timestamp - placedAt) < SHORT_LIFETIME_MS) {
        signals++;
        if (!suspiciousOrders.includes(cancel.orderId)) suspiciousOrders.push(cancel.orderId);
        logger.debug(`[DefensiveDetector] Short-lived order=${cancel.orderId} lifetime=${cancel.timestamp - placedAt}ms`);
      }
    }

    // Signal 3: oversized orders relative to book depth
    const avgBookSize = this.avgLevelSize(snapshot);
    if (avgBookSize > 0) {
      for (const place of places) {
        if (place.size > avgBookSize * LARGE_SIZE_RATIO) {
          signals++;
          if (!suspiciousOrders.includes(place.orderId)) suspiciousOrders.push(place.orderId);
          logger.debug(`[DefensiveDetector] Large order=${place.orderId} size=${place.size} avgBook=${avgBookSize.toFixed(2)}`);
        }
      }
    }

    if (signals === 0 || suspiciousOrders.length === 0) return null;

    const confidence = Math.min(1, signals / 3);
    const pattern = [
      cancelRatio > HIGH_CANCEL_RATIO ? `high_cancel_ratio(${cancelRatio.toFixed(2)})` : null,
      cancels.some(c => placeMap.has(c.orderId)) ? 'short_lifetime' : null,
      avgBookSize > 0 ? 'oversized_orders' : null,
    ].filter(Boolean).join('+');

    const alert: SpoofingAlert = {
      confidence,
      suspiciousOrders,
      pattern,
      timestamp: Date.now(),
    };

    this.alerts.push(alert);
    logger.info(
      `[DefensiveDetector] SPOOFING ALERT confidence=${confidence.toFixed(2)} ` +
      `pattern=${pattern} orders=${suspiciousOrders.join(',')}`,
    );

    return alert;
  }

  getAlerts(): SpoofingAlert[] {
    return [...this.alerts];
  }

  reset(): void {
    this.alerts.length = 0;
  }

  private avgLevelSize(snapshot: OrderbookSnapshot): number {
    const levels = [...snapshot.bids, ...snapshot.asks];
    if (levels.length === 0) return 0;
    return levels.reduce((sum, l) => sum + l.size, 0) / levels.length;
  }
}
