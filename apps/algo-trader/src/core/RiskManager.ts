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
    // Simplified: assuming we buy with the full risked amount effectively used as margin or cost
    // In a real scenario with Stop Loss, this calculation is: (RiskAmount) / (Entry - StopLoss)
    // Here we implement the prompt's "Position Sizing 1%" which likely means "Use 1% of balance to buy"

    return amountToRisk / currentPrice;
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
