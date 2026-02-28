/**
 * SpreadDetectorEngine — Unified multi-exchange spread detection + execution engine.
 * Integrates: ArbitrageScanner (detect) → SignalScorer (rank) → OrderBookAnalyzer (validate)
 *           → EmergencyCircuitBreaker (safety) → ArbitrageExecutor (execute)
 *           → SpreadHistoryTracker (learn) → ProfitTracker (track)
 *
 * Lifecycle: configure() → start() → [detect→score→validate→execute loop] → stop()
 * Supported exchanges: Binance, OKX, Bybit (via CCXT)
 */

import { ArbitrageScanner, ArbitrageOpportunity, ScannerConfig } from './ArbitrageScanner';
import { ArbitrageExecutor, ExecutorConfig, ExecutionResult } from './ArbitrageExecutor';
import { ArbitrageSignalScorer, ScorerConfig, ScoredSignal, SignalFactors } from './ArbitrageSignalScorer';
import { OrderBookAnalyzer, OrderBook } from './OrderBookAnalyzer';
import { EmergencyCircuitBreaker, CircuitBreakerConfig, CircuitState } from './EmergencyCircuitBreaker';
import { SpreadHistoryTracker, SpreadHistoryConfig, SpreadZScore } from './SpreadHistoryTracker';
import { ProfitTracker } from './ProfitTracker';
import { MultiExchangeConnector, ExchangeConfig } from './MultiExchangeConnector';
import { ExchangeClient } from '../execution/ExchangeClient';
import { logger } from '../utils/logger';

/** Target exchanges for spread detection */
export const TARGET_EXCHANGES = ['binance', 'okx', 'bybit'] as const;
export type TargetExchange = typeof TARGET_EXCHANGES[number];

export interface SpreadDetectorConfig {
  exchanges: ExchangeConfig[];
  symbols: string[];
  scanner: Partial<ScannerConfig>;
  executor: Partial<ExecutorConfig>;
  scorer: Partial<ScorerConfig>;
  circuitBreaker: Partial<CircuitBreakerConfig>;
  spreadHistory: Partial<SpreadHistoryConfig>;
  initialEquity: number;
  maxOpportunitiesPerCycle: number;
  enableOrderBookValidation: boolean;
  enableSignalScoring: boolean;
  enableSpreadHistory: boolean;
  logIntervalMs: number;
  orderbookRefreshMs: number;
}

export interface DetectionEvent {
  opportunity: ArbitrageOpportunity;
  signal: ScoredSignal | null;
  zScore: SpreadZScore | null;
  orderbookFeasible: boolean;
  executed: boolean;
  result: ExecutionResult | null;
  reason: string;
  timestamp: number;
}

export interface EngineStats {
  status: 'idle' | 'running' | 'stopped' | 'halted';
  uptime: number;
  totalDetections: number;
  totalScored: number;
  totalExecuted: number;
  successfulExecutions: number;
  skippedByScorer: number;
  skippedByOrderbook: number;
  skippedByCircuitBreaker: number;
  circuitState: CircuitState;
  connectedExchanges: string[];
  avgDetectionLatencyMs: number;
}

const DEFAULT_CONFIG: SpreadDetectorConfig = {
  exchanges: [],
  symbols: ['BTC/USDT', 'ETH/USDT'],
  scanner: { pollIntervalMs: 2000, minSpreadPercent: 0.05 },
  executor: { maxPositionSizeUsd: 1000, maxConcurrentTrades: 3 },
  scorer: { executeThreshold: 65 },
  circuitBreaker: { maxDailyLossUsd: 100, maxConsecutiveLosses: 5 },
  spreadHistory: { maxRecordsPerPair: 1000 },
  initialEquity: 10000,
  maxOpportunitiesPerCycle: 5,
  enableOrderBookValidation: true,
  enableSignalScoring: true,
  enableSpreadHistory: true,
  logIntervalMs: 60000,
  orderbookRefreshMs: 5000,
};

export class SpreadDetectorEngine {
  private config: SpreadDetectorConfig;

