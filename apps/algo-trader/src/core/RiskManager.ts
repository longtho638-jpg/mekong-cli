export interface StopLossTakeProfitConfig {
  stopLossPercent?: number;   // Hard stop-loss distance from entry (e.g. 2 = 2%)
  takeProfitPercent?: number; // Take-profit distance from entry (e.g. 5 = 5%)
  dailyLossLimitUsd?: number; // Max USD loss per day before halting
}

export interface StopLossTakeProfitResult {
  stopLossHit: boolean;
  takeProfitHit: boolean;
  stopLossPrice: number;
  takeProfitPrice: number;
}

export interface TrailingStopConfig {
  trailingStop: boolean;
  trailingStopPositive?: number;
  trailingStopPositiveOffset?: number;
}

export interface TrailingStopState {
  highestPrice: number;
  stopPrice: number;
  isPositiveActive: boolean;
  entryPrice: number;
}

export class RiskManager {
  /**
   * Calculate position size based on account balance and risk percentage
   * @param balance Current account balance
   * @param riskPercentage Risk per trade (e.g., 1 for 1%)
   * @param currentPrice Current price of the asset
   * @returns Amount to buy
   */
  static calculatePositionSize(balance: number, riskPercentage: number, currentPrice: number): number {
    if (riskPercentage <= 0 || riskPercentage > 100) {
      throw new Error("Risk percentage must be between 0 and 100");
    }
    if (currentPrice <= 0) {
      throw new Error("Current price must be greater than 0");
    }
    if (balance < 0) {
      throw new Error("Balance cannot be negative");
    }

    const amountToRisk = balance * (riskPercentage / 100);
    // Ensure we don't return NaN or Infinity if something goes wrong
    const size = amountToRisk / currentPrice;
    return isFinite(size) ? size : 0;
  }

  /**
   * Check if current price triggers hard stop-loss or take-profit.
   * @param currentPrice Current market price
   * @param entryPrice Original entry price
   * @param side Trade side ('buy' = long, 'sell' = short)
   * @param config SL/TP configuration
   */
  static checkStopLossTakeProfit(
    currentPrice: number,
    entryPrice: number,
    side: 'buy' | 'sell',
    config: StopLossTakeProfitConfig
  ): StopLossTakeProfitResult {
    const isLong = side === 'buy';
    const slPercent = config.stopLossPercent ?? 0;
    const tpPercent = config.takeProfitPercent ?? 0;

    const stopLossPrice = isLong
      ? entryPrice * (1 - slPercent / 100)
      : entryPrice * (1 + slPercent / 100);

    const takeProfitPrice = isLong
      ? entryPrice * (1 + tpPercent / 100)
      : entryPrice * (1 - tpPercent / 100);

    const stopLossHit = slPercent > 0 && (
      isLong ? currentPrice <= stopLossPrice : currentPrice >= stopLossPrice
    );

    const takeProfitHit = tpPercent > 0 && (
      isLong ? currentPrice >= takeProfitPrice : currentPrice <= takeProfitPrice
    );

    return { stopLossHit, takeProfitHit, stopLossPrice, takeProfitPrice };
  }

  /**
   * Check if daily loss limit has been exceeded.
   * @param dailyPnL Total P&L for the current day
   * @param limitUsd Maximum allowed loss in USD
   * @returns true if limit exceeded (should halt trading)
   */
  static isDailyLossLimitHit(dailyPnL: number, limitUsd?: number): boolean {
    if (!limitUsd || limitUsd <= 0) return false;
    return dailyPnL <= -limitUsd;
  }

  /**
   * Initialize a trailing stop state
   */
  static initTrailingStop(price: number, config: TrailingStopConfig, defaultOffset: number = 0.02): TrailingStopState {
    const fraction = config.trailingStopPositive ?? defaultOffset;
    return {
      highestPrice: price,
      stopPrice: price * (1 - fraction),
      isPositiveActive: false,
      entryPrice: price
    };
  }

  /**
   * Update a trailing stop state based on the current price
   */
  static updateTrailingStop(
    price: number,
    state: TrailingStopState,
    config: TrailingStopConfig,
    defaultOffset: number = 0.02
  ): { state: TrailingStopState; stopHit: boolean } {
    if (!config.trailingStop) {
      return { state, stopHit: false };
    }

    if (price <= state.stopPrice) {
      return { state, stopHit: true };
    }

    let nextState = { ...state };
    if (price > state.highestPrice) {
      nextState.highestPrice = price;
    }

    let isPositiveActive = nextState.isPositiveActive;
    if (
      !isPositiveActive &&
      config.trailingStopPositiveOffset !== undefined &&
      price >= state.entryPrice * (1 + config.trailingStopPositiveOffset)
    ) {
      isPositiveActive = true;
      nextState.isPositiveActive = true;
    }

    const currentFraction = isPositiveActive && config.trailingStopPositive !== undefined
      ? config.trailingStopPositive
      : defaultOffset;

    const potentialStop = nextState.highestPrice * (1 - currentFraction);
    if (potentialStop > nextState.stopPrice) {
      nextState.stopPrice = potentialStop;
    }

    return { state: nextState, stopHit: false };
  }
}
