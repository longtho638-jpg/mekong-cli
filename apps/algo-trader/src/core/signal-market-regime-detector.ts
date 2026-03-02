/**
 * signal-market-regime-detector — Detects market regime (trending/ranging/volatile) from candle data.
 * Uses ADX, volatility ratio, and R-squared trend strength.
 * Extracted from SignalFilter for focused, reusable regime detection logic.
 */

import { ICandle } from '../interfaces/ICandle';
import { SignalFilterConfig } from './signal-filter-types';
import { calculateADX, stddev, rSquared } from './signal-filter-math-helpers';

export type MarketRegime = 'trending' | 'ranging' | 'volatile';

export interface RegimeState {
  regime: MarketRegime;
  adx: number;             // Average Directional Index (0-100)
  volatilityRatio: number; // Current vs historical volatility
  trendStrength: number;   // 0-1 confidence in trend
}

/**
 * Detect current market regime from recent candles.
 * Returns 'ranging' with zeroed metrics if insufficient data (< 14 candles).
 */
export function detectMarketRegime(
  recentCandles: ICandle[],
  config: Pick<SignalFilterConfig, 'lookbackPeriod' | 'volatilityHighThreshold' | 'adxTrendThreshold'>,
): RegimeState {
  if (recentCandles.length < 14) {
    return { regime: 'ranging', adx: 0, volatilityRatio: 1, trendStrength: 0 };
  }

  const closes = recentCandles.map(c => c.close);
  const period = Math.min(config.lookbackPeriod, closes.length);
  const recent = closes.slice(-period);

  const adx = calculateADX(recentCandles.slice(-period));

  // Volatility ratio: recent stddev vs longer-term stddev
  const recentVol = stddev(recent.slice(-14));
  const historicalVol = stddev(recent);
  const volatilityRatio = historicalVol > 0 ? recentVol / historicalVol : 1;

  // Trend strength: linear regression R-squared
  const trendStrength = rSquared(recent);

  let regime: MarketRegime;
  if (volatilityRatio > config.volatilityHighThreshold) {
    regime = 'volatile';
  } else if (adx > config.adxTrendThreshold) {
    regime = 'trending';
  } else {
    regime = 'ranging';
  }

  return { regime, adx, volatilityRatio, trendStrength };
}
