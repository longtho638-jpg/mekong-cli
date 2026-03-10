/**
 * Anti-Detection Order Randomizer & Safety Layer
 *
 * Protects against exchange account checkpoints/freezes by:
 * 1. TIMING RANDOMIZATION — Jitter on all order intervals (±30%)
 * 2. SIZE RANDOMIZATION — Order sizes vary ±5% to avoid pattern detection
 * 3. RATE GOVERNOR — Stays well under exchange API rate limits
 * 4. BALANCE CHECKPOINT — Auto-stop if balance drops below safety threshold
 * 5. EXCHANGE RESPONSE MONITOR — Detects 429/restriction signals → auto-pause
 * 6. KILL SWITCH — Emergency stop, cancels everything immediately
 * 7. ACTIVITY PATTERN BREAKER — Random pauses between bursts
 *
 * Usage:
 *   const safety = new AntiDetectionSafetyLayer(config);
 *   const delay = safety.randomizeDelay(1000);   // 700-1300ms
 *   const size = safety.randomizeSize(0.01);      // 0.0095-0.0105
 *   if (safety.shouldProceed('binance')) { ... }  // rate + kill check
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface SafetyConfig {
  /** Jitter range for timing (0.3 = ±30%). Default 0.3 */
  timingJitterPct: number;
  /** Jitter range for order size (0.05 = ±5%). Default 0.05 */
  sizeJitterPct: number;
  /** Max API calls per exchange per minute. Default 30 */
  maxCallsPerMinute: number;
  /** Balance drop % to trigger auto-stop. Default 10 (= 10%) */
  balanceDropStopPct: number;
  /** Consecutive errors before auto-pause. Default 3 */
  errorPauseThreshold: number;
  /** Pause duration after error threshold (ms). Default 300_000 (5min) */
  errorPauseDurationMs: number;
  /** Random idle pause: chance per cycle (0-1). Default 0.05 (5%) */
  randomPauseChance: number;
  /** Random idle pause duration range [min, max] ms. Default [5000, 30000] */
  randomPauseRangeMs: [number, number];
  /** Max orders per hour per exchange. Default 60 */
  maxOrdersPerHour: number;
}

export interface ExchangeHealth {
  exchange: string;
  callsThisMinute: number;
  ordersThisHour: number;
  consecutiveErrors: number;
  pausedUntil: number;
  lastCallAt: number;
  rateLimitWarnings: number;
  accountWarnings: number;
}

const DEFAULT_CONFIG: SafetyConfig = {
  timingJitterPct: 0.3,
  sizeJitterPct: 0.05,
  maxCallsPerMinute: 30,
  balanceDropStopPct: 10,
  errorPauseThreshold: 3,
  errorPauseDurationMs: 300_000,
  randomPauseChance: 0.05,
  randomPauseRangeMs: [5_000, 30_000],
  maxOrdersPerHour: 60,
};

export class AntiDetectionSafetyLayer extends EventEmitter {
  private config: SafetyConfig;
  private killed = false;
  private exchangeHealth = new Map<string, ExchangeHealth>();
  private initialBalances = new Map<string, number>();
  private callTimestamps = new Map<string, number[]>();
  private orderTimestamps = new Map<string, number[]>();

