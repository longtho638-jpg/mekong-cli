/**
 * Phantom Order Cloaking Engine — The Invisible Cloak
 *
 * Master stealth orchestrator that wraps ALL order activity to make
 * algo trading indistinguishable from human trading. Coordinates:
 *
 * 1. SESSION SIMULATOR — Human-like active/break cycles (20-90min on, 5-20min off)
 * 2. OTR TRACKER — Order-to-Trade ratio monitoring (flag if >20:1)
 * 3. ADAPTIVE RATE — Dynamic 50-75% of exchange limit based on response patterns
 * 4. TIMING ENGINE — Poisson inter-arrival times (not uniform jitter)
 * 5. SIZE ENGINE — Log-normal distribution + round number avoidance
 *
 * Usage:
 *   const phantom = new PhantomCloakingEngine(config);
 *   const decision = phantom.cloak('binance', 0.01, 'BTC/USDT');
 *   if (decision.proceed) {
 *     await sleep(decision.delayMs);
 *     execute(decision.size);
 *   }
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { stealthDelay, stealthSize } from './phantom-stealth-math';

// ─── INTERFACES ──────────────────────────────────────────────

export interface PhantomConfig {
  /** Orders per minute target (used for Poisson lambda). Default 4 */
  targetOrdersPerMin: number;
  /** Min session duration (ms). Default 20min */
  minSessionMs: number;
  /** Max session duration (ms). Default 90min */
  maxSessionMs: number;
  /** Min break duration (ms). Default 5min */
  minBreakMs: number;
  /** Max break duration (ms). Default 20min */
  maxBreakMs: number;
  /** OTR threshold — cancel ratio that triggers throttle. Default 15 */
  otrThreshold: number;
  /** Adaptive rate: min % of exchange limit to use. Default 0.40 */
  adaptiveRateFloor: number;
  /** Adaptive rate: max % of exchange limit to use. Default 0.65 */
  adaptiveRateCeiling: number;
  /** Log-normal sigma for order sizing. Default 0.25 */
  sizeSigma: number;
  /** Amount precision (decimals). Default 8 */
  sizePrecision: number;
}

export interface CloakDecision {
  proceed: boolean;
  reason?: string;
  /** Stealth-timed delay before executing (ms) */
  delayMs: number;
  /** Stealth-sized order amount */
  size: number;
  /** Current session state */
  sessionActive: boolean;
  /** Current OTR for this exchange */
  otr: number;
  /** Effective rate limit being used (% of exchange max) */
  adaptiveRatePct: number;
}

interface SessionState {
  startMs: number;
  durationMs: number;
  breakUntilMs: number;
  ordersThisSession: number;
}

interface OtrState {
  ordersPlaced: number;
  ordersFilled: number;
  ordersCancelled: number;
}

interface AdaptiveRateState {
  /** Current rate multiplier (0.40 - 0.65) */
  currentPct: number;
  /** Consecutive clean responses (no 429) */
  cleanStreak: number;
  /** Recent 429/warning count */
  warningCount: number;
}

const DEFAULT_CONFIG: PhantomConfig = {
  targetOrdersPerMin: 4,
  minSessionMs: 20 * 60_000,
  maxSessionMs: 90 * 60_000,
  minBreakMs: 5 * 60_000,
  maxBreakMs: 20 * 60_000,
  otrThreshold: 15,
  adaptiveRateFloor: 0.40,
  adaptiveRateCeiling: 0.65,
  sizeSigma: 0.25,
  sizePrecision: 8,
};

// ─── MAIN CLASS ──────────────────────────────────────────────

export class PhantomCloakingEngine extends EventEmitter {
  private config: PhantomConfig;
  private session: SessionState;
  private otr = new Map<string, OtrState>(); // per exchange
  private adaptiveRate = new Map<string, AdaptiveRateState>(); // per exchange

  constructor(config?: Partial<PhantomConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.session = this.newSession();
  }

  /**
   * Main entry point — decide whether and how to execute an order.
   * Returns timing, sizing, and proceed/block decision.
   */
  cloak(exchange: string, baseSize: number, _pair: string): CloakDecision {
    // 1. Session check
    if (!this.isSessionActive()) {
      return this.block('Session break — human rest simulation', exchange);
    }

    // 2. OTR check
    const otr = this.getOtr(exchange);
    const otrRatio = otr.ordersPlaced > 0
      ? otr.ordersCancelled / otr.ordersPlaced
      : 0;
    if (otrRatio > this.config.otrThreshold / 100) {
      logger.warn(`[Phantom] OTR ${(otrRatio * 100).toFixed(1)}% > threshold ${this.config.otrThreshold}% on ${exchange}`);
      return this.block(`OTR too high: ${(otrRatio * 100).toFixed(1)}%`, exchange);
    }

    // 3. Adaptive rate check (dynamic budget based on exchange response)
    const rate = this.getAdaptiveRate(exchange);

    // 4. Generate stealth timing (Poisson process)
    const effectiveRate = this.config.targetOrdersPerMin * rate.currentPct;
    const delayMs = stealthDelay(effectiveRate, 500, 120_000);

    // 5. Generate stealth sizing (log-normal + round number avoidance)
    const size = stealthSize(baseSize, this.config.sizeSigma, this.config.sizePrecision);

    this.session.ordersThisSession++;

    return {
      proceed: true,
      delayMs,
      size,
      sessionActive: true,
      otr: otrRatio,
      adaptiveRatePct: rate.currentPct,
    };
  }

  // ─── SESSION SIMULATOR ─────────────────────────────────────