  // Core components
  private connector: MultiExchangeConnector;
  private scanner: ArbitrageScanner;
  private executor: ArbitrageExecutor;
  private scorer: ArbitrageSignalScorer;
  private orderbook: OrderBookAnalyzer;
  private circuitBreaker: EmergencyCircuitBreaker;
  private spreadHistory: SpreadHistoryTracker;
  private profitTracker: ProfitTracker;

  // State
  private isRunning = false;
  private startTime = 0;
  private events: DetectionEvent[] = [];
  private logTimer: NodeJS.Timeout | null = null;
  private orderbookTimer: NodeJS.Timeout | null = null;
  private detectionLatencies: number[] = [];

  private stats: EngineStats = {
    status: 'idle',
    uptime: 0,
    totalDetections: 0,
    totalScored: 0,
    totalExecuted: 0,
    successfulExecutions: 0,
    skippedByScorer: 0,
    skippedByOrderbook: 0,
    skippedByCircuitBreaker: 0,
    circuitState: 'closed',
    connectedExchanges: [],
    avgDetectionLatencyMs: 0,
  };

  constructor(config?: Partial<SpreadDetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.connector = new MultiExchangeConnector();
    this.scanner = new ArbitrageScanner(this.config.scanner);
    this.executor = new ArbitrageExecutor(this.config.executor);
    this.scorer = new ArbitrageSignalScorer(this.config.scorer);
    this.orderbook = new OrderBookAnalyzer();
    this.circuitBreaker = new EmergencyCircuitBreaker(this.config.circuitBreaker);
    this.spreadHistory = new SpreadHistoryTracker(this.config.spreadHistory);
    this.profitTracker = new ProfitTracker({ initialEquity: this.config.initialEquity });
  }

  /**
   * Initialize: register exchanges, connect, wire components.
   * Returns list of connected exchange names.
   */
  async init(): Promise<string[]> {
    logger.info('[SpreadDetector] Initializing...');

    // Register exchanges
    for (const ex of this.config.exchanges) {
      this.connector.addExchange(ex);
    }

    // Connect all
    const connected = await this.connector.connectAll();
    this.stats.connectedExchanges = connected;

    if (connected.length < 2) {
      throw new Error(`SpreadDetector needs ≥2 exchanges, only ${connected.length} connected`);
    }

    // Wire clients to scanner + executor
    const clients = this.connector.getActiveClients();
    for (const [name, client] of clients) {
      this.scanner.addExchange(name, client);
      this.executor.addExchange(name, client);
    }

    // Wire scanner → detection pipeline
    this.scanner.onOpportunity((opp) => {
      this.handleDetection(opp);
    });

    logger.info(`[SpreadDetector] Initialized: ${connected.length} exchanges (${connected.join(', ')}), ${this.config.symbols.length} symbols`);
    return connected;
  }

  /**
   * Start the detection + execution loop.
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.stats.status = 'running';

    // Start health checks
    this.connector.startHealthChecks();

    // Start periodic orderbook refresh
    if (this.config.enableOrderBookValidation) {
      this.startOrderbookRefresh();
    }

    // Start dashboard logging
    this.logTimer = setInterval(() => this.logDashboard(), this.config.logIntervalMs);

    // Start scanner
    await this.scanner.start();

    logger.info('[SpreadDetector] 🚀 Engine STARTED — scanning Binance/OKX/Bybit for spreads...');
  }

  /**
   * Stop all components gracefully.
   */
  stop(): void {
    this.isRunning = false;
    this.stats.status = 'stopped';

    this.scanner.stop();
    this.connector.stopHealthChecks();
    this.circuitBreaker.shutdown();

    if (this.logTimer) {
      clearInterval(this.logTimer);
      this.logTimer = null;
    }
    if (this.orderbookTimer) {
      clearInterval(this.orderbookTimer);
      this.orderbookTimer = null;
    }

    this.connector.shutdown();

    logger.info('[SpreadDetector] Engine STOPPED');
    this.logDashboard();
  }

