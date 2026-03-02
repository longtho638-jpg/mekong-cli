/**
 * Pearson correlation matrix for detecting correlated portfolio positions.
 * High correlation indicates concentrated risk across "different" positions.
 */

export interface CorrelationInput {
  positions: Array<{
    symbol: string;
    returns: number[]; // Daily return series for this position
  }>;
}

export interface CorrelationResult {
  matrix: Record<string, Record<string, number>>; // symbol → symbol → correlation
  highCorrelationPairs: Array<{
    symbolA: string;
    symbolB: string;
    correlation: number;
  }>;
}

export class PortfolioCorrelationMatrixCalculator {
  private readonly threshold: number;

  constructor(threshold = 0.85) {
    this.threshold = threshold;
  }

  /**
   * Compute Pearson correlation for all position pairs and flag pairs above threshold.
   */
  calculate(input: CorrelationInput): CorrelationResult {
    const { positions } = input;
    const matrix: Record<string, Record<string, number>> = {};
    const highCorrelationPairs: CorrelationResult['highCorrelationPairs'] = [];

    for (const pos of positions) {
      matrix[pos.symbol] = {};
    }

    for (let i = 0; i < positions.length; i++) {
      const a = positions[i];
      matrix[a.symbol][a.symbol] = 1;

      for (let j = i + 1; j < positions.length; j++) {
        const b = positions[j];
        const corr = this.pearson(a.returns, b.returns);
        matrix[a.symbol][b.symbol] = corr;
        matrix[b.symbol][a.symbol] = corr;

        if (Math.abs(corr) > this.threshold) {
          highCorrelationPairs.push({ symbolA: a.symbol, symbolB: b.symbol, correlation: corr });
        }
      }
    }

    return { matrix, highCorrelationPairs };
  }

  /** Pearson correlation coefficient: cov(X,Y) / (std(X) * std(Y)). */
  private pearson(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    if (len === 0) return 0;

    const ax = a.slice(0, len);
    const bx = b.slice(0, len);

    const meanA = ax.reduce((s, v) => s + v, 0) / len;
    const meanB = bx.reduce((s, v) => s + v, 0) / len;

    let cov = 0, varA = 0, varB = 0;
    for (let i = 0; i < len; i++) {
      const da = ax[i] - meanA;
      const db = bx[i] - meanB;
      cov += da * db;
      varA += da * da;
      varB += db * db;
    }

    const denom = Math.sqrt(varA * varB);
    return denom === 0 ? 0 : cov / denom;
  }
}
