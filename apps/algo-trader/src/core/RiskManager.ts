/**
 * Position for correlation calculation
 */
export interface PositionReturn {
  symbol: string;
  returns: number[];
}

/**
 * Correlation matrix result
 */
export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

/**
 * Kelly configuration for binary markets
 */
export interface KellyConfig {
  fraction?: number;  // Fraction of Kelly to use (default: 0.25 = quarter Kelly)
  maxPercent?: number; // Maximum position as % of bankroll (default: 25%)
}

/**
 * Kelly criterion result
 */
export interface KellyResult {
  fullKelly: number;    // Full Kelly %
  adjustedKelly: number; // Kelly * fraction
  positionSize: number; // USD to allocate
}

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

/**
 * RiskManager configuration
 */
export interface RiskManagerConfig {
  bankroll: number;
  maxPositionPercent?: number;  // Max % of bankroll per position (default: 25%)
  dailyLossLimit?: number;      // Max daily loss in USD
  kellyFraction?: number;       // Fraction of Kelly to use (default: 0.25)
}

const DEFAULT_CONFIG: RiskManagerConfig = {
  bankroll: 10000,
  maxPositionPercent: 25,
  dailyLossLimit: 500,
  kellyFraction: 0.25,  // Quarter Kelly
};

export interface DynamicRiskParams {
  positionSizeMultiplier: number; // Multiplier based on volatility or market conditions
  stopLossMultiplier: number; // Adjustment to stop-loss distance
  leverageAdjustment: number; // Adjustments to position leverage
}

/**
 * Cache cho calculateDynamicRiskParams — key = volatility|trend|regime
 * Giảm tính toán lặp khi market regime không đổi
 */
const dynamicRiskCache = new Map<string, DynamicRiskParams>();
const DYNAMIC_RISK_TTL = 1000; // 1 second — đủ nhanh để theo market changes

