/**
 * ArbitrageSignalScorer — Multi-factor confidence scoring for arbitrage opportunities.
 * Combines: spread quality, liquidity depth, latency risk, fee impact, historical pattern.
 * Outputs unified 0-100 confidence score to prioritize which opportunities to execute.
 *
 * Scoring weights are configurable. Higher score = higher confidence = execute first.
 */

export interface SignalFactors {
  spreadPercent: number;           // Gross spread %
  netProfitPercent: number;        // Net profit after fees %
  liquidityScore: number;          // 0-100 from OrderBookAnalyzer
  latencyMs: number;               // Combined buy+sell latency
  feeCostPercent: number;          // Total fees as % of position
  spreadZScore: number;            // From SpreadHistoryTracker (>2 = anomaly)
  fillable: boolean;               // Whether orderbook can fill the amount
  exchangeHealthy: boolean;        // Both exchanges connected and healthy
}

export interface ScoredSignal {
  factors: SignalFactors;
  scores: FactorScores;            // Individual factor scores 0-100
  totalScore: number;              // Weighted total 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';  // Letter grade
  recommendation: 'execute' | 'wait' | 'skip';
  reason: string;
}

export interface FactorScores {
  spread: number;        // 0-100
  profitability: number; // 0-100
  liquidity: number;     // 0-100
  latency: number;       // 0-100
  feeCost: number;       // 0-100
  pattern: number;       // 0-100
}

export interface ScorerWeights {
  spread: number;        // Weight for spread quality (default: 0.25)
  profitability: number; // Weight for net profit (default: 0.25)
  liquidity: number;     // Weight for liquidity depth (default: 0.20)
  latency: number;       // Weight for latency (default: 0.10)
  feeCost: number;       // Weight for fee impact (default: 0.10)
  pattern: number;       // Weight for historical pattern (default: 0.10)
}

export interface ScorerConfig {
  weights: ScorerWeights;
  executeThreshold: number;     // Min score to recommend execution (default: 70)
  waitThreshold: number;        // Min score to recommend waiting (default: 40)
  targetLatencyMs: number;      // Target latency for max score (default: 100)
  maxLatencyMs: number;         // Max acceptable latency (default: 500)
  minSpreadPercent: number;     // Min spread for any score (default: 0.05)
  maxSpreadPercent: number;     // Spread for max score (default: 1.0)
}

const DEFAULT_WEIGHTS: ScorerWeights = {
  spread: 0.25,
  profitability: 0.25,
  liquidity: 0.20,
  latency: 0.10,
  feeCost: 0.10,
  pattern: 0.10,
};

const DEFAULT_CONFIG: ScorerConfig = {
  weights: DEFAULT_WEIGHTS,
  executeThreshold: 70,
  waitThreshold: 40,
  targetLatencyMs: 100,
  maxLatencyMs: 500,
  minSpreadPercent: 0.05,
  maxSpreadPercent: 1.0,
};

export class ArbitrageSignalScorer {
  private config: ScorerConfig;
  private scoringHistory: ScoredSignal[] = [];

