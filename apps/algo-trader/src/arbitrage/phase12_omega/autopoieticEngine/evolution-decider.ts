/**
 * Phase 12 Omega — Autopoietic Code Evolution.
 * Module: EvolutionDecider
 *
 * Evaluates sandbox comparison results and decides whether to approve
 * or discard a code evolution candidate. Approval requires the new version
 * to outperform on ALL three key metrics: pnl, latency, and riskScore.
 */

import type { SandboxComparisonResult } from './sandbox-executor';

// ── Types ────────────────────────────────────────────────────────────────────

export type EvolutionDecision = 'approved' | 'discarded';

export interface DecisionReason {
  metric: 'pnl' | 'latency' | 'riskScore';
  passed: boolean;
  detail: string;
}

export interface EvolutionDecisionResult {
  decision: EvolutionDecision;
  reasons: DecisionReason[];
  confidence: number;
  decidedAt: number;
}

export interface EvolutionDeciderConfig {
  /**
   * Minimum PnL improvement required (absolute USD). Default: 0 (any positive).
   */
  minPnlImprovement: number;
  /**
   * Maximum allowed latency increase in ms (negative = must decrease). Default: 0.
   */
  maxLatencyIncrease: number;
  /**
   * Maximum allowed risk score increase (negative = must decrease). Default: 0.
   */
  maxRiskIncrease: number;
  /** Emit structured log entries. Default: true */
  enableLogging: boolean;
}

const DEFAULT_CONFIG: EvolutionDeciderConfig = {
  minPnlImprovement: 0,
  maxLatencyIncrease: 0,
  maxRiskIncrease: 0,
  enableLogging: true,
};

// ── Logger ────────────────────────────────────────────────────────────────────

export interface DecisionLogEntry {
  level: 'info' | 'warn';
  message: string;
  timestamp: number;
  decision: EvolutionDecision;
}

// ── EvolutionDecider class ───────────────────────────────────────────────────

export class EvolutionDecider {
  private readonly config: EvolutionDeciderConfig;
  private readonly log: DecisionLogEntry[] = [];

  constructor(config: Partial<EvolutionDeciderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate a sandbox comparison and return a structured decision.
   * Approves only when ALL key metrics pass their thresholds.
   */
  decide(comparison: SandboxComparisonResult): EvolutionDecisionResult {
    const reasons: DecisionReason[] = [];

    // PnL check
    const pnlPassed = comparison.pnlDelta > this.config.minPnlImprovement;
    reasons.push({
      metric: 'pnl',
      passed: pnlPassed,
      detail: `PnL delta ${comparison.pnlDelta >= 0 ? '+' : ''}${comparison.pnlDelta.toFixed(2)} USD (threshold: >${this.config.minPnlImprovement})`,
    });

    // Latency check (negative delta = faster = better)
    const latencyPassed = comparison.latencyDelta <= this.config.maxLatencyIncrease;
    reasons.push({
      metric: 'latency',
      passed: latencyPassed,
      detail: `Latency delta ${comparison.latencyDelta >= 0 ? '+' : ''}${comparison.latencyDelta.toFixed(1)} ms (threshold: <=${this.config.maxLatencyIncrease})`,
    });

    // Risk check (negative delta = safer = better)
    const riskPassed = comparison.riskDelta <= this.config.maxRiskIncrease;
    reasons.push({
      metric: 'riskScore',
      passed: riskPassed,
      detail: `Risk delta ${comparison.riskDelta >= 0 ? '+' : ''}${comparison.riskDelta.toFixed(4)} (threshold: <=${this.config.maxRiskIncrease})`,
    });

    const allPassed = reasons.every((r) => r.passed);
    const decision: EvolutionDecision = allPassed ? 'approved' : 'discarded';

    // Confidence: fraction of metrics that passed
    const passedCount = reasons.filter((r) => r.passed).length;
    const confidence = Math.round((passedCount / reasons.length) * 100) / 100;

    const result: EvolutionDecisionResult = {
      decision,
      reasons,
      confidence,
      decidedAt: Date.now(),
    };

    if (this.config.enableLogging) {
      this.emitLog(result);
    }

    return result;
  }

  /** Return all logged decisions. */
  getLog(): DecisionLogEntry[] {
    return [...this.log];
  }

  /** Clear decision log. */
  clearLog(): void {
    this.log.length = 0;
  }

  private emitLog(result: EvolutionDecisionResult): void {
    const failedMetrics = result.reasons
      .filter((r) => !r.passed)
      .map((r) => r.metric)
      .join(', ');

    const message =
      result.decision === 'approved'
        ? `Evolution APPROVED — all metrics passed (confidence: ${result.confidence})`
        : `Evolution DISCARDED — failed metrics: [${failedMetrics}] (confidence: ${result.confidence})`;

    this.log.push({
      level: result.decision === 'approved' ? 'info' : 'warn',
      message,
      timestamp: result.decidedAt,
      decision: result.decision,
    });
  }
}
