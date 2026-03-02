/**
 * signal-filter-types — Shared types and interfaces for signal filtering and scoring.
 * Extracted from SignalFilter to enable reuse across regime detector and filter modules.
 */

import { ConsensusSignal } from './SignalGenerator';
import { MarketRegime, RegimeState } from './signal-market-regime-detector';

export type { MarketRegime, RegimeState };

export interface SignalScore {
  total: number;           // 0-100 composite score
  regimeAlignment: number; // How well signal fits current regime
  volumeScore: number;     // Volume confirmation strength
  momentumScore: number;   // Momentum alignment
  confluenceScore: number; // Multi-factor confluence
}

export interface FilterResult {
  pass: boolean;
  signal: ConsensusSignal;
  score: SignalScore;
  regime: RegimeState;
  rejectReason?: string;
}

export interface SignalFilterConfig {
  minScore: number;                // Minimum score to pass (default: 50)
  cooldownMs: number;              // Min ms between trades (default: 3600000 = 1h)
  minVolume: number;               // Min volume ratio vs avg (default: 0.5)
  adxTrendThreshold: number;       // ADX > this = trending (default: 25)
  adxRangingThreshold: number;     // ADX < this = ranging (default: 20)
  volatilityHighThreshold: number; // Vol ratio > this = volatile (default: 2.0)
  lookbackPeriod: number;          // Candles for regime calculation (default: 50)
}

export const DEFAULT_SIGNAL_FILTER_CONFIG: SignalFilterConfig = {
  minScore: 50,
  cooldownMs: 3600000,
  minVolume: 0.5,
  adxTrendThreshold: 25,
  adxRangingThreshold: 20,
  volatilityHighThreshold: 2.0,
  lookbackPeriod: 50,
};
