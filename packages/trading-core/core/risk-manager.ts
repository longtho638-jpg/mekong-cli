/**
 * Risk Manager — Position sizing, stop-loss/take-profit, trailing stops, daily loss limits.
 * Stateless utility: all methods are static for easy reuse across any trading system.
 */

export interface StopLossTakeProfitConfig {
  stopLossPercent?: number;
  takeProfitPercent?: number;
  dailyLossLimitUsd?: number;
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
  /** Calculate position size based on balance, risk %, and current price */
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
    const size = (balance * (riskPercentage / 100)) / currentPrice;
    return isFinite(size) ? size : 0;
  }

  /** Check if current price triggers hard stop-loss or take-profit */
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

    const stopLossHit = slPercent > 0 && (isLong ? currentPrice <= stopLossPrice : currentPrice >= stopLossPrice);
    const takeProfitHit = tpPercent > 0 && (isLong ? currentPrice >= takeProfitPrice : currentPrice <= takeProfitPrice);

    return { stopLossHit, takeProfitHit, stopLossPrice, takeProfitPrice };
  }

  /** Check if daily loss limit exceeded */
  static isDailyLossLimitHit(dailyPnL: number, limitUsd?: number): boolean {
    if (!limitUsd || limitUsd <= 0) return false;
    return dailyPnL <= -limitUsd;
  }

  /** Initialize trailing stop state */
  static initTrailingStop(price: number, config: TrailingStopConfig, defaultOffset: number = 0.02): TrailingStopState {
    const fraction = config.trailingStopPositive ?? defaultOffset;
    return { highestPrice: price, stopPrice: price * (1 - fraction), isPositiveActive: false, entryPrice: price };
  }

  /** Update trailing stop — returns new state + whether stop was hit */
  static updateTrailingStop(
    price: number,
    state: TrailingStopState,
    config: TrailingStopConfig,
    defaultOffset: number = 0.02
  ): { state: TrailingStopState; stopHit: boolean } {
    if (!config.trailingStop) return { state, stopHit: false };
    if (price <= state.stopPrice) return { state, stopHit: true };

    const nextState = { ...state };
    if (price > state.highestPrice) nextState.highestPrice = price;

    let isPositiveActive = nextState.isPositiveActive;
    if (!isPositiveActive && config.trailingStopPositiveOffset !== undefined &&
        price >= state.entryPrice * (1 + config.trailingStopPositiveOffset)) {
      isPositiveActive = true;
      nextState.isPositiveActive = true;
    }

    const currentFraction = isPositiveActive && config.trailingStopPositive !== undefined
      ? config.trailingStopPositive : defaultOffset;
    const potentialStop = nextState.highestPrice * (1 - currentFraction);
    if (potentialStop > nextState.stopPrice) nextState.stopPrice = potentialStop;

    return { state: nextState, stopHit: false };
  }
}
