/**
 * Technical Indicators — RSI, SMA, MACD, Bollinger Bands, Z-Score, Correlation, StdDev.
 * Wraps `technicalindicators` lib with consistent API + pure-math helpers.
 */

import { RSI, SMA, MACD, BollingerBands } from 'technicalindicators';

export interface MacdResult {
  MACD?: number;
  signal?: number;
  histogram?: number;
}

export interface BBandsResult {
  middle: number;
  upper: number;
  lower: number;
  pb: number;
}

export class Indicators {
  static macd(values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MacdResult[] {
    return MACD.calculate({ values, fastPeriod, slowPeriod, signalPeriod, SimpleMAOscillator: false, SimpleMASignal: false });
  }

  static bbands(values: number[], period = 20, stdDev = 2): BBandsResult[] {
    return BollingerBands.calculate({ values, period, stdDev });
  }

  static getLastBBands(values: BBandsResult[]): BBandsResult | null {
    if (!values || values.length === 0) return null;
    return values[values.length - 1];
  }

  static rsi(values: number[], period = 14): number[] {
    return RSI.calculate({ values, period });
  }

  static sma(values: number[], period: number): number[] {
    return SMA.calculate({ values, period });
  }

  /** Get last value from indicator array, 0 if empty */
  static getLast(values: number[]): number {
    if (!values || values.length === 0) return 0;
    return values[values.length - 1];
  }

  /** Z-Score: (value - mean) / stdDev */
  static zScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  /** Population standard deviation */
  static standardDeviation(values: number[]): number {
    const n = values.length;
    if (n === 0) return 0;
    let sum = 0, sumSq = 0;
    for (let i = 0; i < n; i++) { sum += values[i]; sumSq += values[i] * values[i]; }
    const mean = sum / n;
    return Math.sqrt(Math.max(0, (sumSq / n) - (mean * mean)));
  }

  /** Pearson correlation coefficient between two arrays */
  static correlation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX, dy = y[i] - meanY;
      num += dx * dy; denX += dx * dx; denY += dy * dy;
    }
    if (denX === 0 || denY === 0) return 0;
    return num / Math.sqrt(denX * denY);
  }
}
