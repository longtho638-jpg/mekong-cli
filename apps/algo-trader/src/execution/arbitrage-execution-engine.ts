/**
 * Arbitrage Execution Engine — Wires RealtimeArbitrageScanner → CircuitBreaker
 * → AtomicCrossExchangeOrderExecutor → position tracking → Telegram alerts.
 * Manages cooldowns, max concurrent executions, and cumulative metrics.
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import type { ArbitrageOpportunity } from './realtime-arbitrage-scanner';
import { AtomicCrossExchangeOrderExecutor, type AtomicExecutionResult } from './atomic-cross-exchange-order-executor';
import { AdaptiveCircuitBreaker } from './adaptive-circuit-breaker-per-exchange';
import { AntiDetectionSafetyLayer } from './anti-detection-order-randomizer-safety-layer';
import { BinhPhapStealthStrategy } from './binh-phap-stealth-trading-strategy';
import { PhantomCloakingEngine, type PhantomConfig } from './phantom-order-cloaking-engine';
import type { IExchange } from '../interfaces/IExchange';

export interface ArbEngineConfig {
  /** Cooldown per pair after execution (ms). Default 30_000 */
  cooldownMs?: number;
  /** Max concurrent executions. Default 3 */
  maxConcurrent?: number;
  /** Position size in base asset. Default 0.01 */
  positionSizeBase?: number;
  /** Dry run mode — log but don't execute. Default true */
  dryRun?: boolean;
  /** Max daily loss USD before halting. Default 100 */
  maxDailyLossUsd?: number;
  /** Enable anti-detection stealth layer. Default true for live, false for dry-run */
  enableStealth?: boolean;
  /** Override Phantom engine config (useful for testing with fast delays) */
  phantomConfig?: Partial<PhantomConfig>;
}

export interface ArbTradeRecord {
  id: string;
  opportunity: ArbitrageOpportunity;
  result: AtomicExecutionResult;
  executedAt: number;
}

export interface ArbEngineMetrics {
  totalExecutions: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnlUsd: number;
  winRate: number;
  avgLatencyMs: number;
  dailyPnlUsd: number;
  halted: boolean;
}

export class ArbitrageExecutionEngine extends EventEmitter {
  private readonly config: Required<ArbEngineConfig>;
  private readonly executor: AtomicCrossExchangeOrderExecutor;
  private readonly circuitBreaker: AdaptiveCircuitBreaker;
  private readonly safetyLayer: AntiDetectionSafetyLayer;
  private readonly stealthStrategy: BinhPhapStealthStrategy;
  private readonly phantom: PhantomCloakingEngine;
  private readonly exchanges: Map<string, IExchange>;
  private cooldowns = new Map<string, number>(); // key: "buy:sell:symbol" → cooldown expiry
  private activeCount = 0;
  private tradeHistory: ArbTradeRecord[] = [];
  private latencySum = 0;
  private dailyPnl = 0;
  private dailyResetDate = new Date().toDateString();
  private halted = false;
  private tradeCounter = 0;

  constructor(
    config: ArbEngineConfig,
    exchanges: Map<string, IExchange>,
    circuitBreaker: AdaptiveCircuitBreaker,
  ) {
    super();
    const enableStealth = config.enableStealth ?? !(config.dryRun ?? true);
    this.config = {
      cooldownMs: config.cooldownMs ?? 30_000,
      maxConcurrent: config.maxConcurrent ?? 3,
      positionSizeBase: config.positionSizeBase ?? 0.01,
      dryRun: config.dryRun ?? true,
      maxDailyLossUsd: config.maxDailyLossUsd ?? 100,
      enableStealth,
      phantomConfig: config.phantomConfig ?? {},
    };
    this.exchanges = exchanges;
    this.circuitBreaker = circuitBreaker;
    this.safetyLayer = new AntiDetectionSafetyLayer();
    this.stealthStrategy = new BinhPhapStealthStrategy();
    this.phantom = new PhantomCloakingEngine(config.phantomConfig);
    this.executor = new AtomicCrossExchangeOrderExecutor();

    // Wire stealth event listeners for threat escalation (Gap #2)
    if (enableStealth) {
      this.safetyLayer.on('rate-limited', ({ exchange }: { exchange: string }) => {
        this.stealthStrategy.escalateThreat(exchange, 'Rate limited by exchange (429/418)');
        this.phantom.recordRateWarning(exchange);
      });
      this.safetyLayer.on('auto-paused', ({ exchange }: { exchange: string }) => {
        this.stealthStrategy.escalateThreat(exchange, 'Auto-paused after consecutive errors');
      });
    }
  }

