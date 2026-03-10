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

export interface VolatilityAdjustmentConfig {
  atrMultiplier?: number; // Multiplier for ATR-based stops
  minVolatility?: number; // Minimum volatility threshold
  maxVolatility?: number; // Maximum volatility threshold
  volatilityLookback?: number; // Days for volatility calculation
}

export interface DrawdownControlConfig {
  maxDrawdownPercent: number; // Maximum drawdown allowed
  recoveryPercentage: number; // Percentage of high-watermark to resume after drawdown
  resetAfterRecovery: boolean; // Whether to reset stats after recovery
}

export interface DynamicRiskParams {
  positionSizeMultiplier: number; // Multiplier based on volatility or market conditions
  stopLossMultiplier: number; // Adjustment to stop-loss distance
  leverageAdjustment: number; // Adjustments to position leverage
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

  /**
   * Calculate dynamic position size based on market volatility
   * @param baseBalance Base account balance
   * @param baseRiskPercent Base risk percentage
   * @param currentPrice Current asset price
   * @param atr Average True Range for volatility measure
   * @param config Volatility adjustment configuration
   * @returns Adjusted position size based on market conditions
   */
  static calculateDynamicPositionSize(
    baseBalance: number,
    baseRiskPercent: number,
    currentPrice: number,
    atr: number,
    config: VolatilityAdjustmentConfig = {}
  ): number {
    // Calculate base position size
    const basePositionSize = this.calculatePositionSize(baseBalance, baseRiskPercent, currentPrice);

    // Default multiplier is 1 (no adjustment)
    let multiplier = 1;

    const atrMultiplier = config.atrMultiplier || 1;

    // Adjust position size based on ATR (higher ATR = higher volatility = reduce position size)
    // Normalize ATR as a percentage of price
    const atrPercent = (atr / currentPrice) * 100;

    // Use default volatility parameters if not specified
    const minVolatility = config.minVolatility || 1.5; // 1.5% minimum threshold
    const maxVolatility = config.maxVolatility || 8.0; // 8% maximum threshold

    // If current volatility is above minimum threshold, reduce position size
    if (atrPercent > minVolatility) {
      // Calculate how much above the minimum volatility we are
      const excessVolatility = Math.min(atrPercent - minVolatility, maxVolatility - minVolatility);
      const volatilityRatio = excessVolatility / (maxVolatility - minVolatility);

      // Reduce position size as volatility increases (inverse relationship)
      multiplier = Math.max(0.1, 1 - volatilityRatio * atrMultiplier);
    }

    return basePositionSize * multiplier;
  }

  /**
   * Calculate dynamic stop-loss based on Average True Range (ATR)
   * @param entryPrice Entry price of the trade
   * @param atr Average True Range value
   * @param atrMultiplier Multiplier for ATR (typically 2-3)
   * @param side Trade side ('buy' for long, 'sell' for short)
   * @returns Dynamic stop-loss price
   */
  static calculateAtrStopLoss(
    entryPrice: number,
    atr: number,
    atrMultiplier: number = 2,
    side: 'buy' | 'sell'
  ): number {
    if (side === 'buy') {
      // For long positions, stop-loss is below entry
      return entryPrice - (atr * atrMultiplier);
    } else {
      // For short positions, stop-loss is above entry
      return entryPrice + (atr * atrMultiplier);
    }
  }

  /**
   * Check drawdown against limits
   * @param currentBalance Current account balance
   * @param peakBalance Peak account balance reached
   * @param config Drawdown control configuration
   * @returns Whether drawdown limit is exceeded
   */
  static checkDrawdownLimit(
    currentBalance: number,
    peakBalance: number,
    config: DrawdownControlConfig
  ): { exceeded: boolean; drawdownPercent: number } {
    if (peakBalance <= 0) {
      throw new Error("Peak balance must be greater than 0");
    }

    const drawdownPercent = ((peakBalance - currentBalance) / peakBalance) * 100;

    return {
      exceeded: drawdownPercent >= config.maxDrawdownPercent,
      drawdownPercent
    };
  }

  /**
   * Calculate risk-adjusted metrics for portfolio management
   * @param portfolioReturn Expected portfolio return
   * @param portfolioRisk Portfolio risk (standard deviation)
   * @param riskFreeRate Risk-free interest rate
   * @returns Risk-adjusted metrics including Sharpe, Sortino, and Calmar ratios
   */
  static calculateRiskAdjustedMetrics(
    portfolioReturn: number,
    portfolioRisk: number,
    riskFreeRate: number,
    maxDrawdown: number
  ): {
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
  } {
    // Sharpe Ratio: (Portfolio Return - Risk-Free Rate) / Portfolio Risk
    const sharpeRatio = portfolioRisk !== 0 ? (portfolioReturn - riskFreeRate) / portfolioRisk : 0;

    // Sortino Ratio: Similar to Sharpe but only considers downside deviation
    // For simplicity, we'll use a simplified version assuming portfolioRisk represents total risk
    // In a full implementation, this would calculate only downside deviation
    const sortinoRatio = portfolioRisk !== 0 ? (portfolioReturn - riskFreeRate) / portfolioRisk : 0;

    // Calmar Ratio: Annualized Return / Max Drawdown
    const calmarRatio = maxDrawdown !== 0 ? portfolioReturn / Math.abs(maxDrawdown) : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      calmarRatio
    };
  }

  /**
   * Calculate dynamic risk parameters based on market conditions
   * @param volatilityPercent Current market volatility as percentage
   * @param trendStrength Strength of current market trend (0 to 1)
   * @param marketRegime Current market regime identifier
   * @returns Adjusted risk parameters
   */
  static calculateDynamicRiskParams(
    volatilityPercent: number,
    trendStrength: number = 0.5, // Default to neutral trend
    marketRegime: 'trending' | 'mean-reverting' | 'volatile' | 'quiet' = 'trending'
  ): DynamicRiskParams {
    // Base multipliers
    let positionSizeMultiplier = 1.0;
    let stopLossMultiplier = 1.0;
    let leverageAdjustment = 1.0;

    // Adjust based on volatility
    if (volatilityPercent > 5) {
      // High volatility - reduce risk
      positionSizeMultiplier *= 0.7;
      leverageAdjustment *= 0.8;
      stopLossMultiplier *= 1.2; // Wider stops in high volatility
    } else if (volatilityPercent < 2) {
      // Low volatility - can increase risk slightly
      positionSizeMultiplier *= 1.1;
      leverageAdjustment *= 1.1;
    }

    // Adjust based on trend strength
    if (trendStrength > 0.7) {
      // Strong trend - can take more position and tighter stops
      positionSizeMultiplier *= 1.1;
      stopLossMultiplier *= 0.9; // Tighter stops in strong trends
    } else if (trendStrength < 0.3) {
      // Weak trend - reduce position size and widen stops
      positionSizeMultiplier *= 0.9;
      stopLossMultiplier *= 1.1;
    }

    // Adjust based on market regime
    switch (marketRegime) {
      case 'trending':
        positionSizeMultiplier *= 1.1;
        break;
      case 'mean-reverting':
        positionSizeMultiplier *= 0.9;
        stopLossMultiplier *= 1.1;
        break;
      case 'volatile':
        positionSizeMultiplier *= 0.8;
        stopLossMultiplier *= 1.3;
        leverageAdjustment *= 0.7;
        break;
      case 'quiet':
        positionSizeMultiplier *= 1.05;
        stopLossMultiplier *= 0.95;
        break;
    }

    return {
      positionSizeMultiplier,
      stopLossMultiplier,
      leverageAdjustment
    };
  }
}
