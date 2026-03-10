/**
 * Stealth Order Execution Algorithms
 *
 * Implements professional quantitative trading execution patterns:
 * 1. TWAP (Time-Weighted Average Price) with randomization
 * 2. VWAP (Volume-Weighted Average Price) stealth variants
 * 3. Iceberg (Simulated) order placement
 * 4. Anti-pattern detection avoidance
 *
 * References:
 * - "Optimal Execution of Portfolio Transactions" (Almgren & Chriss, 2000)
 * - "Execution of Large Orders: TWAP, VWAP and Beyond" (Quantitative Finance)
 */

import { poissonDelay, logNormalSize, avoidRoundNumbers, boxMullerNormal } from './phantom-stealth-math';

export interface ChildOrder {
  amount: number;
  delayMs: number;
  type: 'market' | 'limit';
  price?: number;
}

export interface ExecutionPlan {
  totalAmount: number;
  childOrders: ChildOrder[];
  algorithm: string;
}

export class StealthExecutionAlgorithms {
  /**
   * TWAP (Time-Weighted Average Price) with randomization.
   * Spreads a large order over a fixed time duration with jitter.
   *
   * @param totalAmount Total size to execute
   * @param durationMs Total time window (e.g. 1 hour = 3,600,000ms)
   * @param numChunks Number of child orders
   */
  static createTwapPlan(
    totalAmount: number,
    durationMs: number,
    numChunks: number = 10
  ): ExecutionPlan {
    const baseSize = totalAmount / numChunks;
    const baseInterval = durationMs / numChunks;
    const childOrders: ChildOrder[] = [];

    let remainingAmount = totalAmount;

    // Poisson rate: numChunks / durationMs converted to per-minute
    const ratePerMin = (numChunks / durationMs) * 60_000;

    for (let i = 0; i < numChunks; i++) {
      const isLast = i === numChunks - 1;

      // Log-normal sizing instead of uniform ±15% jitter
      let amount = isLast
        ? remainingAmount
        : avoidRoundNumbers(logNormalSize(baseSize, 0.2), 8);

      // Ensure we don't exceed remaining
      if (amount > remainingAmount) amount = remainingAmount;
      remainingAmount -= amount;

      // Poisson inter-arrival instead of uniform ±25% jitter
      const delayMs = poissonDelay(ratePerMin, 1000, baseInterval * 3);

      childOrders.push({
        amount,
        delayMs,
        type: 'market'
      });

      if (remainingAmount <= 0) break;
    }

    return {
      totalAmount,
      childOrders,
      algorithm: 'TWAP-Stealth-Randomized'
    };
  }

  /**
   * VWAP (Volume-Weighted Average Price) variant.
   * Note: Real-time VWAP requires continuous volume feed.
   * This variant creates a plan based on a target percentage of market volume.
   *
   * @param totalAmount Total size to execute
   * @param marketVolumeEstimate Current market volume (over same period)
   * @param targetVolumePct Percentage of market volume to target (e.g., 0.05 = 5%)
   */
  static createVwapPlan(
    totalAmount: number,
    marketVolumeEstimate: number,
    targetVolumePct: number = 0.05
  ): ExecutionPlan {
    // Determine how many chunks needed if each chunk is targetVolumePct of the tape
    const sliceSize = marketVolumeEstimate * targetVolumePct * (0.8 + Math.random() * 0.4);
    const numChunks = Math.ceil(totalAmount / sliceSize);
    const childOrders: ChildOrder[] = [];

    let remainingAmount = totalAmount;

    for (let i = 0; i < numChunks; i++) {
      const isLast = i === numChunks - 1;
      // Log-normal sizing matches natural volume distribution
      let amount = isLast
        ? remainingAmount
        : avoidRoundNumbers(logNormalSize(sliceSize, 0.3), 8);

      if (amount > remainingAmount) amount = remainingAmount;
      remainingAmount -= amount;

      // Poisson inter-arrival for VWAP slices (natural clustering pattern)
      const delayMs = poissonDelay(8, 2000, 30_000); // ~8 slices/min

      childOrders.push({
        amount,
        delayMs,
        type: 'market'
      });

      if (remainingAmount <= 0) break;
    }

    return {
      totalAmount,
      childOrders,
      algorithm: 'VWAP-Stealth-Slice'
    };
  }

  /**
   * Iceberg (Simulated).
   * Places a small visible "tip" in the order book.
   * When filled, places the next tip.
   *
   * @param totalAmount Total size to execute
   * @param tipSizeBase Size of each visible portion
   * @param price Limit price
   */
  static createIcebergPlan(
    totalAmount: number,
    tipSizeBase: number,
    price: number
  ): ExecutionPlan {
    const childOrders: ChildOrder[] = [];
    let remainingAmount = totalAmount;

    while (remainingAmount > 0) {
      // Log-normal tip sizing — varies ±15% naturally, avoids uniform blocks
      let amount = avoidRoundNumbers(logNormalSize(tipSizeBase, 0.15), 8);

      if (amount > remainingAmount) amount = remainingAmount;
      remainingAmount -= amount;

      childOrders.push({
        amount,
        delayMs: 0, // In iceberg, delay is usually "on fill", handled by executor
        type: 'limit',
        price
      });
    }

    return {
      totalAmount,
      childOrders,
      algorithm: 'Iceberg-Simulated'
    };
  }

  /**
   * Anti-Pattern Detection Avoidance.
   * Professional traders avoid uniform "heartbeat" intervals and "round numbers"
   * that signal a bot's presence.
   */
  static applyAntiPatternCamouflage(plan: ExecutionPlan): ExecutionPlan {
    plan.childOrders = plan.childOrders.map(order => {
      // 1. Log-normal interval jitter (replaces uniform — undetectable by autocorrelation)
      const z = boxMullerNormal();
      const intervalJitter = Math.exp(0.2 * Math.max(-2.5, Math.min(2.5, z)));

      // 2. Round number avoidance (strips .000, .500, .250 patterns)
      const cleanAmount = avoidRoundNumbers(order.amount, 8);

      return {
        ...order,
        amount: cleanAmount,
        delayMs: Math.round(order.delayMs * intervalJitter)
      };
    });

    // 3. Inject random "human hesitation" pause (20% chance, 1.5-3x longer)
    if (Math.random() > 0.8) {
      const index = Math.floor(Math.random() * plan.childOrders.length);
      const factor = 1.5 + Math.random() * 1.5; // 1.5-3x instead of fixed 2x
      plan.childOrders[index].delayMs = Math.round(plan.childOrders[index].delayMs * factor);
    }

    return plan;
  }
}