  /** Initialize balance checkpoint for stealth safety (call at startup) */
  async initBalanceCheckpoints(): Promise<void> {
    if (!this.config.enableStealth) return;
    for (const [name, exchange] of this.exchanges) {
      try {
        const balances = await exchange.fetchBalance();
        const usdtBalance = balances['USDT']?.total ?? balances['USD']?.total ?? 0;
        if (usdtBalance > 0) {
          this.safetyLayer.setInitialBalance(name, usdtBalance);
          logger.info(`[ArbEngine] Balance checkpoint set: ${name} = $${usdtBalance.toFixed(2)}`);
        }
      } catch {
        logger.warn(`[ArbEngine] Failed to fetch balance for ${name} — skipping checkpoint`);
      }
    }
  }

  /** Process an arbitrage opportunity — returns true if executed */
  async processOpportunity(opp: ArbitrageOpportunity): Promise<boolean> {
    // Daily reset check
    const today = new Date().toDateString();
    if (today !== this.dailyResetDate) {
      this.dailyPnl = 0;
      this.dailyResetDate = today;
      this.halted = false;
    }

    // Safety checks
    if (this.halted) {
      logger.warn('[ArbEngine] Halted — daily loss limit reached');
      return false;
    }

    const spread = opp.spread;
    const pairKey = `${spread.buyExchange}:${spread.sellExchange}:${spread.symbol}`;

    // Cooldown check
    const cooldownExpiry = this.cooldowns.get(pairKey) ?? 0;
    if (Date.now() < cooldownExpiry) {
      return false;
    }

    // Concurrent limit
    if (this.activeCount >= this.config.maxConcurrent) {
      return false;
    }

    // Circuit breaker check
    const buyKey = AdaptiveCircuitBreaker.key(spread.buyExchange, spread.symbol);
    const sellKey = AdaptiveCircuitBreaker.key(spread.sellExchange, spread.symbol);
    if (!this.circuitBreaker.isAllowed(buyKey) || !this.circuitBreaker.isAllowed(sellKey)) {
      logger.info(`[ArbEngine] Circuit breaker blocked: ${pairKey}`);
      return false;
    }

    // Dry run mode
    if (this.config.dryRun) {
      const record = this.createDryRunRecord(opp);
      this.tradeHistory.push(record);
      this.dailyPnl += spread.estimatedProfitUsd;
      this.emit('trade', record);
      logger.info(`[ArbEngine] DRY-RUN: ${spread.symbol} buy@${spread.buyExchange} sell@${spread.sellExchange} spread=${(spread.netSpreadPct * 100).toFixed(3)}%`);
      this.cooldowns.set(pairKey, Date.now() + this.config.cooldownMs);
      return true;
    }

    // Live execution
    const buyExchange = this.exchanges.get(spread.buyExchange);
    const sellExchange = this.exchanges.get(spread.sellExchange);
    if (!buyExchange || !sellExchange) {
      logger.error(`[ArbEngine] Exchange not found: ${spread.buyExchange} or ${spread.sellExchange}`);
      return false;
    }

    // Phantom Cloaking — session simulator + OTR + adaptive rate (outermost layer)
    let stealthSize = this.config.positionSizeBase;
    if (this.config.enableStealth) {
      const cloakDecision = this.phantom.cloak(spread.buyExchange, this.config.positionSizeBase, spread.symbol);
      if (!cloakDecision.proceed) {
        logger.info(`[ArbEngine] Phantom blocked: ${cloakDecision.reason}`);
        return false;
      }

      // Anti-detection safety layer (rate governor + kill switch)
      if (!this.safetyLayer.shouldProceed(spread.buyExchange)
        || !this.safetyLayer.shouldProceed(spread.sellExchange)) {
        logger.info(`[ArbEngine] Anti-detection paused: ${spread.buyExchange}/${spread.sellExchange}`);
        return false;
      }

      // Binh Phap stealth plan (terrain-aware + threat escalation)
      const stealthPlan = this.stealthStrategy.planExecution(
        spread.buyExchange, this.config.positionSizeBase, spread.symbol,
      );
      if (!stealthPlan.shouldProceed) {
        logger.info(`[ArbEngine] Stealth plan blocked: ${spread.symbol} on ${spread.buyExchange}`);
        return false;
      }

      // Apply Poisson-timed delay (exponential inter-arrival, not uniform jitter)
      const delayMs = Math.max(cloakDecision.delayMs, stealthPlan.delayMs);
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }

      // Use Phantom's log-normal sized amount (replaces uniform ±5% jitter)
      stealthSize = cloakDecision.size;
      this.phantom.recordOrderPlaced(spread.buyExchange);
    }

    this.activeCount++;
    // Apply randomized cooldown (stealth) or fixed cooldown
    const jitteredCooldown = this.config.enableStealth
      ? this.safetyLayer.randomizeDelay(this.config.cooldownMs)
      : this.config.cooldownMs;
    this.cooldowns.set(pairKey, Date.now() + jitteredCooldown);

