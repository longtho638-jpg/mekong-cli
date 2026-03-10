/**
 * Circuit Breakers & Risk Guards — Advanced risk management layer.
 *
 * Features:
 * - Max drawdown circuit breaker (halt trading at -20%)
 * - Consecutive loss limiter (halt after 5 losses)
 * - Daily loss circuit breaker with auto-reset
 * - Volatility-based position sizing (ATR)
 * - Kill switch for emergency shutdown
 */

import { logger } from '../utils/logger';

export interface CircuitBreakerState {
  isTripped: boolean;
  trippedAt?: number;
  reason?: string;
  resetAt?: number;
}

export interface DailyLossTracker {
  date: string;
  totalLoss: number;
  limit: number;
}

export interface ConsecutiveLossTracker {
  losses: number;
  lastResetAt?: number;
}

/**
 * Max Drawdown Circuit Breaker
 * Halts trading when drawdown exceeds threshold (default: -20%)
 */
export class MaxDrawdownCircuitBreaker {
  private state: CircuitBreakerState = { isTripped: false };
  private threshold: number;

  constructor(threshold: number = 20) {
    this.threshold = threshold;
  }

  check(currentDrawdown: number): CircuitBreakerState {
    if (currentDrawdown >= this.threshold) {
      this.state = {
        isTripped: true,
        trippedAt: Date.now(),
        reason: `Max drawdown ${this.threshold}% exceeded (current: ${currentDrawdown.toFixed(2)}%)`,
      };
      logger.warn(`[CircuitBreaker] Max drawdown tripped: ${currentDrawdown.toFixed(2)}% >= ${this.threshold}%`);
    }
    return this.state;
  }

