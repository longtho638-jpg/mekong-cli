/**
 * Adjusts position sizing based on volatility and liquidity scores.
 */

import { EventEmitter } from 'events';
import type { SymbolInfo } from '../expansion-config-types';

export interface RiskAdjusterConfig {
  basePositionUsd: number;
  maxPositionUsd: number;
  minPositionUsd: number;
}

export interface AdjustedPosition {
  symbol: string;
  positionUsd: number;
  scaleFactor: number;
}

export class RiskAdjuster extends EventEmitter {
  private readonly config: RiskAdjusterConfig;

  constructor(config: RiskAdjusterConfig) {
    super();
    this.config = config;
  }

  /**
   * Computes adjusted position size.
   * High volatility → smaller size. High volume → larger scale allowed.
   */
  adjust(symbol: SymbolInfo): AdjustedPosition {
    const { basePositionUsd, maxPositionUsd, minPositionUsd } = this.config;

    // Volatility scale: invert volatility (higher vol = smaller position)
    const volScale = Math.max(0.1, 1 - symbol.volatility * 4);

    // Liquidity scale: log-based, capped at 2x
    const liquidityScale = Math.min(2, Math.log10(symbol.volume24h / 1_000_000 + 1) / 3);

    const scaleFactor = Math.min(volScale * liquidityScale, maxPositionUsd / basePositionUsd);
    const positionUsd = Math.max(
      minPositionUsd,
      Math.min(maxPositionUsd, basePositionUsd * scaleFactor),
    );

    const result: AdjustedPosition = { symbol: symbol.symbol, positionUsd, scaleFactor };
    this.emit('adjusted', result);
    return result;
  }

  /** Batch-adjust a list of symbols. */
  adjustAll(symbols: SymbolInfo[]): AdjustedPosition[] {
    return symbols.map((s) => this.adjust(s));
  }
}
