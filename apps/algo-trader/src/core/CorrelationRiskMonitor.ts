/**
 * CorrelationRiskMonitor - Portfolio correlation tracking
 * Monitors correlations between strategy returns, flags high correlations
 */

import {
  PortfolioCorrelationMatrixCalculator,
  CorrelationInput,
  CorrelationResult,
} from './portfolio-correlation-matrix-calculator';

export interface CorrelationAlert {
  symbolA: string;
  symbolB: string;
  correlation: number;
  threshold: number;
  timestamp: number;
  severity: 'warning' | 'critical';
}

export interface CorrelationHeatMapData {
  symbols: string[];
  values: number[][];
  thresholds: {
    warning: number;
    critical: number;
  };
}

export interface CorrelationMonitorConfig {
  warningThreshold: number; // Default: 0.75
  criticalThreshold: number; // Default: 0.85
  minDataPoints: number; // Minimum returns needed for calculation
}

const DEFAULT_CONFIG: CorrelationMonitorConfig = {
  warningThreshold: 0.75,
  criticalThreshold: 0.85,
  minDataPoints: 10,
};

export class CorrelationRiskMonitor {
  private config: CorrelationMonitorConfig;
  private calculator: PortfolioCorrelationMatrixCalculator;
  private returnSeries: Map<string, number[]> = new Map();
  private alerts: CorrelationAlert[] = [];
  private lastMatrixUpdate: number = 0;

  constructor(config?: Partial<CorrelationMonitorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.calculator = new PortfolioCorrelationMatrixCalculator(
      this.config.criticalThreshold
    );
  }

  /**
   * Add a return data point for a symbol
   */
  addReturn(symbol: string, returnValue: number): void {
    if (!this.returnSeries.has(symbol)) {
      this.returnSeries.set(symbol, []);
    }
    const series = this.returnSeries.get(symbol)!;
    series.push(returnValue);

    // Keep only last 100 data points per symbol
    if (series.length > 100) {
      series.shift();
    }
  }

  /**
   * Set return series for a symbol (bulk update)
   */
  setReturnSeries(symbol: string, returns: number[]): void {
    this.returnSeries.set(symbol, returns.slice(-100));
  }

  /**
   * Get return series for a symbol
   */
  getReturnSeries(symbol: string): number[] {
    return this.returnSeries.get(symbol) || [];
  }

  /**
   * Calculate correlation matrix and generate alerts
   */
  updateCorrelations(): CorrelationResult {
    const positions: Array<{ symbol: string; returns: number[] }> = [];

    for (const [symbol, returns] of this.returnSeries.entries()) {
      if (returns.length >= this.config.minDataPoints) {
        positions.push({ symbol, returns });
      }
    }

    if (positions.length < 2) {
      return { matrix: {}, highCorrelationPairs: [] };
    }

    const result = this.calculator.calculate({ positions });
    this.lastMatrixUpdate = Date.now();

    // Generate alerts for high correlations
    this.generateAlerts(result);

    return result;
  }

  /**
   * Get current alerts
   */
  getAlerts(): CorrelationAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Generate heat map data for visualization
   */
  getHeatMapData(): CorrelationHeatMapData {
    const symbols = Array.from(this.returnSeries.keys()).filter(
      s => (this.returnSeries.get(s)?.length || 0) >= this.config.minDataPoints
    );

    const result = this.updateCorrelations();
    const size = symbols.length;
    const values: number[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i === j) {
          values[i][j] = 1;
        } else if (result.matrix[symbols[i]]?.[symbols[j]] !== undefined) {
          values[i][j] = result.matrix[symbols[i]][symbols[j]];
        }
      }
    }

    return {
      symbols,
      values,
      thresholds: {
        warning: this.config.warningThreshold,
        critical: this.config.criticalThreshold,
      },
    };
  }

  /**
   * Remove a symbol from tracking
   */
  removeSymbol(symbol: string): void {
    this.returnSeries.delete(symbol);
    this.alerts = this.alerts.filter(
      a => a.symbolA !== symbol && a.symbolB !== symbol
    );
  }

  /**
   * Reset monitor state
   */
  reset(): void {
    this.returnSeries.clear();
    this.alerts = [];
    this.lastMatrixUpdate = 0;
  }

  private generateAlerts(result: CorrelationResult): void {
    this.alerts = [];

    for (const pair of result.highCorrelationPairs) {
      const severity =
        Math.abs(pair.correlation) >= this.config.criticalThreshold
          ? 'critical'
          : 'warning';

      this.alerts.push({
        symbolA: pair.symbolA,
        symbolB: pair.symbolB,
        correlation: pair.correlation,
        threshold: this.config.criticalThreshold,
        timestamp: Date.now(),
        severity,
      });
    }
  }
}
