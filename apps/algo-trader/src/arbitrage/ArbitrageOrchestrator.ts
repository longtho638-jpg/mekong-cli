/**
 * ArbitrageOrchestrator — Infinite-loop engine connecting all arbitrage components.
 * Wires: MultiExchangeConnector → RealTimePriceAggregator → ArbitrageScanner → ArbitrageExecutor
 * With: LatencyOptimizer tracking + auto daily reset + graceful shutdown.
 *
 * Lifecycle: init() → start() → [infinite scan→detect→execute loop] → stop()
 */

import { MultiExchangeConnector, ExchangeConfig } from './MultiExchangeConnector';
import { RealTimePriceAggregator } from './RealTimePriceAggregator';
import { ArbitrageScanner, ArbitrageOpportunity, ScannerConfig } from './ArbitrageScanner';
import { ArbitrageExecutor, ExecutorConfig, ExecutionResult } from './ArbitrageExecutor';
import { LatencyOptimizer } from './LatencyOptimizer';
import { ProfitTracker } from './ProfitTracker';
import { AdaptiveSpreadThreshold } from './AdaptiveSpreadThreshold';
import { WebSocketPriceFeed } from './WebSocketPriceFeed';
import { logger } from '../utils/logger';

export interface OrchestratorConfig {
  exchanges: ExchangeConfig[];
  symbols: string[];
  scanner: Partial<ScannerConfig>;
  executor: Partial<ExecutorConfig>;
  enableLatencyOptimizer: boolean;
  enableProfitTracker: boolean;          // Track equity curve + drawdown (default: true)
  enableAdaptiveThreshold: boolean;      // Auto-adjust spread threshold (default: true)
  enableWebSocket: boolean;              // Use WebSocket feeds instead of REST polling (default: false)
  initialEquity: number;                 // Starting equity for profit tracker (default: 10000)
  maxDrawdownPercent: number;            // Halt trading if drawdown exceeds this (default: 20)
  dailyResetHourUtc: number;             // Hour (0-23) to reset daily P&L (default: 0 = midnight UTC)
  maxOpportunitiesPerCycle: number;      // Max opportunities to execute per scan cycle (default: 3)
  logIntervalMs: number;                 // Dashboard log interval (default: 60000)
}

export interface OrchestratorStats {
  status: 'idle' | 'running' | 'stopped';
  uptime: number;
  totalCycles: number;
  totalOpportunities: number;
  totalExecutions: number;
  successfulExecutions: number;
  connectedExchanges: number;
  lastCycleMs: number;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  exchanges: [],
  symbols: ['BTC/USDT', 'ETH/USDT'],
  scanner: {},
  executor: {},
  enableLatencyOptimizer: true,
  enableProfitTracker: true,
  enableAdaptiveThreshold: true,
  enableWebSocket: false,
  initialEquity: 10000,
  maxDrawdownPercent: 20,
  dailyResetHourUtc: 0,
  maxOpportunitiesPerCycle: 3,
  logIntervalMs: 60000,
};

export class ArbitrageOrchestrator {
  private config: OrchestratorConfig;
  private connector: MultiExchangeConnector;
  private aggregator: RealTimePriceAggregator;
  private scanner: ArbitrageScanner;
  private executor: ArbitrageExecutor;
  private latencyOptimizer: LatencyOptimizer;

  private isRunning = false;
  private startTime = 0;
  private stats: OrchestratorStats = {
    status: 'idle',
    totalCycles: 0,
    totalOpportunities: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    connectedExchanges: 0,
    lastCycleMs: 0,
    uptime: 0,
  };