  reset(): void {
    this.state = { isTripped: false };
    logger.info('[CircuitBreaker] Max drawdown reset');
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

/**
 * Consecutive Loss Limiter
 * Halts trading after N consecutive losses
 */
export class ConsecutiveLossLimiter {
  private state: CircuitBreakerState = { isTripped: false };
  private tracker: ConsecutiveLossTracker = { losses: 0 };
  private maxLosses: number;

  constructor(maxLosses: number = 5) {
    this.maxLosses = maxLosses;
  }

  recordTrade(profit: number): CircuitBreakerState {
    if (profit < 0) {
      this.tracker.losses++;
      logger.debug(`[CircuitBreaker] Consecutive loss #${this.tracker.losses}`);

      if (this.tracker.losses >= this.maxLosses) {
        this.state = {
          isTripped: true,
          trippedAt: Date.now(),
          reason: `${this.maxLosses} consecutive losses`,
        };
        logger.warn(`[CircuitBreaker] Consecutive loss limiter tripped: ${this.maxLosses} losses`);
      }
    } else {
      this.tracker.losses = 0;
    }
    return this.state;
  }

  reset(): void {
    this.tracker = { losses: 0, lastResetAt: Date.now() };
    this.state = { isTripped: false };
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

/**
 * Daily Loss Circuit Breaker
 * Halts trading when daily P&L hits limit, auto-resets at midnight
 */
export class DailyLossCircuitBreaker {
  private state: CircuitBreakerState = { isTripped: false };
  private tracker: DailyLossTracker = { date: '', totalLoss: 0, limit: 0 };
  private limitUsd: number;

  constructor(limitUsd: number = 500) {
    this.limitUsd = limitUsd;
    this.resetTracker();
  }

  private resetTracker(): void {
    const today = new Date().toISOString().split('T')[0];
    this.tracker = { date: today, totalLoss: 0, limit: this.limitUsd };
  }

  checkDailyLoss(dailyPnL: number): CircuitBreakerState {
    // Reset if new day
    const today = new Date().toISOString().split('T')[0];
    if (this.tracker.date !== today) {
      this.resetTracker();
      this.state = { isTripped: false };
      logger.info('[CircuitBreaker] Daily loss reset for new day');
    }

    // Update total loss
    if (dailyPnL < 0) {
      this.tracker.totalLoss = Math.abs(dailyPnL);
    }

    // Check if limit hit
    if (this.tracker.totalLoss >= this.tracker.limit) {
      this.state = {
        isTripped: true,
        trippedAt: Date.now(),
        reason: `Daily loss limit $${this.limitUsd} exceeded (current: $${this.tracker.totalLoss.toFixed(2)})`,
        resetAt: this.getNextMidnight(),
      };
      logger.warn(`[CircuitBreaker] Daily loss limit tripped: $${this.tracker.totalLoss.toFixed(2)} >= $${this.limitUsd}`);
    }

    return this.state;
  }

  private getNextMidnight(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  reset(): void {
    this.state = { isTripped: false };
    this.resetTracker();
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  getTracker(): DailyLossTracker {
    return { ...this.tracker };
  }
}

/**
 * Volatility Position Sizer
 * Reduces position size when volatility (ATR) spikes
 */
export class VolatilityPositionSizer {
  private normalRiskPercent: number;
  private atrThreshold: number;
  private currentAtr: number = 0;

  constructor(normalRiskPercent: number = 2, atrThreshold: number = 3) {
    this.normalRiskPercent = normalRiskPercent;
    this.atrThreshold = atrThreshold;
  }

  /**
   * Calculate risk percentage based on current ATR
   * @param currentAtr Current Average True Range value
   * @param averageAtr Historical average ATR
   * @returns Adjusted risk percentage
   */
  calculateRiskPercent(currentAtr: number, averageAtr: number): number {
    this.currentAtr = currentAtr;
    const atrRatio = currentAtr / averageAtr;

    if (atrRatio >= this.atrThreshold) {
      logger.warn(`[VolSizer] High volatility detected: ATR ratio ${atrRatio.toFixed(2)}x, reducing risk`);
      return this.normalRiskPercent * 0.25; // 25% of normal risk
    }

    if (atrRatio >= 2) {
      logger.debug(`[VolSizer] Elevated volatility: ATR ratio ${atrRatio.toFixed(2)}x, reducing risk`);
      return this.normalRiskPercent * 0.5; // 50% of normal risk
    }

    return this.normalRiskPercent;
  }

  /**
   * Calculate position size with volatility adjustment
   * @param balance Account balance
   * @param currentPrice Current asset price
   * @param currentAtr Current ATR value
   * @param averageAtr Historical average ATR
   * @returns Position size
   */
  calculatePositionSize(
    balance: number,
    currentPrice: number,
    currentAtr: number,
    averageAtr: number
  ): number {
    const riskPercent = this.calculateRiskPercent(currentAtr, averageAtr);
    const riskAmount = balance * (riskPercent / 100);
    return riskAmount / currentPrice;
  }

  getCurrentAtr(): number {
    return this.currentAtr;
  }
}

/**
 * Emergency Kill Switch
 * Manual override to halt all trading immediately
 */
export class KillSwitch {
  private state: CircuitBreakerState = { isTripped: false };
  private reason?: string;

  activate(customReason?: string): void {
    const reason = customReason || 'Manual kill switch activated';
    this.state = {
      isTripped: true,
      trippedAt: Date.now(),
      reason,
    };
    this.reason = reason;
    logger.error(`[KillSwitch] ACTIVATED: ${reason}`);
  }

  reset(): void {
    logger.info('[KillSwitch] Reset');
    this.state = { isTripped: false };
    this.reason = undefined;
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  isActive(): boolean {
    return this.state.isTripped;
  }

  getReason(): string | undefined {
    return this.reason;
  }
}

/**
 * Combined Circuit Breaker Manager
 * Aggregates all circuit breakers into a single check
 */
export class CircuitBreakerManager {
  private maxDrawdown: MaxDrawdownCircuitBreaker;
  private consecutiveLoss: ConsecutiveLossLimiter;
  private dailyLoss: DailyLossCircuitBreaker;
  private volatilitySizer: VolatilityPositionSizer;
  private killSwitch: KillSwitch;

  constructor(config?: {
    maxDrawdownPercent?: number;
    maxConsecutiveLosses?: number;
    dailyLossLimitUsd?: number;
    normalRiskPercent?: number;
    atrThreshold?: number;
  }) {
    this.maxDrawdown = new MaxDrawdownCircuitBreaker(config?.maxDrawdownPercent);
    this.consecutiveLoss = new ConsecutiveLossLimiter(config?.maxConsecutiveLosses);
    this.dailyLoss = new DailyLossCircuitBreaker(config?.dailyLossLimitUsd);
    this.volatilitySizer = new VolatilityPositionSizer(
      config?.normalRiskPercent,
      config?.atrThreshold
    );
    this.killSwitch = new KillSwitch();
  }

  /**
   * Check all circuit breakers
   * @param currentDrawdown Current portfolio drawdown %
   * @param tradeProfit Optional: profit/loss of latest trade
   * @param dailyPnL Optional: daily P&L
   * @returns true if ANY circuit breaker is tripped (should halt trading)
   */
  checkAll(
    currentDrawdown: number,
    tradeProfit?: number,
    dailyPnL?: number
  ): boolean {
    // Kill switch always takes priority
    if (this.killSwitch.isActive()) {
      return true;
    }

    // Check max drawdown
    const ddState = this.maxDrawdown.check(currentDrawdown);
    if (ddState.isTripped) return true;

    // Check consecutive losses
    if (tradeProfit !== undefined) {
      const clState = this.consecutiveLoss.recordTrade(tradeProfit);
      if (clState.isTripped) return true;
    }

    // Check daily loss
    if (dailyPnL !== undefined) {
      const dlState = this.dailyLoss.checkDailyLoss(dailyPnL);
      if (dlState.isTripped) return true;
    }

    return false;
  }

  /**
   * Get volatility-adjusted risk percentage
   */
  getRiskPercent(currentAtr: number, averageAtr: number): number {
    return this.volatilitySizer.calculateRiskPercent(currentAtr, averageAtr);
  }

  /**
   * Get volatility-adjusted position size
   */
  getPositionSize(
    balance: number,
    currentPrice: number,
    currentAtr: number,
    averageAtr: number
  ): number {
    return this.volatilitySizer.calculatePositionSize(
      balance,
      currentPrice,
      currentAtr,
      averageAtr
    );
  }

  /**
   * Get status of all circuit breakers
   */
  getStatus(): {
    maxDrawdown: CircuitBreakerState;
    consecutiveLoss: CircuitBreakerState;
    dailyLoss: CircuitBreakerState;
    killSwitch: CircuitBreakerState;
    anyTripped: boolean;
  } {
    const maxDrawdown = this.maxDrawdown.getState();
    const consecutiveLoss = this.consecutiveLoss.getState();
    const dailyLoss = this.dailyLoss.getState();
    const killSwitch = this.killSwitch.getState();

    return {
      maxDrawdown,
      consecutiveLoss,
      dailyLoss,
      killSwitch,
      anyTripped: maxDrawdown.isTripped || consecutiveLoss.isTripped || dailyLoss.isTripped || killSwitch.isTripped,
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.maxDrawdown.reset();
    this.consecutiveLoss.reset();
    this.dailyLoss.reset();
    this.killSwitch.reset();
    logger.info('[CircuitBreakerManager] All circuit breakers reset');
  }

  /**
   * Activate kill switch
   */
  emergencyStop(reason?: string): void {
    this.killSwitch.activate(reason);
  }
}
