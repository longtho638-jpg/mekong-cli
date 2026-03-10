/**
 * 孫子兵法 Binh Pháp Stealth Trading Strategy
 *
 * Maps all 13 chapters of Art of War to anti-detection trading algorithms.
 * Goal: user NEVER gets checkpoint/flagged by exchanges.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Chapter │ Principle          │ Trading Application           │
 * ├─────────┼────────────────────┼───────────────────────────────┤
 * │ 始計    │ Initial Assessment │ Profile exchange before trade │
 * │ 作戰    │ Resource Mgmt      │ API budget, token rationing   │
 * │ 謀攻    │ Win Without Fight  │ Passive monitoring first      │
 * │ 軍形    │ Defense Posture    │ Multi-layer circuit breakers  │
 * │ 兵勢    │ Momentum/Energy    │ Trade in high-volume windows  │
 * │ 虛實    │ Deception          │ Order splitting & camouflage  │
 * │ 軍爭    │ Maneuvering        │ Exchange rotation             │
 * │ 九變    │ Adaptation         │ Dynamic behavior shift        │
 * │ 行軍    │ Movement           │ Vary order routing patterns   │
 * │ 地形    │ Terrain            │ Exchange-specific profiles    │
 * │ 九地    │ Nine Grounds       │ Escalation levels             │
 * │ 火攻    │ Decisive Strike    │ Execute only high-confidence  │
 * │ 用間    │ Intelligence       │ Monitor exchange restrictions │
 * └─────────┴────────────────────┴───────────────────────────────┘
 *
 * Usage:
 *   const stealth = new BinhPhapStealthStrategy(config);
 *   const plan = stealth.planExecution('binance', 0.01, 'BTC/USDT');
 *   // plan.delay, plan.sizes[], plan.route, plan.shouldProceed
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { StealthExecutionAlgorithms, type ChildOrder } from './stealth-execution-algorithms';
import { stealthDelay, stealthSize } from './phantom-stealth-math';

// ─── EXCHANGE TERRAIN PROFILES (第十篇 地形) ─────────────────

/** Exchange-specific detection thresholds and stealth parameters */
export interface ExchangeTerrainProfile {
  id: string;
  /** Max orders per minute before flagged. Conservative estimate. */
  safeOrdersPerMin: number;
  /** Max orders per hour. */
  safeOrdersPerHour: number;
  /** Min delay between orders to same pair (ms). */
  minPairIntervalMs: number;
  /** Does exchange detect identical order sizes? */
  detectsUniformSizes: boolean;
  /** Does exchange detect rapid cancel-replace? */
  detectsCancelReplace: boolean;
  /** Known high-volume hours (UTC) when bot activity blends in. */
  highVolumeHoursUtc: number[];
  /** Rate limit tier (requests/min). */
  rateLimitPerMin: number;
  /** Risk level: conservative exchanges flag faster. */
  riskLevel: 'low' | 'medium' | 'high';
}

const TERRAIN_PROFILES: Record<string, ExchangeTerrainProfile> = {
  binance: {
    id: 'binance',
    safeOrdersPerMin: 8,
    safeOrdersPerHour: 120,
    minPairIntervalMs: 5_000,
    detectsUniformSizes: true,
    detectsCancelReplace: true,
    highVolumeHoursUtc: [0, 1, 2, 8, 9, 13, 14, 15, 16],
    rateLimitPerMin: 1200,
    riskLevel: 'high', // Binance has sophisticated detection
  },
  okx: {
    id: 'okx',
    safeOrdersPerMin: 12,
    safeOrdersPerHour: 200,
    minPairIntervalMs: 3_000,
    detectsUniformSizes: true,
    detectsCancelReplace: false,
    highVolumeHoursUtc: [1, 2, 3, 8, 9, 14, 15],
    rateLimitPerMin: 600,
    riskLevel: 'medium',
  },
  bybit: {
    id: 'bybit',
    safeOrdersPerMin: 10,
    safeOrdersPerHour: 150,
    minPairIntervalMs: 4_000,
    detectsUniformSizes: false,
    detectsCancelReplace: true,
    highVolumeHoursUtc: [0, 1, 2, 7, 8, 13, 14, 15],
    rateLimitPerMin: 600,
    riskLevel: 'medium',
  },
};

// ─── EXECUTION PLAN (第一篇 始計) ─────────────────────────────

export interface StealthExecutionPlan {
  shouldProceed: boolean;
  reason?: string;
  /** Delay before executing first chunk (ms) — randomized */
  delayMs: number;
  /** Split order into N smaller chunks */
  orderChunks: number[];
  /** Detailed child orders for execution engine */
  childOrders: ChildOrder[];
  /** Algorithm name used for execution */
  algorithm: string;
  /** Delay between chunks (ms) */
  chunkDelayMs: number;
  /** Which exchange to route to */
  preferredExchange: string;
  /** Current threat level (1=safe, 5=danger) */
  threatLevel: number;
  /** Active Binh Phap chapter being applied */
  activeChapter: string;
}