interface CachedRiskParam {
  params: DynamicRiskParams;
  timestamp: number;
}
const riskCache = new Map<string, CachedRiskParam>();

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

  // ============================================================
  // KELLY CRITERION & POSITION SIZING
  // ============================================================

  /**
   * Calculate Kelly Criterion for binary markets (Polymarket-style)
   * Formula: f* = (p*b - q) / b where:
   *   - p = probability of winning (edge)
   *   - q = 1 - p = probability of losing
   *   - b = odds (payout ratio, e.g., 0.8 for 80% return)
   *
   * @param edge Win probability (0-1), e.g., 0.55 = 55% edge
   * @param odds Payout ratio (decimal), e.g., 0.8 means 80% return on win
   * @param config Optional Kelly configuration
   * @returns Kelly result with full/adjusted percentages and position size
   */
  static calculateKelly(
    edge: number,
    odds: number,
    config?: KellyConfig
  ): KellyResult {
    if (edge < 0 || edge > 1) {
      throw new Error('Edge must be between 0 and 1');
    }
    if (odds <= 0) {
      throw new Error('Odds must be positive');
    }

    const p = edge;
    const q = 1 - p;
    const b = odds;

    // Kelly formula: f* = (bp - q) / b
    const fullKelly = ((b * p - q) / b);

    // Clamp negative Kelly to 0 (don't bet)
    const clampedKelly = Math.max(0, Math.min(1, fullKelly));

    // Apply fraction (e.g., quarter Kelly = 0.25)
    const fraction = config?.fraction ?? 0.25;
    const adjustedKelly = clampedKelly * fraction;

    // Apply max position limit
    const maxPercent = (config?.maxPercent ?? 25) / 100;
    const cappedKelly = Math.min(adjustedKelly, maxPercent);

    return {
      fullKelly: clampedKelly * 100,      // As percentage
      adjustedKelly: cappedKelly * 100,   // As percentage (after fraction + cap)
      positionSize: 0                      // Set by caller based on bankroll
    };
  }

  /**
   * Calculate Kelly position size given bankroll
   */
  static calculateKellyPositionSize(
    edge: number,
    odds: number,
    bankroll: number,
    config?: KellyConfig
  ): number {
    const kellyResult = this.calculateKelly(edge, odds, config);
    return bankroll * (kellyResult.adjustedKelly / 100);
  }

  // ============================================================
  // POSITION LIMITS
  // ============================================================

  /**
   * Check if a position size is within allowed limits
   * @param positionSize USD amount of the position
   * @param bankroll Total bankroll
   * @param maxPositionPercent Maximum position as % of bankroll (default: 25%)
   * @returns true if position is within limits
   */
  static checkPositionLimit(
    positionSize: number,
    bankroll: number,
    maxPositionPercent?: number
  ): boolean {
    if (positionSize < 0) {
      return false;
    }
    const maxPercent = maxPositionPercent ?? 25;
    const maxAllowed = bankroll * (maxPercent / 100);
    return positionSize <= maxAllowed;
  }

  // ============================================================
  // DAILY LOSS LIMIT
  // ============================================================

  /**
   * Check if daily loss limit has been exceeded
   * @param dailyPnL Current daily P&L (negative = loss)
   * @param limit Daily loss limit in USD
   * @returns true if limit exceeded (should halt trading)
   */
  static checkDailyLoss(dailyPnL: number, limit: number): boolean {
    if (limit <= 0) {
      return false;
    }
    return dailyPnL < -limit;
  }

  // ============================================================
  // CORRELATION MATRIX
  // ============================================================

  /**
   * Calculate correlation matrix between positions
   * Uses Pearson correlation coefficient on return series
   *
   * @param positions Array of positions with return histories
   * @returns Correlation matrix with symbols and NxN matrix
   */
  static calculateCorrelation(positions: PositionReturn[]): CorrelationMatrix {
    const n = positions.length;
    if (n === 0) {
      return { symbols: [], matrix: [] };
    }

    // Find minimum common length
    const minLen = Math.min(...positions.map(p => p.returns.length));
    if (minLen < 2) {
      // Not enough data for correlation
      const identity = Array(n).fill(0).map((_, i) =>
        Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
      );
      return {
        symbols: positions.map(p => p.symbol),
        matrix: identity
      };
    }

    // Truncate to common length
    const returns = positions.map(p => p.returns.slice(-minLen));
    const symbols = positions.map(p => p.symbol);

    // Calculate means
    const means = returns.map(r => r.reduce((a, b) => a + b, 0) / minLen);

    // Calculate correlation matrix
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          // Pearson correlation
          let numerator = 0;
          let denomI = 0;
          let denomJ = 0;
          for (let k = 0; k < minLen; k++) {
            const di = returns[i][k] - means[i];
            const dj = returns[j][k] - means[j];
            numerator += di * dj;
            denomI += di * di;
            denomJ += dj * dj;
          }
          const denom = Math.sqrt(denomI * denomJ);
          matrix[i][j] = denom > 0 ? numerator / denom : 0;
        }
      }
    }

    return { symbols, matrix };
  }

  /**
   * Calculate correlation between two return series
   */
  static correlationBetween(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    if (n < 2) return 0;

    const r1 = returns1.slice(-n);
    const r2 = returns2.slice(-n);

    const mean1 = r1.reduce((a, b) => a + b, 0) / n;
    const mean2 = r2.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < n; i++) {
      const d1 = r1[i] - mean1;
      const d2 = r2[i] - mean2;
      numerator += d1 * d2;
      denom1 += d1 * d1;
      denom2 += d2 * d2;
    }

    const denom = Math.sqrt(denom1 * denom2);
    return denom > 0 ? numerator / denom : 0;
  }

  // ============================================================
  // INVENTORY SKEW (Market Making)
  // ============================================================

  /**
   * Calculate inventory skew for market making
   * Skew adjusts prices based on current inventory to reduce risk
   *
   * Formula: skew = -inventory * inventorySkewFactor
   * Positive inventory (long) → skew down (encourage sells)
   * Negative inventory (short) → skew up (encourage buys)
   *
   * @param delta Net inventory delta (positive = long, negative = short)
   * @param maxInventory Maximum inventory before full skew
   * @param maxSkewPercent Maximum skew percentage (default: 1%)
   * @returns Skew as a decimal (e.g., 0.005 = 0.5% price adjustment)
   */
  static getInventorySkew(
    delta: number,
    maxInventory: number,
    maxSkewPercent: number = 1
  ): number {
    if (maxInventory <= 0) {
      return 0;
    }

    // Normalize inventory to [-1, 1] range
    const normalizedInventory = Math.max(-1, Math.min(1, delta / maxInventory));

    // Skew is opposite of inventory (long → skew down, short → skew up)
    const skewFraction = -normalizedInventory * (maxSkewPercent / 100);

    return skewFraction;
  }

  /**
   * Get skewed bid/ask prices for market making
   * @param midPrice Mid-market price
   * @param delta Current inventory
   * @param maxInventory Maximum inventory
   * @param spread Bid-ask spread (default: 0.02 = 2%)
   * @param maxSkewPercent Maximum skew (default: 1%)
   * @returns Object with skewed bid and ask prices
   */
  static getSkewedPrices(
    midPrice: number,
    delta: number,
    maxInventory: number,
    spread: number = 0.02,
    maxSkewPercent: number = 1
  ): { bid: number; ask: number; skew: number } {
    const skew = this.getInventorySkew(delta, maxInventory, maxSkewPercent);
    const halfSpread = spread / 2;

    // Apply skew to both bid and ask in the same direction
    // Long inventory → lower both prices (encourage selling)
    // Short inventory → raise both prices (encourage buying)
    const bid = midPrice * (1 - halfSpread + skew);
    const ask = midPrice * (1 + halfSpread + skew);

    return { bid, ask, skew };
  }
}
