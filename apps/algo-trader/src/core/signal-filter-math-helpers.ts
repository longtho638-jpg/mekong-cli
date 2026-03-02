/**
 * signal-filter-math-helpers — Statistical math utilities for signal filtering.
 * Standard deviation, R-squared (trend strength), ADX, momentum scoring.
 * Pure functions with no side effects — extracted from SignalFilter for testability.
 */

import { ICandle } from '../interfaces/ICandle';
import { SignalType } from '../interfaces/IStrategy';

/** Standard deviation of a number array */
export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** R-squared of linear regression — measures trend strength (0-1) */
export function rSquared(values: number[]): number {
  if (values.length < 3) return 0;

  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
    sumY2 += values[i] * values[i];
  }

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

  if (den === 0) return 0;
  const r = num / den;
  return r * r; // R-squared
}

/**
 * Simplified ADX: average absolute price change direction consistency.
 * Returns 0-100; values > 25 indicate trending market.
 */
export function calculateADX(candles: ICandle[]): number {
  if (candles.length < 14) return 0;

  let plusDM = 0;
  let minusDM = 0;
  let trSum = 0;

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    if (upMove > downMove && upMove > 0) plusDM += upMove;
    if (downMove > upMove && downMove > 0) minusDM += downMove;

    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trSum += tr;
  }

  if (trSum === 0) return 0;

  const plusDI = (plusDM / trSum) * 100;
  const minusDI = (minusDM / trSum) * 100;
  const diSum = plusDI + minusDI;

  if (diSum === 0) return 0;
  return (Math.abs(plusDI - minusDI) / diSum) * 100;
}

/**
 * Calculate momentum alignment score (0-25).
 * BUY signal + positive momentum = high score; counter-trend = lower.
 */
export function calculateMomentumScore(signalType: SignalType, recentCandles: ICandle[]): number {
  if (recentCandles.length < 10) return 12.5;

  const recent = recentCandles.slice(-10);
  const firstClose = recent[0].close;
  const lastClose = recent[recent.length - 1].close;
  const pctChange = ((lastClose - firstClose) / firstClose) * 100;

  if (signalType === SignalType.BUY && pctChange > 0) {
    return Math.min(25, 15 + pctChange * 2);
  }
  if (signalType === SignalType.SELL && pctChange < 0) {
    return Math.min(25, 15 + Math.abs(pctChange) * 2);
  }
  // Counter-trend: lower score but not zero (mean reversion possible)
  return Math.max(5, 12 - Math.abs(pctChange));
}

/** Average volume over a set of candles */
export function averageVolume(candles: ICandle[]): number {
  if (candles.length === 0) return 0;
  return candles.reduce((s, c) => s + c.volume, 0) / candles.length;
}