// ─── ESCALATION LEVELS (第十一篇 九地) ─────────────────────────

export type ThreatLevel = 1 | 2 | 3 | 4 | 5;

interface ThreatState {
  level: ThreatLevel;
  reasons: string[];
  lastEscalation: number;
}

// ─── CONFIG ────────────────────────────────────────────────────

export type ExecutionMode = 'split' | 'twap' | 'vwap' | 'iceberg';

export interface BinhPhapConfig {
  /** Default execution mode. Default 'split' */
  defaultExecutionMode: ExecutionMode;
  /** Order split threshold — split orders above this size. Default 0.05 */
  splitThresholdBase: number;
  /** Max chunks per split order. Default 5 */
  maxChunks: number;
  /** Base delay multiplier per threat level. Default 1.5 */
  threatDelayMultiplier: number;
  /** Volume-aware: only trade in high-volume hours? Default true */
  volumeAwareTimingEnabled: boolean;
  /** Min confidence score to execute (0-100). Default 70 */
  minConfidenceScore: number;
  /** Enable exchange rotation. Default true */
  exchangeRotationEnabled: boolean;
}

const DEFAULT_CONFIG: BinhPhapConfig = {
  defaultExecutionMode: 'split',
  splitThresholdBase: 0.05,
  maxChunks: 5,
  threatDelayMultiplier: 1.5,
  volumeAwareTimingEnabled: true,
  minConfidenceScore: 70,
  exchangeRotationEnabled: true,
};

// ─── MAIN CLASS ────────────────────────────────────────────────

export class BinhPhapStealthStrategy extends EventEmitter {
  private config: BinhPhapConfig;
  private threats = new Map<string, ThreatState>();
  private lastOrderAt = new Map<string, number>();   // exchange:pair → timestamp
  private orderCounts = new Map<string, number[]>();  // exchange → timestamps