  /**
   * Core pipeline: detect → score → validate → execute.
   * Called for every opportunity emitted by ArbitrageScanner.
   */
  private async handleDetection(opp: ArbitrageOpportunity): Promise<void> {
    if (!this.isRunning) return;

    const startMs = Date.now();
    this.stats.totalDetections++;

    // 1. Circuit breaker check
    if (!this.circuitBreaker.isAllowed()) {
      this.stats.skippedByCircuitBreaker++;
      this.stats.circuitState = this.circuitBreaker.getState();
      this.recordEvent(opp, null, null, false, false, null, 'circuit_breaker_open');
      return;
    }

    // 2. Record spread history
    let zScore: SpreadZScore | null = null;
    if (this.config.enableSpreadHistory) {
      this.spreadHistory.record({
        symbol: opp.symbol,
        buyExchange: opp.buyExchange,
        sellExchange: opp.sellExchange,
        spreadPercent: opp.spreadPercent,
        timestamp: opp.timestamp,
      });

      zScore = this.spreadHistory.getZScore(
        opp.buyExchange, opp.sellExchange, opp.symbol, opp.spreadPercent
      );
    }

    // 3. Signal scoring
    let signal: ScoredSignal | null = null;
    if (this.config.enableSignalScoring) {
      const liquidityScore = this.orderbook.hasOrderBook(opp.buyExchange, opp.symbol)
        ? this.orderbook.getLiquidityScore(opp.buyExchange, opp.symbol).score
        : 50; // default when no orderbook data

      const factors: SignalFactors = {
        spreadPercent: opp.spreadPercent,
        netProfitPercent: opp.netProfitPercent,
        liquidityScore,
        latencyMs: opp.latency.buy + opp.latency.sell,
        feeCostPercent: (this.config.scanner.feeRatePerSide || 0.001) * 2 * 100,
        spreadZScore: zScore?.zScore || 0,
        fillable: true, // will be re-evaluated in orderbook step
        exchangeHealthy: this.connector.isHealthy(opp.buyExchange) &&
                         this.connector.isHealthy(opp.sellExchange),
      };

      signal = this.scorer.score(factors);
      this.stats.totalScored++;

      if (signal.recommendation === 'skip') {
        this.stats.skippedByScorer++;
        this.recordEvent(opp, signal, zScore, false, false, null, `score_too_low: ${signal.totalScore}`);
        return;
      }
    }

    // 4. Orderbook validation
    let orderbookFeasible = true;
    if (this.config.enableOrderBookValidation) {
      const positionUsd = Math.min(
        this.config.executor.maxPositionSizeUsd || 1000,
        opp.estimatedProfitUsd * 100
      );
      const amount = positionUsd / opp.buyPrice;

      if (this.orderbook.hasOrderBook(opp.buyExchange, opp.symbol) &&
          this.orderbook.hasOrderBook(opp.sellExchange, opp.symbol)) {
        const sim = this.orderbook.simulateArbitrageFill(
          opp.buyExchange, opp.sellExchange, opp.symbol,
          amount, this.config.scanner.feeRatePerSide || 0.001
        );

        orderbookFeasible = sim.feasible;

        if (!orderbookFeasible) {
          this.stats.skippedByOrderbook++;
          this.recordEvent(opp, signal, zScore, false, false, null,
            `orderbook_infeasible: slippage=${sim.totalSlippageBps.toFixed(1)}bps`);
          return;
        }
      }
    }

    // 5. Rate limit check
    if (this.stats.totalExecuted >= this.config.maxOpportunitiesPerCycle &&
        this.stats.successfulExecutions === 0) {
      this.recordEvent(opp, signal, zScore, orderbookFeasible, false, null, 'rate_limited');
      return;
    }

    // 6. Execute
    this.stats.totalExecuted++;
    try {
      const result = await this.executor.execute(opp);

      // Track profit/loss
      this.profitTracker.recordTrade(result.actualProfitUsd);

      // Record in circuit breaker
      const tripped = this.circuitBreaker.recordTrade(result.actualProfitUsd);
      this.stats.circuitState = this.circuitBreaker.getState();

      if (tripped) {
        logger.warn('[SpreadDetector] ⚡ Circuit breaker TRIPPED — halting trades');
        this.stats.status = 'halted';
      }

      if (result.success) {
        this.stats.successfulExecutions++;
      }

      // Track detection latency
      const latency = Date.now() - startMs;
      this.detectionLatencies.push(latency);
      if (this.detectionLatencies.length > 100) {
        this.detectionLatencies.shift();
      }

      this.recordEvent(opp, signal, zScore, orderbookFeasible, true, result,
        result.success ? 'executed_ok' : `execution_failed: ${result.error}`);

    } catch (err) {
      logger.error(`[SpreadDetector] Execution error: ${err instanceof Error ? err.message : String(err)}`);
      this.recordEvent(opp, signal, zScore, orderbookFeasible, false, null,
        `execution_error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Start periodic orderbook refresh for active exchanges.
   */
  private startOrderbookRefresh(): void {
    this.orderbookTimer = setInterval(async () => {
      const clients = this.connector.getActiveClients();

      for (const [name, client] of clients) {
        for (const symbol of this.config.symbols) {
          try {
            const rawBook = await this.fetchOrderbook(client, symbol);
            if (rawBook) {
              this.orderbook.updateOrderBook({
                exchange: name,
                symbol,
                bids: rawBook.bids,
                asks: rawBook.asks,
                timestamp: Date.now(),
              });
            }
          } catch {
            // Silently skip — orderbook is optional enhancement
          }
        }
      }
    }, this.config.orderbookRefreshMs);
  }

  /**
   * Fetch orderbook from exchange client.
   * Returns null on error — orderbook validation gracefully degrades.
   */
  private async fetchOrderbook(
    client: ExchangeClient,
    symbol: string
  ): Promise<{ bids: { price: number; amount: number }[]; asks: { price: number; amount: number }[] } | null> {
    try {
      const book = await client.fetchOrderBook(symbol, 20);
      return { bids: book.bids, asks: book.asks };
    } catch {
      return null;
    }
  }

  private recordEvent(
    opp: ArbitrageOpportunity,
    signal: ScoredSignal | null,
    zScore: SpreadZScore | null,
    orderbookFeasible: boolean,
    executed: boolean,
    result: ExecutionResult | null,
    reason: string
  ): void {
    const event: DetectionEvent = {
      opportunity: opp,
      signal,
      zScore,
      orderbookFeasible,
      executed,
      result,
      reason,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Keep bounded
    if (this.events.length > 500) {
      this.events.splice(0, this.events.length - 500);
    }
  }

  /**
   * Log dashboard summary.
   */
  private logDashboard(): void {
    const uptime = this.isRunning ? Date.now() - this.startTime : 0;
    this.stats.uptime = uptime;

    const uptimeMin = (uptime / 60000).toFixed(1);
    const winRate = this.stats.totalExecuted > 0
      ? ((this.stats.successfulExecutions / this.stats.totalExecuted) * 100).toFixed(1)
      : '0';

    const avgLatency = this.detectionLatencies.length > 0
      ? this.detectionLatencies.reduce((a, b) => a + b, 0) / this.detectionLatencies.length
      : 0;
    this.stats.avgDetectionLatencyMs = avgLatency;

    const profitSummary = this.profitTracker.getSummary();
    const cbMetrics = this.circuitBreaker.getMetrics();

    logger.info('\n╔══════════════════════════════════════════╗');
    logger.info('║   🎯 SPREAD DETECTOR ENGINE (Binance/OKX/Bybit)  ║');
    logger.info('╠══════════════════════════════════════════╣');
    logger.info(`║ Status:       ${this.stats.status.toUpperCase().padEnd(27)}║`);
    logger.info(`║ Uptime:       ${(uptimeMin + 'min').padEnd(27)}║`);
    logger.info(`║ Exchanges:    ${this.stats.connectedExchanges.join(', ').padEnd(27)}║`);
    logger.info(`║ Detections:   ${String(this.stats.totalDetections).padEnd(27)}║`);
    logger.info(`║ Scored:       ${String(this.stats.totalScored).padEnd(27)}║`);
    logger.info(`║ Executed:     ${String(this.stats.totalExecuted).padEnd(27)}║`);
    logger.info(`║ Win Rate:     ${(winRate + '%').padEnd(27)}║`);
    logger.info(`║ Avg Latency:  ${(avgLatency.toFixed(0) + 'ms').padEnd(27)}║`);
    logger.info('╠══════════════════════════════════════════╣');
    logger.info(`║ Net P&L:      $${profitSummary.cumulativePnl.toFixed(2).padEnd(25)}║`);
    logger.info(`║ Max Drawdown: ${(profitSummary.maxDrawdownPercent.toFixed(1) + '%').padEnd(27)}║`);
    logger.info(`║ Circuit:      ${cbMetrics.state.toUpperCase().padEnd(27)}║`);
    logger.info('╠══════════════════════════════════════════╣');
    logger.info(`║ Skip/Score:   ${String(this.stats.skippedByScorer).padEnd(27)}║`);
    logger.info(`║ Skip/OB:      ${String(this.stats.skippedByOrderbook).padEnd(27)}║`);
    logger.info(`║ Skip/CB:      ${String(this.stats.skippedByCircuitBreaker).padEnd(27)}║`);
    logger.info('╚══════════════════════════════════════════╝\n');
  }

  // --- Public API ---

  /** Get current engine stats */
  getStats(): EngineStats {
    this.stats.uptime = this.isRunning ? Date.now() - this.startTime : 0;
    this.stats.circuitState = this.circuitBreaker.getState();
    return { ...this.stats };
  }

  /** Get recent detection events */
  getEvents(limit: number = 50): DetectionEvent[] {
    return this.events.slice(-limit);
  }

  /** Get profit tracker summary */
  getProfitSummary() {
    return this.profitTracker.getSummary();
  }

  /** Get spread history stats for all pairs */
  getSpreadStats() {
    return this.spreadHistory.getAllStats();
  }

  /** Get best trading hours for a pair */
  getBestTradingHours(buyExchange: string, sellExchange: string, symbol: string) {
    return this.spreadHistory.getBestTradingHours(buyExchange, sellExchange, symbol);
  }

  /** Get scoring distribution */
  getScoreDistribution() {
    return this.scorer.getGradeDistribution();
  }

  /** Get circuit breaker metrics */
  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  /** Manual trip circuit breaker (emergency stop) */
  emergencyStop(reason: string): void {
    this.circuitBreaker.manualTrip(reason);
    this.stats.status = 'halted';
    this.stats.circuitState = this.circuitBreaker.getState();
    logger.warn(`[SpreadDetector] 🛑 EMERGENCY STOP: ${reason}`);
  }

  /** Force resume after emergency stop */
  resume(): void {
    this.circuitBreaker.forceClose();
    this.stats.status = 'running';
    this.stats.circuitState = 'closed';
    logger.info('[SpreadDetector] ▶️ Resumed trading');
  }

  /** Reset daily counters (call at start of each trading day) */
  resetDaily(): void {
    this.executor.resetDaily();
    this.circuitBreaker.resetDaily();
    this.stats.skippedByCircuitBreaker = 0;
    logger.info('[SpreadDetector] Daily reset completed');
  }

  /** Update orderbook manually (for testing or external feed) */
  updateOrderBook(book: OrderBook): void {
    this.orderbook.updateOrderBook(book);
  }

  /** Check if engine is running */
  isActive(): boolean {
    return this.isRunning;
  }

  /** Get component references for advanced usage */
  getComponents() {
    return {
      connector: this.connector,
      scanner: this.scanner,
      executor: this.executor,
      scorer: this.scorer,
      orderbook: this.orderbook,
      circuitBreaker: this.circuitBreaker,
      spreadHistory: this.spreadHistory,
      profitTracker: this.profitTracker,
    };
  }
}