  constructor(config?: Partial<SafetyConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── RANDOMIZATION ──────────────────────────────────────────

  /** Add ±jitter to a base delay (ms). Returns randomized delay. */
  randomizeDelay(baseMs: number): number {
    const jitter = this.config.timingJitterPct;
    const factor = 1 + (Math.random() * 2 - 1) * jitter; // 0.7-1.3
    return Math.max(100, Math.round(baseMs * factor));
  }

  /** Add ±jitter to order size. Returns randomized size. */
  randomizeSize(baseSize: number): number {
    const jitter = this.config.sizeJitterPct;
    const factor = 1 + (Math.random() * 2 - 1) * jitter; // 0.95-1.05
    return Math.max(0.0001, parseFloat((baseSize * factor).toFixed(8)));
  }

  /** Sleep for randomized duration. Use between orders. */
  async randomSleep(baseMs: number): Promise<void> {
    const delay = this.randomizeDelay(baseMs);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // ─── RATE GOVERNING ─────────────────────────────────────────

  /** Check if it's safe to proceed with an API call to this exchange. */
  shouldProceed(exchange: string): boolean {
    if (this.killed) {
      logger.warn('[Safety] KILLED — all operations blocked');
      return false;
    }

    const health = this.getHealth(exchange);

    // Check pause
    if (Date.now() < health.pausedUntil) {
      return false;
    }

    // Check rate limit
    this.pruneTimestamps(exchange);
    const calls = this.callTimestamps.get(exchange) ?? [];
    if (calls.length >= this.config.maxCallsPerMinute) {
      logger.warn(`[Safety] Rate limit: ${exchange} at ${calls.length}/${this.config.maxCallsPerMinute} calls/min`);
      return false;
    }

    // Check hourly order limit
    const orders = this.orderTimestamps.get(exchange) ?? [];
    const hourAgo = Date.now() - 3_600_000;
    const recentOrders = orders.filter(t => t > hourAgo);
    if (recentOrders.length >= this.config.maxOrdersPerHour) {
      logger.warn(`[Safety] Order limit: ${exchange} at ${recentOrders.length}/${this.config.maxOrdersPerHour} orders/hour`);
      return false;
    }

    // Random pause (pattern breaker)
    if (Math.random() < this.config.randomPauseChance) {
      const [min, max] = this.config.randomPauseRangeMs;
      const pauseMs = min + Math.random() * (max - min);
      health.pausedUntil = Date.now() + pauseMs;
      logger.info(`[Safety] Random pause: ${exchange} for ${Math.round(pauseMs / 1000)}s (pattern breaker)`);
      return false;
    }

    return true;
  }

  /** Record an API call (for rate tracking). */
  recordCall(exchange: string): void {
    const calls = this.callTimestamps.get(exchange) ?? [];
    calls.push(Date.now());
    this.callTimestamps.set(exchange, calls);

    const health = this.getHealth(exchange);
    health.lastCallAt = Date.now();
    health.callsThisMinute = calls.length;
  }

  /** Record an order execution (for hourly limit). */
  recordOrder(exchange: string): void {
    const orders = this.orderTimestamps.get(exchange) ?? [];
    orders.push(Date.now());
    this.orderTimestamps.set(exchange, orders);

    const health = this.getHealth(exchange);
    health.ordersThisHour = orders.length;
  }

  // ─── EXCHANGE RESPONSE MONITORING ───────────────────────────

  /** Record a successful exchange response. Resets error counter. */
  recordSuccess(exchange: string): void {
    const health = this.getHealth(exchange);
    health.consecutiveErrors = 0;
  }

  /** Record an exchange error. Auto-pauses on threshold. */
  recordError(exchange: string, statusCode?: number): void {
    const health = this.getHealth(exchange);
    health.consecutiveErrors++;

    // Detect rate limit warning
    if (statusCode === 429 || statusCode === 418) {
      health.rateLimitWarnings++;
      logger.warn(`[Safety] Rate limit warning from ${exchange} (${statusCode}). Total: ${health.rateLimitWarnings}`);
      // Immediate pause: exponential backoff based on warning count
      const pauseMs = Math.min(
        this.config.errorPauseDurationMs * Math.pow(2, health.rateLimitWarnings - 1),
        1_800_000, // max 30min
      );
      health.pausedUntil = Date.now() + pauseMs;
      this.emit('rate-limited', { exchange, pauseMs, warnings: health.rateLimitWarnings });
      return;
    }

    // Detect account restriction (common exchange codes)
    if (statusCode === 403 || statusCode === 451) {
      health.accountWarnings++;
      logger.error(`[Safety] ACCOUNT WARNING from ${exchange} (${statusCode}). Activating kill switch!`);
      this.emergencyKill(`Account restriction detected on ${exchange} (HTTP ${statusCode})`);
      return;
    }

    // Auto-pause on consecutive errors
    if (health.consecutiveErrors >= this.config.errorPauseThreshold) {
      health.pausedUntil = Date.now() + this.config.errorPauseDurationMs;
      logger.warn(`[Safety] Auto-pause: ${exchange} after ${health.consecutiveErrors} errors. Pausing ${this.config.errorPauseDurationMs / 1000}s`);
      this.emit('auto-paused', { exchange, errors: health.consecutiveErrors });
    }
  }

  // ─── BALANCE CHECKPOINT ─────────────────────────────────────

  /** Set initial balance for an exchange (call at startup). */
  setInitialBalance(exchange: string, balance: number): void {
    this.initialBalances.set(exchange, balance);
  }

  /** Check current balance against initial. Returns true if safe. */
  checkBalance(exchange: string, currentBalance: number): boolean {
    const initial = this.initialBalances.get(exchange);
    if (initial === undefined || initial === 0) return true;

    const dropPct = ((initial - currentBalance) / initial) * 100;
    if (dropPct >= this.config.balanceDropStopPct) {
      logger.error(`[Safety] Balance drop ${dropPct.toFixed(1)}% on ${exchange}! Threshold: ${this.config.balanceDropStopPct}%`);
      this.emergencyKill(`Balance dropped ${dropPct.toFixed(1)}% on ${exchange} (initial: $${initial.toFixed(2)}, current: $${currentBalance.toFixed(2)})`);
      return false;
    }

    return true;
  }

  // ─── KILL SWITCH ────────────────────────────────────────────

  /** Emergency kill — stops ALL operations immediately. */
  emergencyKill(reason: string): void {
    if (this.killed) return;
    this.killed = true;
    logger.error(`[Safety] ⛔ EMERGENCY KILL: ${reason}`);
    this.emit('kill', { reason, timestamp: Date.now() });
  }

  /** Check if system has been killed. */
  isKilled(): boolean {
    return this.killed;
  }

  /** Reset kill switch (manual override). */
  resetKill(): void {
    this.killed = false;
    logger.info('[Safety] Kill switch reset');
    this.emit('kill-reset');
  }

  // ─── STATUS ─────────────────────────────────────────────────

  /** Get health status for an exchange. */
  getHealth(exchange: string): ExchangeHealth {
    let health = this.exchangeHealth.get(exchange);
    if (!health) {
      health = {
        exchange,
        callsThisMinute: 0,
        ordersThisHour: 0,
        consecutiveErrors: 0,
        pausedUntil: 0,
        lastCallAt: 0,
        rateLimitWarnings: 0,
        accountWarnings: 0,
      };
      this.exchangeHealth.set(exchange, health);
    }
    return health;
  }

  /** Get health summary for all exchanges. */
  getAllHealth(): ExchangeHealth[] {
    return Array.from(this.exchangeHealth.values());
  }

  /** Get overall safety status. */
  getStatus(): { killed: boolean; exchanges: ExchangeHealth[]; config: SafetyConfig } {
    return {
      killed: this.killed,
      exchanges: this.getAllHealth(),
      config: this.config,
    };
  }

  /** Clean up old timestamps (> 1 minute). */
  private pruneTimestamps(exchange: string): void {
    const now = Date.now();
    const minuteAgo = now - 60_000;

    const calls = this.callTimestamps.get(exchange);
    if (calls) {
      this.callTimestamps.set(exchange, calls.filter(t => t > minuteAgo));
    }

    const hourAgo = now - 3_600_000;
    const orders = this.orderTimestamps.get(exchange);
    if (orders) {
      this.orderTimestamps.set(exchange, orders.filter(t => t > hourAgo));
    }
  }
}
