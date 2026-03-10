/**
 * AssetCorrelator — maps macro drift signals to expected asset returns.
 * Uses pre-computed linear regression coefficients (simulation mode).
 * y = a * signal_strength * direction_sign + b
 */

import { logger } from '../../../utils/logger';
import type { MacroDriftSignal } from './signal-fusion-engine';

export interface CorrelationEntry {
  asset: string;
  coefficient: number; // Pearson r [-1, 1]
  lagMs: number;       // response lag in milliseconds
}

interface LinearCoeff {
  a: number; // slope
  b: number; // intercept
  r2: number; // R-squared
}

// Hardcoded coefficients derived from simulated historical analysis
const COEFFICIENTS: Record<string, LinearCoeff> = {
  BTC: { a: 0.72, b: 0.001, r2: 0.61 },
  ETH: { a: 0.85, b: 0.002, r2: 0.67 },
  SOL: { a: 1.10, b: 0.003, r2: 0.58 },
};

const CORRELATION_TABLE: CorrelationEntry[] = [
  { asset: 'BTC', coefficient: 0.72, lagMs: 12_000 },
  { asset: 'ETH', coefficient: 0.85, lagMs: 8_000 },
  { asset: 'SOL', coefficient: 1.10, lagMs: 5_000 },
];

// Online correlation state (simple adaptive update)
const adaptiveCoeffs: Record<string, LinearCoeff> = structuredClone(COEFFICIENTS);

export class AssetCorrelator {
  getCorrelations(): CorrelationEntry[] {
    return CORRELATION_TABLE.map(e => ({
      ...e,
      coefficient: adaptiveCoeffs[e.asset]?.a ?? e.coefficient,
    }));
  }

  getCorrelation(asset: string, signal: MacroDriftSignal): { expectedReturn: number; confidence: number } {
    const coeff = adaptiveCoeffs[asset] ?? COEFFICIENTS['BTC'];
    const directionSign = signal.direction === 'bullish' ? 1 : signal.direction === 'bearish' ? -1 : 0;
    const x = signal.strength * directionSign;
    const expectedReturn = coeff.a * x + coeff.b;
    // Confidence: blend signal confidence with regression R²
    const confidence = signal.confidence * coeff.r2;
    logger.debug(`[AssetCorrelator] ${asset} expectedReturn=${expectedReturn.toFixed(4)} conf=${confidence.toFixed(3)}`);
    return { expectedReturn, confidence };
  }

  /**
   * Update correlation coefficients via online gradient descent step.
   * Learning rate is intentionally small for simulation stability.
   */
  updateCorrelation(asset: string, actualReturn: number, signal: MacroDriftSignal): void {
    const coeff = adaptiveCoeffs[asset];
    if (!coeff) return;
    const directionSign = signal.direction === 'bullish' ? 1 : signal.direction === 'bearish' ? -1 : 0;
    const x = signal.strength * directionSign;
    const predicted = coeff.a * x + coeff.b;
    const error = actualReturn - predicted;
    const lr = 0.01;
    coeff.a += lr * error * x;
    coeff.b += lr * error;
    logger.debug(`[AssetCorrelator] Updated ${asset} coeff.a=${coeff.a.toFixed(4)} error=${error.toFixed(4)}`);
  }
}