  constructor(config?: Partial<BinhPhapConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── 始計: PRE-TRADE ASSESSMENT ─────────────────────────────

  /**
   * Plan execution with full Binh Phap assessment.
   * Returns StealthExecutionPlan with timing, sizing, routing decisions.
   */
  planExecution(
    exchange: string,
    baseSize: number,
    pair: string,
    confidenceScore: number = 80,
    options: {
      mode?: ExecutionMode;
      durationMs?: number;
      marketVolume?: number;
      icebergPrice?: number;
    } = {}
  ): StealthExecutionPlan {
    const terrain = this.getTerrain(exchange);
    const threat = this.getThreat(exchange);
    const mode = options.mode ?? this.config.defaultExecutionMode;

    // 火攻: Only execute high-confidence opportunities
    if (confidenceScore < this.config.minConfidenceScore) {
      return this.blockPlan(`Confidence ${confidenceScore} < min ${this.config.minConfidenceScore}`, threat.level);
    }

    // 軍形: Check circuit breaker state
    if (threat.level >= 5) {
      return this.blockPlan('Threat level 5 — full retreat', 5);
    }

    // 行軍: Check pair interval
    const pairKey = `${exchange}:${pair}`;
    const lastOrder = this.lastOrderAt.get(pairKey) ?? 0;
    const elapsed = Date.now() - lastOrder;
    if (elapsed < terrain.minPairIntervalMs) {
      return this.blockPlan(`Pair cooldown: ${Math.round((terrain.minPairIntervalMs - elapsed) / 1000)}s remaining`, threat.level);
    }

    // 作戰: Check rate budget
    if (!this.hasRateBudget(exchange, terrain)) {
      return this.blockPlan('Rate budget exhausted', threat.level);
    }

    // 兵勢: Volume-aware timing
    if (this.config.volumeAwareTimingEnabled && !this.isHighVolumeWindow(terrain)) {
      // Lower threat = can still trade outside volume windows, higher = must wait
      if (threat.level >= 3) {
        return this.blockPlan('Not in high-volume window (threat >= 3)', threat.level);
      }
    }

    // 虛實: Execution Strategy based on mode
    let planResult: { totalAmount: number; childOrders: ChildOrder[]; algorithm: string };

    switch (mode) {
      case 'twap':
        planResult = StealthExecutionAlgorithms.createTwapPlan(
          baseSize,
          options.durationMs ?? 600_000, // Default 10 mins
          this.config.maxChunks
        );
        break;
      case 'vwap':
        planResult = StealthExecutionAlgorithms.createVwapPlan(
          baseSize,
          options.marketVolume ?? baseSize * 20, // Estimate if missing
          0.05 // 5% target
        );
        break;
      case 'iceberg':
        planResult = StealthExecutionAlgorithms.createIcebergPlan(
          baseSize,
          baseSize / this.config.maxChunks,
          options.icebergPrice ?? 0 // Must be provided by strategy
        );
        break;
      case 'split':
      default:
        const chunks = this.splitOrder(baseSize, terrain);
        planResult = {
          totalAmount: baseSize,
          algorithm: 'Basic-Split',
          childOrders: chunks.map(c => ({ amount: c, delayMs: 2000, type: 'market' as const }))
        };
        break;
    }

    // Apply Anti-Pattern Camouflage (九變: Adaptation)
    planResult = StealthExecutionAlgorithms.applyAntiPatternCamouflage(planResult);

    const chunks = planResult.childOrders.map(o => o.amount);

    // 九變: Adapt base delay based on threat level
    const baseDelay = terrain.minPairIntervalMs;
    const threatMultiplier = Math.pow(this.config.threatDelayMultiplier, threat.level - 1);
    const delayMs = this.addJitter(Math.round(baseDelay * threatMultiplier));
    const chunkDelayMs = planResult.childOrders[0]?.delayMs ?? 2000;

    // 軍爭: Exchange rotation
    const preferredExchange = this.config.exchangeRotationEnabled
      ? this.rotateExchange(exchange)
      : exchange;

    const activeChapter = this.getActiveChapter(threat.level);

    return {
      shouldProceed: true,
      delayMs,
      orderChunks: chunks,
      childOrders: planResult.childOrders,
      algorithm: planResult.algorithm,
      chunkDelayMs,
      preferredExchange,
      threatLevel: threat.level,
      activeChapter,
    };
  }

  // ─── 虛實: ORDER CAMOUFLAGE ─────────────────────────────────

  /** Split a single order into randomized chunks that don't look uniform */
  private splitOrder(baseSize: number, _terrain: ExchangeTerrainProfile): number[] {
    if (baseSize <= this.config.splitThresholdBase) {
      // Small order — just randomize size
      return [this.addSizeJitter(baseSize)];
    }

    // Split into 2-5 chunks with random distribution
    const numChunks = Math.min(
      this.config.maxChunks,
      2 + Math.floor(Math.random() * 3), // 2-4 chunks
    );

    const chunks: number[] = [];
    let remaining = baseSize;

    for (let i = 0; i < numChunks - 1; i++) {
      // Random portion between 15-40% of remaining
      const portion = 0.15 + Math.random() * 0.25;
      const chunk = this.addSizeJitter(remaining * portion);
      chunks.push(chunk);
      remaining -= chunk;
    }
    // Last chunk gets remainder (with jitter)
    chunks.push(this.addSizeJitter(remaining));

    // Shuffle chunks so largest isn't always first/last
    for (let i = chunks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
    }

    return chunks;
  }

  // ─── 九變: THREAT ADAPTATION ────────────────────────────────

  /** Escalate threat level for an exchange */
  escalateThreat(exchange: string, reason: string): void {
    const threat = this.getThreat(exchange);
    if (threat.level < 5) {
      (threat.level as number)++;
      threat.reasons.push(`[${new Date().toISOString()}] ${reason}`);
      threat.lastEscalation = Date.now();
      logger.warn(`[BinhPhap] ${exchange} threat: ${threat.level - 1} → ${threat.level}: ${reason}`);
      this.emit('threat:escalated', { exchange, level: threat.level, reason });
    }
  }

  /** De-escalate after period of safe operation */
  deescalateThreat(exchange: string): void {
    const threat = this.getThreat(exchange);
    if (threat.level > 1) {
      (threat.level as number)--;
      logger.info(`[BinhPhap] ${exchange} threat de-escalated: → ${threat.level}`);
      this.emit('threat:deescalated', { exchange, level: threat.level });
    }
  }

  /** Auto-deescalate after safe period (call periodically) */
  autoDeescalate(exchange: string, safeMinutes: number = 30): void {
    const threat = this.getThreat(exchange);
    const elapsed = Date.now() - threat.lastEscalation;
    if (elapsed > safeMinutes * 60_000 && threat.level > 1) {
      this.deescalateThreat(exchange);
    }
  }

  // ─── 兵勢: VOLUME-AWARE TIMING ─────────────────────────────

  /** Check if current hour is a high-volume window for this exchange */
  private isHighVolumeWindow(terrain: ExchangeTerrainProfile): boolean {
    const utcHour = new Date().getUTCHours();
    return terrain.highVolumeHoursUtc.includes(utcHour);
  }

  // ─── 軍爭: EXCHANGE ROTATION ────────────────────────────────

  /** Rotate between exchanges to spread activity footprint.
   *  Picks the exchange with lowest threat + most rate budget remaining. */
  private rotateExchange(preferred: string): string {
    const available = Object.keys(TERRAIN_PROFILES);
    if (available.length <= 1) return preferred;

    // Score each exchange: lower threat + more rate budget = better
    let bestExchange = preferred;
    let bestScore = -Infinity;
    for (const ex of available) {
      const threat = this.getThreat(ex);
      const counts = this.orderCounts.get(ex) ?? [];
      const hourAgo = Date.now() - 3_600_000;
      const recentOrders = counts.filter(t => t > hourAgo).length;
      const terrain = this.getTerrain(ex);
      const budgetRemaining = terrain.safeOrdersPerHour - recentOrders;
      // Score: higher budget remaining, lower threat = better
      const score = budgetRemaining - (threat.level * 30);
      if (score > bestScore) {
        bestScore = score;
        bestExchange = ex;
      }
    }
    return bestExchange;
  }

  // ─── 地形: TERRAIN LOOKUP ───────────────────────────────────

  /** Get terrain profile for an exchange (defaults to conservative) */
  getTerrain(exchange: string): ExchangeTerrainProfile {
    return TERRAIN_PROFILES[exchange.toLowerCase()] ?? {
      id: exchange,
      safeOrdersPerMin: 5,
      safeOrdersPerHour: 60,
      minPairIntervalMs: 8_000,
      detectsUniformSizes: true,
      detectsCancelReplace: true,
      highVolumeHoursUtc: [0, 1, 8, 14, 15],
      rateLimitPerMin: 300,
      riskLevel: 'high' as const,
    };
  }

  // ─── 用間: RECORD & INTELLIGENCE ────────────────────────────

  /** Record an executed order (for rate tracking and pattern analysis) */
  recordExecution(exchange: string, pair: string): void {
    this.lastOrderAt.set(`${exchange}:${pair}`, Date.now());

    const counts = this.orderCounts.get(exchange) ?? [];
    counts.push(Date.now());
    this.orderCounts.set(exchange, counts);
  }

  /** Get status summary for all exchanges */
  getIntelligence(): Record<string, {
    threat: ThreatState;
    terrain: ExchangeTerrainProfile;
    recentOrders: number;
    isHighVolume: boolean;
  }> {
    const result: Record<string, ReturnType<BinhPhapStealthStrategy['getIntelligence']>[string]> = {};
    for (const [id, terrain] of Object.entries(TERRAIN_PROFILES)) {
      const counts = this.orderCounts.get(id) ?? [];
      const hourAgo = Date.now() - 3_600_000;
      result[id] = {
        threat: this.getThreat(id),
        terrain,
        recentOrders: counts.filter(t => t > hourAgo).length,
        isHighVolume: this.isHighVolumeWindow(terrain),
      };
    }
    return result;
  }

  // ─── HELPERS ────────────────────────────────────────────────

  private getThreat(exchange: string): ThreatState {
    let threat = this.threats.get(exchange);
    if (!threat) {
      threat = { level: 1 as ThreatLevel, reasons: [], lastEscalation: Date.now() };
      this.threats.set(exchange, threat);
    }
    return threat;
  }

  private hasRateBudget(exchange: string, terrain: ExchangeTerrainProfile): boolean {
    const counts = this.orderCounts.get(exchange) ?? [];
    const now = Date.now();
    const minuteAgo = now - 60_000;
    const hourAgo = now - 3_600_000;

    const perMinute = counts.filter(t => t > minuteAgo).length;
    const perHour = counts.filter(t => t > hourAgo).length;

    return perMinute < terrain.safeOrdersPerMin && perHour < terrain.safeOrdersPerHour;
  }

  private addJitter(baseMs: number): number {
    // Poisson-based timing via stealthDelay (exponential inter-arrival)
    // Replaces uniform 0.7-1.3 jitter that exchanges detect via autocorrelation
    return stealthDelay(60_000 / baseMs, 500, baseMs * 3);
  }

  private addSizeJitter(size: number): number {
    // Log-normal distribution + round number avoidance
    // Replaces uniform ±5% that creates detectable flat histogram
    return stealthSize(size, 0.25, 8);
  }

  private blockPlan(reason: string, threatLevel: number): StealthExecutionPlan {
    return {
      shouldProceed: false,
      reason,
      delayMs: 0,
      orderChunks: [],
      childOrders: [],
      algorithm: 'Blocked',
      chunkDelayMs: 0,
      preferredExchange: '',
      threatLevel,
      activeChapter: '軍形 (Defense)',
    };
  }

  private getActiveChapter(threatLevel: ThreatLevel): string {
    switch (threatLevel) {
      case 1: return '兵勢 (Momentum) — Normal flow';
      case 2: return '謀攻 (Stratagem) — Cautious';
      case 3: return '虛實 (Deception) — Camouflage active';
      case 4: return '九變 (Adaptation) — Evasive patterns';
      case 5: return '軍形 (Defense) — Full retreat';
    }
  }
}
