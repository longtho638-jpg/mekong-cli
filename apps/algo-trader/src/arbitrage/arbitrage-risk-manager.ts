/**
 * Arbitrage Risk Manager
 *
 * Circuit breaker + daily P&L tracking for arbitrage trading.
 * Prevents runaway losses and enforces position limits.
 */

export interface ArbRiskConfig {
  maxPositionSizeUsd: number;    // default 100
  maxDailyLossUsd: number;       // default 500
  maxTradesPerDay: number;       // default 50
  minBalanceUsd: number;         // stop if balance < this
}

export interface RiskStatus {
  dailyPnlUsd: number;
  tradeCount: number;
  isCircuitBroken: boolean;
  reason?: string;
}

export class ArbitrageRiskManager {
  private config: ArbRiskConfig;
  private dailyPnlUsd = 0;
  private tradeCount = 0;
  private _isCircuitBroken = false;
  private circuitReason?: string;

  constructor(config: ArbRiskConfig) {
    this.config = config;
  }

  /**
   * Pre-execution risk check
   * Validates: circuit breaker status, position size, daily loss, balances, trade count
   */
  preCheck(
    positionSizeUsd: number,
    buyExchangeBalance: number,
    sellExchangeBalance: number,
    sellAmount: number
  ): { allowed: boolean; reason?: string } {
    // Check circuit breaker
    if (this._isCircuitBroken) {
      return { allowed: false, reason: this.circuitReason || 'Circuit breaker tripped' };
    }

    // Check position size limit
    if (positionSizeUsd > this.config.maxPositionSizeUsd) {
      return {
        allowed: false,
        reason: `Position size ${positionSizeUsd} USD exceeds max ${this.config.maxPositionSizeUsd} USD`,
      };
    }

    // Check daily loss limit
    if (this.dailyPnlUsd < -this.config.maxDailyLossUsd) {
      this._isCircuitBroken = true;
      this.circuitReason = `Daily loss ${this.dailyPnlUsd.toFixed(2)} USD exceeds limit ${this.config.maxDailyLossUsd} USD`;
      return { allowed: false, reason: this.circuitReason };
    }

    // Check trade count limit
    if (this.tradeCount >= this.config.maxTradesPerDay) {
      return {
        allowed: false,
        reason: `Trade count ${this.tradeCount} reaches daily limit ${this.config.maxTradesPerDay}`,
      };
    }

    // Check minimum balance
    if (buyExchangeBalance < this.config.minBalanceUsd) {
      return {
        allowed: false,
        reason: `Buy exchange balance ${buyExchangeBalance.toFixed(2)} USD below min ${this.config.minBalanceUsd} USD`,
      };
    }

    if (sellExchangeBalance < sellAmount) {
      return {
        allowed: false,
        reason: `Sell exchange balance ${sellExchangeBalance.toFixed(8)} < required ${sellAmount.toFixed(8)}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record trade result and update P&L
   * Trips circuit breaker if daily loss exceeded
   */
  recordTrade(profitUsd: number): void {
    this.dailyPnlUsd += profitUsd;
    this.tradeCount++;

    // Check if daily loss limit exceeded
    if (this.dailyPnlUsd < -this.config.maxDailyLossUsd && !this._isCircuitBroken) {
      this._isCircuitBroken = true;
      this.circuitReason = `Daily loss ${this.dailyPnlUsd.toFixed(2)} USD exceeds limit ${this.config.maxDailyLossUsd} USD`;
    }
  }

  /**
   * Reset daily counters at UTC midnight
   */
  resetDaily(): void {
    this.dailyPnlUsd = 0;
    this.tradeCount = 0;
    this._isCircuitBroken = false;
    this.circuitReason = undefined;
  }

  /**
   * Get current risk status
   */
  getStatus(): RiskStatus {
    return {
      dailyPnlUsd: this.dailyPnlUsd,
      tradeCount: this.tradeCount,
      isCircuitBroken: this._isCircuitBroken,
      reason: this.circuitReason,
    };
  }

  /**
   * Check if circuit breaker is tripped
   */
  get isCircuitBroken(): boolean {
    return this._isCircuitBroken;
  }

  /**
   * Get daily P&L
   */
  getDailyPnl(): number {
    return this.dailyPnlUsd;
  }

  /**
   * Get trade count
   */
  getTradeCount(): number {
    return this.tradeCount;
  }
}