  private logTimer: NodeJS.Timeout | null = null;
  private dailyResetTimer: NodeJS.Timeout | null = null;
  private executionResults: ExecutionResult[] = [];

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.connector = new MultiExchangeConnector();
    this.aggregator = new RealTimePriceAggregator({
      pollIntervalMs: this.config.scanner.pollIntervalMs || 2000,
      minExchanges: 2,
    });
    this.scanner = new ArbitrageScanner(this.config.scanner);
    this.executor = new ArbitrageExecutor(this.config.executor);
    this.latencyOptimizer = new LatencyOptimizer();
  }

  /**
   * Initialize all components: register exchanges, wire connections.
   */
  async init(): Promise<void> {
    logger.info('[Orchestrator] Initializing...');

    // Register exchanges
    for (const exchangeConfig of this.config.exchanges) {
      this.connector.addExchange(exchangeConfig);
    }

    // Connect all exchanges
    const connected = await this.connector.connectAll();
    this.stats.connectedExchanges = connected.length;

    if (connected.length < 2) {
      throw new Error(`Need at least 2 exchanges, only ${connected.length} connected`);
    }

    // Wire clients to scanner, executor, and aggregator
    const activeClients = this.connector.getActiveClients();
    for (const [name, client] of activeClients) {
      this.scanner.addExchange(name, client);
      this.executor.addExchange(name, client);
      this.aggregator.addExchange(name, client);

      // Register warmup for latency optimizer
      if (this.config.enableLatencyOptimizer) {
        this.latencyOptimizer.registerWarmup(name, async () => {
          const start = Date.now();
          await client.fetchTicker('BTC/USDT');
          this.latencyOptimizer.record(name, Date.now() - start, 'ticker', true);
        });
      }
    }

    // Configure aggregator symbols
    this.aggregator.setSymbols(this.config.symbols);

    // Wire scanner opportunity events → executor
    this.scanner.onOpportunity((opp) => {
      this.handleOpportunity(opp);
    });

    logger.info(`[Orchestrator] Initialized: ${connected.length} exchanges, ${this.config.symbols.length} symbols`);
  }

  /**
   * Start the infinite arbitrage loop.
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();
    this.stats.status = 'running';

    // Start health checks
    this.connector.startHealthChecks();

    // Start latency optimizer warmup
    if (this.config.enableLatencyOptimizer) {
      this.latencyOptimizer.startWarmup();
    }

    // Start dashboard logging
    this.logTimer = setInterval(() => this.logDashboard(), this.config.logIntervalMs);

    // Schedule daily P&L reset
    this.scheduleDailyReset();

    // Start the scanner (which polls and emits opportunities)
    await this.scanner.start();

    logger.info('[Orchestrator] 🚀 Arbitrage engine STARTED — scanning for opportunities...');
  }

  /**
   * Stop all components gracefully.
   */
  stop(): void {
    this.isRunning = false;
    this.stats.status = 'stopped';

    this.scanner.stop();
    this.aggregator.stop();
    this.connector.stopHealthChecks();
    this.latencyOptimizer.stopWarmup();

    if (this.logTimer) {
      clearInterval(this.logTimer);
      this.logTimer = null;
    }
    if (this.dailyResetTimer) {
      clearInterval(this.dailyResetTimer);
      this.dailyResetTimer = null;
    }

    this.connector.shutdown();

    logger.info('[Orchestrator] Engine STOPPED');
    this.logDashboard();
  }

  /**
   * Handle a detected arbitrage opportunity.
   */
  private async handleOpportunity(opp: ArbitrageOpportunity): Promise<void> {
    if (!this.isRunning) return;

    this.stats.totalOpportunities++;

    // Check latency feasibility
    if (this.config.enableLatencyOptimizer) {
      const buyOk = this.latencyOptimizer.meetsTarget(opp.buyExchange);
      const sellOk = this.latencyOptimizer.meetsTarget(opp.sellExchange);
      if (!buyOk || !sellOk) {
        logger.warn(`[Orchestrator] Skipping opp: latency too high (buy=${buyOk}, sell=${sellOk})`);
        return;
      }
    }

    // Rate limit executions per cycle
    if (this.stats.totalExecutions - this.stats.successfulExecutions > this.config.maxOpportunitiesPerCycle * 3) {
      return; // Too many failures, slow down
    }

    // Execute
    this.stats.totalExecutions++;
    const startMs = Date.now();

    try {
      const result = await this.executor.execute(opp);
      this.executionResults.push(result);

      // Record latency
      if (this.config.enableLatencyOptimizer) {
        this.latencyOptimizer.record(opp.buyExchange, result.executionTimeMs, 'order', result.success);
        this.latencyOptimizer.record(opp.sellExchange, result.executionTimeMs, 'order', result.success);
      }

      if (result.success) {
        this.stats.successfulExecutions++;
      }

      this.stats.lastCycleMs = Date.now() - startMs;
    } catch (err) {
      logger.error(`[Orchestrator] Execution error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Schedule daily P&L reset at configured hour (UTC).
   */
  private scheduleDailyReset(): void {
    // Check every minute if it's time for daily reset
    this.dailyResetTimer = setInterval(() => {
      const now = new Date();
      if (now.getUTCHours() === this.config.dailyResetHourUtc && now.getUTCMinutes() === 0) {
        this.executor.resetDaily();
        logger.info('[Orchestrator] Daily P&L reset completed');
      }
    }, 60000);
  }

  /**
   * Log dashboard summary to logger.
   */
  private logDashboard(): void {
    const uptime = this.isRunning ? Date.now() - this.startTime : 0;
    this.stats.uptime = uptime;

    const uptimeMin = (uptime / 60000).toFixed(1);
    const winRate = this.stats.totalExecutions > 0
      ? ((this.stats.successfulExecutions / this.stats.totalExecutions) * 100).toFixed(1)
      : '0';

    logger.info('\n╔══════════════════════════════════════╗');
    logger.info('║      🎯 ARBITRAGE ORCHESTRATOR       ║');
    logger.info('╠══════════════════════════════════════╣');
    logger.info(`║ Status:      ${this.stats.status.toUpperCase().padEnd(23)}║`);
    logger.info(`║ Uptime:      ${(uptimeMin + 'min').padEnd(23)}║`);
    logger.info(`║ Exchanges:   ${String(this.stats.connectedExchanges).padEnd(23)}║`);
    logger.info(`║ Opportunities: ${String(this.stats.totalOpportunities).padEnd(21)}║`);
    logger.info(`║ Executions:  ${String(this.stats.totalExecutions).padEnd(23)}║`);
    logger.info(`║ Win Rate:    ${(winRate + '%').padEnd(23)}║`);
    logger.info(`║ Last Cycle:  ${(this.stats.lastCycleMs + 'ms').padEnd(23)}║`);
    logger.info('╚══════════════════════════════════════╝\n');

    // Also print executor dashboard
    this.executor.printDashboard();

    // Print latency summary
    if (this.config.enableLatencyOptimizer) {
      const profiles = this.latencyOptimizer.getSummary();
      for (const p of profiles) {
        logger.info(`[Latency] ${p.exchange}: p50=${p.p50Ms}ms p95=${p.p95Ms}ms avg_order=${p.avgOrderMs.toFixed(0)}ms (${p.sampleCount} samples)`);
      }
    }
  }

  /** Get current stats */
  getStats(): OrchestratorStats {
    this.stats.uptime = this.isRunning ? Date.now() - this.startTime : 0;
    return { ...this.stats };
  }

  /** Get execution history */
  getExecutionHistory(): ExecutionResult[] {
    return [...this.executionResults];
  }

  /** Get component references for advanced usage */
  getComponents(): {
    connector: MultiExchangeConnector;
    aggregator: RealTimePriceAggregator;
    scanner: ArbitrageScanner;
    executor: ArbitrageExecutor;
    latencyOptimizer: LatencyOptimizer;
  } {
    return {
      connector: this.connector,
      aggregator: this.aggregator,
      scanner: this.scanner,
      executor: this.executor,
      latencyOptimizer: this.latencyOptimizer,
    };
  }
}
