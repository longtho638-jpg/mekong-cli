/**
 * ExposureAggregator — aggregates cross-exchange asset exposures into
 * a unified portfolio snapshot for risk calculation and optimization.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface AssetExposure {
  asset: string;
  exchange: string;
  type: 'spot' | 'perp' | 'lending';
  amount: number;
  valueUsd: number;
  apy?: number;
}

export interface PortfolioSnapshot {
  exposures: AssetExposure[];
  totalValueUsd: number;
  timestamp: number;
}

export class ExposureAggregator extends EventEmitter {
  private exposures: AssetExposure[] = [];

  /**
   * Add or update an exposure entry (used for testing and mock data feeds).
   * In production, driven by exchange REST/WS position feeds.
   */
  addExposure(exposure: AssetExposure): void {
    // Upsert: replace if same asset+exchange+type combo exists
    const idx = this.exposures.findIndex(
      e => e.asset === exposure.asset &&
           e.exchange === exposure.exchange &&
           e.type === exposure.type,
    );
    if (idx >= 0) {
      this.exposures[idx] = exposure;
    } else {
      this.exposures.push(exposure);
    }
    logger.debug(`[ExposureAggregator] Updated ${exposure.asset} on ${exposure.exchange} (${exposure.type}): $${exposure.valueUsd}`);
  }

  getSnapshot(): PortfolioSnapshot {
    const totalValueUsd = this.exposures.reduce((sum, e) => sum + e.valueUsd, 0);
    return {
      exposures: [...this.exposures],
      totalValueUsd,
      timestamp: Date.now(),
    };
  }

  /**
   * Returns aggregate USD value per asset across all exchanges and types.
   */
  getExposureMatrix(): Map<string, number> {
    const matrix = new Map<string, number>();
    for (const e of this.exposures) {
      matrix.set(e.asset, (matrix.get(e.asset) ?? 0) + e.valueUsd);
    }
    return matrix;
  }

  clear(): void {
    this.exposures = [];
  }
}