  private isSessionActive(): boolean {
    const now = Date.now();

    // Still on break?
    if (now < this.session.breakUntilMs) return false;

    // Session expired? Start break.
    if (now - this.session.startMs > this.session.durationMs) {
      this.startBreak();
      return false;
    }

    // Re-init if returning from break
    if (this.session.startMs === 0) {
      this.session = this.newSession();
    }

    return true;
  }

  private startBreak(): void {
    const { minBreakMs, maxBreakMs } = this.config;
    const breakMs = minBreakMs + Math.random() * (maxBreakMs - minBreakMs);
    logger.info(`[Phantom] Session ended (${this.session.ordersThisSession} orders). Break for ${Math.round(breakMs / 60_000)}min`);
    this.emit('session:break', { duration: breakMs, ordersExecuted: this.session.ordersThisSession });
    this.session.breakUntilMs = Date.now() + breakMs;
    this.session.startMs = 0;
  }

  private newSession(): SessionState {
    const { minSessionMs, maxSessionMs } = this.config;
    const durationMs = minSessionMs + Math.random() * (maxSessionMs - minSessionMs);
    logger.info(`[Phantom] New session started. Duration: ${Math.round(durationMs / 60_000)}min`);
    return { startMs: Date.now(), durationMs, breakUntilMs: 0, ordersThisSession: 0 };
  }

  // ─── OTR TRACKER ───────────────────────────────────────────

  recordOrderPlaced(exchange: string): void {
    const otr = this.getOtr(exchange);
    otr.ordersPlaced++;
  }

  recordOrderFilled(exchange: string): void {
    const otr = this.getOtr(exchange);
    otr.ordersFilled++;
  }

  recordOrderCancelled(exchange: string): void {
    const otr = this.getOtr(exchange);
    otr.ordersCancelled++;
  }

  private getOtr(exchange: string): OtrState {
    let state = this.otr.get(exchange);
    if (!state) {
      state = { ordersPlaced: 0, ordersFilled: 0, ordersCancelled: 0 };
      this.otr.set(exchange, state);
    }
    return state;
  }

  // ─── ADAPTIVE RATE ─────────────────────────────────────────

  /** Call on clean exchange response — slowly increases rate budget */
  recordCleanResponse(exchange: string): void {
    const rate = this.getAdaptiveRate(exchange);
    rate.cleanStreak++;
    // Every 10 clean responses, nudge rate up by 1%
    if (rate.cleanStreak % 10 === 0 && rate.currentPct < this.config.adaptiveRateCeiling) {
      rate.currentPct = Math.min(this.config.adaptiveRateCeiling, rate.currentPct + 0.01);
    }
    rate.warningCount = Math.max(0, rate.warningCount - 1);
  }

  /** Call on 429/rate warning — immediately reduces rate budget */
  recordRateWarning(exchange: string): void {
    const rate = this.getAdaptiveRate(exchange);
    rate.warningCount++;
    rate.cleanStreak = 0;
    // Drop rate by 5% per warning, floor at adaptiveRateFloor
    rate.currentPct = Math.max(this.config.adaptiveRateFloor, rate.currentPct - 0.05);
    logger.warn(`[Phantom] Rate warning on ${exchange}. Budget → ${(rate.currentPct * 100).toFixed(0)}%`);
    this.emit('rate:adjusted', { exchange, pct: rate.currentPct });
  }

  private getAdaptiveRate(exchange: string): AdaptiveRateState {
    let state = this.adaptiveRate.get(exchange);
    if (!state) {
      // Start at midpoint between floor and ceiling
      const mid = (this.config.adaptiveRateFloor + this.config.adaptiveRateCeiling) / 2;
      state = { currentPct: mid, cleanStreak: 0, warningCount: 0 };
      this.adaptiveRate.set(exchange, state);
    }
    return state;
  }

  // ─── HELPERS ───────────────────────────────────────────────

  private block(reason: string, exchange: string): CloakDecision {
    const rate = this.getAdaptiveRate(exchange);
    const otr = this.getOtr(exchange);
    const otrRatio = otr.ordersPlaced > 0 ? otr.ordersCancelled / otr.ordersPlaced : 0;
    return {
      proceed: false,
      reason,
      delayMs: 0,
      size: 0,
      sessionActive: Date.now() > this.session.breakUntilMs,
      otr: otrRatio,
      adaptiveRatePct: rate.currentPct,
    };
  }

  /** Get full engine status for monitoring/dashboard */
  getStatus(): {
    sessionActive: boolean;
    sessionElapsedMin: number;
    breakRemainingMin: number;
    otrByExchange: Record<string, { ratio: number; placed: number; cancelled: number }>;
    rateByExchange: Record<string, number>;
  } {
    const now = Date.now();
    const otrByExchange: Record<string, { ratio: number; placed: number; cancelled: number }> = {};
    for (const [ex, state] of this.otr.entries()) {
      otrByExchange[ex] = {
        ratio: state.ordersPlaced > 0 ? state.ordersCancelled / state.ordersPlaced : 0,
        placed: state.ordersPlaced,
        cancelled: state.ordersCancelled,
      };
    }
    const rateByExchange: Record<string, number> = {};
    for (const [ex, state] of this.adaptiveRate.entries()) {
      rateByExchange[ex] = state.currentPct;
    }
    return {
      sessionActive: this.session.startMs > 0 && now - this.session.startMs < this.session.durationMs,
      sessionElapsedMin: this.session.startMs > 0 ? Math.round((now - this.session.startMs) / 60_000) : 0,
      breakRemainingMin: now < this.session.breakUntilMs ? Math.round((this.session.breakUntilMs - now) / 60_000) : 0,
      otrByExchange,
      rateByExchange,
    };
  }

  /** Reset daily OTR counters (call at midnight) */
  resetDailyCounters(): void {
    this.otr.clear();
    logger.info('[Phantom] Daily OTR counters reset');
  }
}