  constructor(config?: Partial<ScorerConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: { ...DEFAULT_WEIGHTS, ...config?.weights },
    };
  }

  /**
   * Score an arbitrage opportunity based on multiple factors.
   */
  score(factors: SignalFactors): ScoredSignal {
    // Hard disqualifiers
    if (!factors.fillable || !factors.exchangeHealthy) {
      const signal = this.disqualifiedSignal(factors);
      this.scoringHistory.push(signal);
      return signal;
    }

    // Calculate individual factor scores (0-100)
    const scores: FactorScores = {
      spread: this.scoreSpread(factors.spreadPercent),
      profitability: this.scoreProfitability(factors.netProfitPercent),
      liquidity: factors.liquidityScore,  // Already 0-100
      latency: this.scoreLatency(factors.latencyMs),
      feeCost: this.scoreFeeCost(factors.feeCostPercent),
      pattern: this.scorePattern(factors.spreadZScore),
    };

    // Weighted total
    const w = this.config.weights;
    const totalScore = Math.round(
      scores.spread * w.spread +
      scores.profitability * w.profitability +
      scores.liquidity * w.liquidity +
      scores.latency * w.latency +
      scores.feeCost * w.feeCost +
      scores.pattern * w.pattern
    );

    const grade = this.letterGrade(totalScore);
    const recommendation = this.recommend(totalScore);
    const reason = this.buildReason(scores, totalScore, grade);

    const signal: ScoredSignal = {
      factors,
      scores,
      totalScore,
      grade,
      recommendation,
      reason,
    };

    this.scoringHistory.push(signal);
    return signal;
  }

  /**
   * Score spread quality: higher spread = higher score.
   * Linear scale from minSpread (0) to maxSpread (100).
   */
  private scoreSpread(spreadPercent: number): number {
    if (spreadPercent <= this.config.minSpreadPercent) return 0;
    if (spreadPercent >= this.config.maxSpreadPercent) return 100;

    const range = this.config.maxSpreadPercent - this.config.minSpreadPercent;
    return Math.round(((spreadPercent - this.config.minSpreadPercent) / range) * 100);
  }

  /**
   * Score net profitability: higher net profit % = higher score.
   * 0% → 0, 0.5% → 100.
   */
  private scoreProfitability(netProfitPercent: number): number {
    if (netProfitPercent <= 0) return 0;
    return Math.min(100, Math.round(netProfitPercent * 200));
  }

  /**
   * Score latency: lower latency = higher score.
   * targetLatency → 100, maxLatency → 0.
   */
  private scoreLatency(latencyMs: number): number {
    if (latencyMs <= this.config.targetLatencyMs) return 100;
    if (latencyMs >= this.config.maxLatencyMs) return 0;

    const range = this.config.maxLatencyMs - this.config.targetLatencyMs;
    return Math.round(((this.config.maxLatencyMs - latencyMs) / range) * 100);
  }

  /**
   * Score fee cost: lower fees = higher score.
   * 0% → 100, 0.5% → 0.
   */
  private scoreFeeCost(feeCostPercent: number): number {
    if (feeCostPercent <= 0) return 100;
    if (feeCostPercent >= 0.5) return 0;
    return Math.round((1 - feeCostPercent / 0.5) * 100);
  }

  /**
   * Score historical pattern (z-score): higher z-score = rarer spread = better opportunity.
   * z < 0 → 0, z = 0 → 30, z = 2 → 80, z >= 3 → 100.
   */
  private scorePattern(zScore: number): number {
    if (zScore <= 0) return Math.max(0, Math.round(30 + zScore * 10));
    if (zScore >= 3) return 100;
    return Math.round(30 + (zScore / 3) * 70);
  }

  /**
   * Convert total score to letter grade.
   */
  private letterGrade(score: number): ScoredSignal['grade'] {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Generate recommendation based on score.
   */
  private recommend(score: number): ScoredSignal['recommendation'] {
    if (score >= this.config.executeThreshold) return 'execute';
    if (score >= this.config.waitThreshold) return 'wait';
    return 'skip';
  }

  /**
   * Build human-readable reason string.
   */
  private buildReason(scores: FactorScores, total: number, grade: string): string {
    const parts: string[] = [];

    if (scores.spread >= 80) parts.push('excellent spread');
    else if (scores.spread >= 50) parts.push('decent spread');
    else parts.push('thin spread');

    if (scores.latency >= 80) parts.push('fast execution');
    else if (scores.latency < 30) parts.push('high latency risk');

    if (scores.liquidity >= 70) parts.push('deep liquidity');
    else if (scores.liquidity < 30) parts.push('shallow liquidity');

    if (scores.pattern >= 80) parts.push('rare pattern (z>2)');

    return `Grade ${grade} (${total}/100): ${parts.join(', ')}`;
  }

  /**
   * Create disqualified signal for unfillable or unhealthy conditions.
   */
  private disqualifiedSignal(factors: SignalFactors): ScoredSignal {
    const reason = !factors.fillable
      ? 'Orderbook cannot fill requested amount'
      : 'Exchange(s) not healthy';

    return {
      factors,
      scores: { spread: 0, profitability: 0, liquidity: 0, latency: 0, feeCost: 0, pattern: 0 },
      totalScore: 0,
      grade: 'F',
      recommendation: 'skip',
      reason,
    };
  }

  /**
   * Get scoring history.
   */
  getHistory(): ScoredSignal[] {
    return [...this.scoringHistory];
  }

  /**
   * Get average score from history.
   */
  getAverageScore(): number {
    if (this.scoringHistory.length === 0) return 0;
    const sum = this.scoringHistory.reduce((s, sig) => s + sig.totalScore, 0);
    return sum / this.scoringHistory.length;
  }

  /**
   * Get grade distribution from history.
   */
  getGradeDistribution(): Record<string, number> {
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const sig of this.scoringHistory) {
      dist[sig.grade]++;
    }
    return dist;
  }

  /**
   * Get recommendation distribution from history.
   */
  getRecommendationDistribution(): Record<string, number> {
    const dist: Record<string, number> = { execute: 0, wait: 0, skip: 0 };
    for (const sig of this.scoringHistory) {
      dist[sig.recommendation]++;
    }
    return dist;
  }

  /**
   * Get current config.
   */
  getConfig(): ScorerConfig {
    return { ...this.config, weights: { ...this.config.weights } };
  }

  /** Clear scoring history */
  clearHistory(): void {
    this.scoringHistory = [];
  }
}
