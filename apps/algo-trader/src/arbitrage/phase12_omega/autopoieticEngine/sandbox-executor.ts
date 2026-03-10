/**
 * Phase 12 Omega — Autopoietic Code Evolution.
 * Module: SandboxExecutor
 *
 * Simulates running code in an isolated sandbox against historical market data.
 * Compares PnL, latency, and risk metrics between old and new code versions.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  spread: number;
}

export interface ExecutionMetrics {
  pnl: number;
  avgLatencyMs: number;
  riskScore: number;
  tradeCount: number;
  winRate: number;
  maxDrawdown: number;
}

export interface SandboxComparisonResult {
  oldVersion: ExecutionMetrics;
  newVersion: ExecutionMetrics;
  pnlDelta: number;
  latencyDelta: number;
  riskDelta: number;
  newVersionWins: boolean;
  runAt: number;
}

export interface SandboxExecutorConfig {
  /** Number of historical data points to simulate. Default: 100 */
  dataPointCount: number;
  /** Base PnL per trade in USD. Default: 1.5 */
  basePnlPerTrade: number;
  /** Base latency in ms. Default: 50 */
  baseLatencyMs: number;
  /** Base risk score (0–1). Default: 0.4 */
  baseRiskScore: number;
  /** Seed for deterministic simulation. Default: 42 */
  seed: number;
}

const DEFAULT_CONFIG: SandboxExecutorConfig = {
  dataPointCount: 100,
  basePnlPerTrade: 1.5,
  baseLatencyMs: 50,
  baseRiskScore: 0.4,
  seed: 42,
};

// ── Deterministic pseudo-random ───────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Historical data generation ────────────────────────────────────────────────

function generateHistoricalData(count: number, rand: () => number): HistoricalDataPoint[] {
  let price = 10000;
  return Array.from({ length: count }, (_, i) => {
    price = price * (1 + (rand() - 0.5) * 0.02);
    return {
      timestamp: Date.now() - (count - i) * 1000,
      price: Math.max(price, 1),
      volume: 0.1 + rand() * 2,
      spread: 0.5 + rand() * 2,
    };
  });
}

// ── Metric simulation ─────────────────────────────────────────────────────────

function simulateExecution(
  _code: string,
  data: HistoricalDataPoint[],
  cfg: SandboxExecutorConfig,
  rand: () => number,
  complexityModifier: number,
): ExecutionMetrics {
  let pnl = 0;
  let wins = 0;
  const latencies: number[] = [];

  for (const point of data) {
    // Simulate trade decision based on spread threshold
    if (point.spread > 1.0) {
      const tradePnl = cfg.basePnlPerTrade * (1 + (rand() - 0.3)) * (1 - complexityModifier * 0.05);
      pnl += tradePnl;
      latencies.push(cfg.baseLatencyMs * (1 + rand() * 0.5) * (1 + complexityModifier * 0.1));
      if (tradePnl > 0) wins++;
    }
  }

  const tradeCount = latencies.length;
  const avgLatencyMs =
    tradeCount > 0 ? latencies.reduce((s, l) => s + l, 0) / tradeCount : cfg.baseLatencyMs;

  // Risk score: higher complexity and lower win rate → higher risk
  const winRate = tradeCount > 0 ? wins / tradeCount : 0;
  const riskScore = Math.min(
    1,
    cfg.baseRiskScore + complexityModifier * 0.05 + (1 - winRate) * 0.2,
  );

  // Max drawdown simulation
  let peak = 0;
  let runningPnl = 0;
  let maxDrawdown = 0;
  for (const point of data) {
    if (point.spread > 1.0) {
      runningPnl += cfg.basePnlPerTrade * (rand() - 0.3);
      if (runningPnl > peak) peak = runningPnl;
      const dd = peak - runningPnl;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }
  }

  return {
    pnl: Math.round(pnl * 100) / 100,
    avgLatencyMs: Math.round(avgLatencyMs * 10) / 10,
    riskScore: Math.round(riskScore * 1000) / 1000,
    tradeCount,
    winRate: Math.round(winRate * 1000) / 1000,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
  };
}

// ── SandboxExecutor class ─────────────────────────────────────────────────────

export class SandboxExecutor {
  private readonly config: SandboxExecutorConfig;

  constructor(config: Partial<SandboxExecutorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run both code versions against simulated historical data.
   * `complexityDelta` from the generator adjusts new-version modifiers.
   */
  compare(
    oldCode: string,
    newCode: string,
    complexityDelta: number = 0,
  ): SandboxComparisonResult {
    const rand = seededRandom(this.config.seed);
    const data = generateHistoricalData(this.config.dataPointCount, rand);

    // Old version: baseline complexity modifier = 1
    const oldMetrics = simulateExecution(oldCode, data, this.config, seededRandom(this.config.seed), 1);

    // New version: reduced complexity modifier from delta (negative delta = better)
    const newModifier = Math.max(0, 1 + complexityDelta * 0.1);
    const newMetrics = simulateExecution(newCode, data, this.config, seededRandom(this.config.seed + 1), newModifier);

    const pnlDelta = newMetrics.pnl - oldMetrics.pnl;
    const latencyDelta = newMetrics.avgLatencyMs - oldMetrics.avgLatencyMs;
    const riskDelta = newMetrics.riskScore - oldMetrics.riskScore;

    // New version wins if PnL improves AND latency drops AND risk decreases
    const newVersionWins =
      pnlDelta > 0 && latencyDelta < 0 && riskDelta < 0;

    return {
      oldVersion: oldMetrics,
      newVersion: newMetrics,
      pnlDelta: Math.round(pnlDelta * 100) / 100,
      latencyDelta: Math.round(latencyDelta * 10) / 10,
      riskDelta: Math.round(riskDelta * 1000) / 1000,
      newVersionWins,
      runAt: Date.now(),
    };
  }

  /** Generate deterministic test data for external use. */
  generateTestData(): HistoricalDataPoint[] {
    return generateHistoricalData(this.config.dataPointCount, seededRandom(this.config.seed));
  }
}
