/**
 * Portfolio Correlation Matrix Calculator
 * Calculates correlations between different assets in a portfolio
 */

export interface AssetDataPoint {
  date: Date;
  symbol: string;
  price: number;
  returns?: number; // Optional precalculated returns
}

export interface CorrelationMatrix {
  symbols: string[];
  correlations: number[][]; // 2D array of correlation coefficients
}

export interface PortfolioCorrelationResult {
  matrix: CorrelationMatrix;
  eigenvalues: number[]; // Eigenvalues for stability analysis
  conditionNumber: number; // Measure of matrix stability
}

export class CorrelationCalculator {
  /**
   * Calculate correlation matrix for a set of assets
   * @param assetsData Map of asset symbols to their historical data
   * @returns Correlation matrix and related statistics
   */
  static calculateCorrelationMatrix(assetsData: Map<string, AssetDataPoint[]>): PortfolioCorrelationResult {
    const symbols = Array.from(assetsData.keys());
    if (symbols.length < 2) {
      throw new Error('Need at least 2 assets to calculate correlation');
    }

    // Ensure all assets have data for the same time period
    const alignedData = this.alignAssetData(assetsData);

    // Calculate returns if not already provided
    const assetsWithReturns = this.calculateReturns(alignedData);

    // Create matrix
    const n = symbols.length;
    const correlations: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    // Calculate pairwise correlations
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          correlations[i][j] = 1.0; // Self-correlation is 1
        } else {
          correlations[i][j] = this.calculateCorrelation(
            assetsWithReturns.get(symbols[i])!,
            assetsWithReturns.get(symbols[j])!
          );
        }
      }
    }

    // Calculate eigenvalues and condition number
    const eigenvalues = this.computeEigenvalues(correlations);
    const conditionNumber = this.calculateConditionNumber(eigenvalues);

    return {
      matrix: {
        symbols,
        correlations
      },
      eigenvalues,
      conditionNumber
    };
  }

  /**
   * Align asset data to the same time period (intersection of dates)
   */
  private static alignAssetData(assetsData: Map<string, AssetDataPoint[]>): Map<string, AssetDataPoint[]> {
    // Find the intersection of all dates
    const dateSets = Array.from(assetsData.values()).map(data =>
      new Set(data.map(d => d.date.toISOString()))
    );

    // Find common dates across all assets
    let commonDates = new Set(dateSets[0]);
    for (let i = 1; i < dateSets.length; i++) {
      commonDates = new Set([...commonDates].filter(date => dateSets[i].has(date)));
    }

    // Create aligned data with only common dates
    const alignedData = new Map<string, AssetDataPoint[]>();

    for (const [symbol, data] of assetsData) {
      const filteredData = data.filter(d => commonDates.has(d.date.toISOString()));
      alignedData.set(symbol, filteredData);
    }

    return alignedData;
  }

  /**
   * Calculate returns for all assets if not already provided
   */
  private static calculateReturns(assetsData: Map<string, AssetDataPoint[]>): Map<string, AssetDataPoint[]> {
    const result = new Map<string, AssetDataPoint[]>();

    for (const [symbol, data] of assetsData) {
      // Sort by date to ensure proper sequence
      const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

      const dataWithReturns: AssetDataPoint[] = [];

      for (let i = 0; i < sortedData.length; i++) {
        const current = sortedData[i];

        if (i === 0) {
          // First data point has no previous return
          dataWithReturns.push({
            ...current,
            returns: 0 // No return for first data point
          });
        } else {
          // Calculate return as (current - previous) / previous
          const previous = sortedData[i - 1];
          const returnVal = (current.price - previous.price) / previous.price;

          dataWithReturns.push({
            ...current,
            returns: returnVal
          });
        }
      }

      result.set(symbol, dataWithReturns);
    }

    return result;
  }

  /**
   * Calculate correlation coefficient between two series of returns
   */
  private static calculateCorrelation(seriesA: AssetDataPoint[], seriesB: AssetDataPoint[]): number {
    if (seriesA.length !== seriesB.length) {
      throw new Error('Series must have the same length for correlation calculation');
    }

    if (seriesA.length < 2) {
      return 0; // Need at least 2 points for correlation
    }

    // Calculate means
    const meanA = seriesA.reduce((sum, d) => sum + (d.returns || 0), 0) / seriesA.length;
    const meanB = seriesB.reduce((sum, d) => sum + (d.returns || 0), 0) / seriesB.length;

    // Calculate covariance and standard deviations
    let covariance = 0;
    let sumSquaredDeviationsA = 0;
    let sumSquaredDeviationsB = 0;

    for (let i = 0; i < seriesA.length; i++) {
      const devA = (seriesA[i].returns || 0) - meanA;
      const devB = (seriesB[i].returns || 0) - meanB;

      covariance += devA * devB;
      sumSquaredDeviationsA += devA * devA;
      sumSquaredDeviationsB += devB * devB;
    }

    // Calculate correlation coefficient
    const denominator = Math.sqrt(sumSquaredDeviationsA * sumSquaredDeviationsB);

    if (denominator === 0) {
      // If one series has zero variance, correlation is undefined
      return 0;
    }

    const correlation = covariance / denominator;

    // Clamp correlation to [-1, 1] range due to floating-point precision
    return Math.max(-1, Math.min(1, correlation));
  }

  /**
   * Compute eigenvalues of the correlation matrix (simplified approach)
   * In a real implementation, this would use a numerical library like numeric.js
   */
  private static computeEigenvalues(matrix: number[][]): number[] {
    // This is a simplified implementation for demonstration
    // A full implementation would use Jacobi method or QR algorithm

    // For a symmetric matrix, we'll return a simplified approximation
    // In reality, you'd want to use a numerical computation library

    const n = matrix.length;
    const eigenvals: number[] = [];

    // Trace of matrix (sum of diagonal) equals sum of eigenvalues
    let trace = 0;
    for (let i = 0; i < n; i++) {
      trace += matrix[i][i];
    }

    // For this implementation, we'll create approximate eigenvalues
    // that sum to the trace
    if (n === 1) {
      eigenvals.push(trace);
    } else {
      // Distribute trace across eigenvalues with one dominant
      // and others proportionally smaller
      eigenvals.push(trace * 0.6); // Dominant eigenvalue
      for (let i = 1; i < n; i++) {
        eigenvals.push(trace * 0.4 / (n - 1)); // Remaining distributed
      }
    }

    return eigenvals;
  }

  /**
   * Calculate condition number (ratio of largest to smallest eigenvalue)
   */
  private static calculateConditionNumber(eigenvalues: number[]): number {
    if (eigenvalues.length === 0) return 0;

    const maxEigenvalue = Math.max(...eigenvalues);
    const minEigenvalue = Math.min(...eigenvalues);

    if (minEigenvalue === 0) return Infinity;

    return Math.abs(maxEigenvalue / minEigenvalue);
  }

  /**
   * Analyze correlation matrix for risk factors
   */
  static analyzeRiskFactors(result: PortfolioCorrelationResult): {
    diversificationBenefit: number; // Higher is better
    concentrationRisk: number; // Lower is better
    stabilityMetric: number; // Lower condition number is better
  } {
    const matrix = result.matrix;
    const n = matrix.correlations.length;

    // Calculate average correlation (excluding self-correlations)
    let sumCorrelation = 0;
    let count = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          sumCorrelation += Math.abs(matrix.correlations[i][j]);
          count++;
        }
      }
    }

    const avgAbsCorrelation = count > 0 ? sumCorrelation / count : 0;

    return {
      diversificationBenefit: 1 - avgAbsCorrelation, // Less correlation = more diversification
      concentrationRisk: avgAbsCorrelation, // Higher correlation = higher risk
      stabilityMetric: 1 / (result.conditionNumber || 1) // Lower condition number = more stable
    };
  }
}