    try {
      const result = await this.executor.executeAtomic({
        symbol: spread.symbol,
        amount: stealthSize,
        buyExchange,
        sellExchange,
      });

      this.latencySum += result.totalLatency;
      const record = this.createTradeRecord(opp, result);
      this.tradeHistory.push(record);
      this.dailyPnl += result.netPnl;

      // Stealth feedback loop — all 3 layers must receive signals
      if (this.config.enableStealth) {
        // Gap #1 fix: Record execution in BinhPhap for rate budget tracking
        this.stealthStrategy.recordExecution(spread.buyExchange, spread.symbol);
        this.stealthStrategy.recordExecution(spread.sellExchange, spread.symbol);
        this.safetyLayer.recordCall(spread.buyExchange);
        this.safetyLayer.recordCall(spread.sellExchange);
        this.safetyLayer.recordOrder(spread.buyExchange);
        this.safetyLayer.recordOrder(spread.sellExchange);

        if (result.success) {
          // Gap #3 fix: Record success/error in safety layer for auto-pause
          this.safetyLayer.recordSuccess(spread.buyExchange);
          this.safetyLayer.recordSuccess(spread.sellExchange);
          this.phantom.recordCleanResponse(spread.buyExchange);
          this.phantom.recordCleanResponse(spread.sellExchange);
          this.phantom.recordOrderFilled(spread.buyExchange);
          // Auto de-escalate threat on success
          this.stealthStrategy.autoDeescalate(spread.buyExchange, 15);
          this.stealthStrategy.autoDeescalate(spread.sellExchange, 15);
        } else {
          // Gap #3 fix: Record error → triggers auto-pause + threat escalation
          this.safetyLayer.recordError(spread.buyExchange);
          this.safetyLayer.recordError(spread.sellExchange);
          this.stealthStrategy.escalateThreat(spread.buyExchange, `Trade failed: ${result.error ?? 'unknown'}`);
          // Gap #5 fix: Rollback = cancelled orders → track OTR
          if (result.rollbackPerformed) {
            this.phantom.recordOrderCancelled(spread.buyExchange);
          }
        }
      }

      // Circuit breaker feedback
      if (result.success) {
        this.circuitBreaker.recordSuccess(buyKey);
        this.circuitBreaker.recordSuccess(sellKey);
        this.circuitBreaker.recordLatency(buyKey, result.buyLatency);
        this.circuitBreaker.recordLatency(sellKey, result.sellLatency);
      } else {
        this.circuitBreaker.recordFailure(buyKey);
        this.circuitBreaker.recordFailure(sellKey);
      }

      // Check daily loss limit
      if (this.dailyPnl < -this.config.maxDailyLossUsd) {
        this.halted = true;
        logger.warn(`[ArbEngine] HALTED — daily loss $${this.dailyPnl.toFixed(2)} exceeds limit $${this.config.maxDailyLossUsd}`);
        this.emit('halted', { dailyPnl: this.dailyPnl });
      }

      this.emit('trade', record);
      return result.success;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[ArbEngine] Execution error: ${msg}`);
      this.circuitBreaker.recordFailure(buyKey);
      this.circuitBreaker.recordFailure(sellKey);
      // Gap #3 fix: Feed error signals to stealth layers
      if (this.config.enableStealth) {
        this.safetyLayer.recordError(spread.buyExchange);
        this.safetyLayer.recordError(spread.sellExchange);
        this.stealthStrategy.escalateThreat(spread.buyExchange, `Exception: ${msg}`);
      }
      return false;
    } finally {
      this.activeCount--;
    }
  }

  getMetrics(): ArbEngineMetrics {
    const successful = this.tradeHistory.filter(t => t.result.success).length;
    const total = this.tradeHistory.length;
    const totalPnl = this.tradeHistory.reduce((sum, t) => sum + t.result.netPnl, 0);
    const avgLatency = total > 0 ? this.latencySum / total : 0;

    return {
      totalExecutions: total,
      successfulTrades: successful,
      failedTrades: total - successful,
      totalPnlUsd: totalPnl,
      winRate: total > 0 ? successful / total : 0,
      avgLatencyMs: avgLatency,
      dailyPnlUsd: this.dailyPnl,
      halted: this.halted,
    };
  }

  getTradeHistory(): ArbTradeRecord[] {
    return [...this.tradeHistory];
  }

  isHalted(): boolean {
    return this.halted;
  }

  /** Reset halt and daily counters */
  resetHalt(): void {
    this.halted = false;
    this.dailyPnl = 0;
  }

  private createTradeRecord(opp: ArbitrageOpportunity, result: AtomicExecutionResult): ArbTradeRecord {
    this.tradeCounter++;
    return {
      id: `arb-${this.tradeCounter}-${Date.now()}`,
      opportunity: opp,
      result,
      executedAt: Date.now(),
    };
  }

  private createDryRunRecord(opp: ArbitrageOpportunity): ArbTradeRecord {
    this.tradeCounter++;
    return {
      id: `arb-dry-${this.tradeCounter}-${Date.now()}`,
      opportunity: opp,
      result: {
        success: true,
        buyLatency: 0,
        sellLatency: 0,
        totalLatency: 0,
        netPnl: opp.spread.estimatedProfitUsd,
        rollbackPerformed: false,
      },
      executedAt: Date.now(),
    };
  }
}
