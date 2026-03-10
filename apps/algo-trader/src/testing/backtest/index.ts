/**
 * Historical Backtest Engine - Main Entry Point
 * Orchestrates the full backtest pipeline: load → simulate → metrics → report
 */

import * as fs from 'fs';
import * as path from 'path';
import { BacktestConfig, DEFAULT_BACKTEST_CONFIG } from './backtest-config-types';
import { DataLoader } from './data-loader';
import { SimulationEngine } from './simulation-engine';
import { StrategyLoader } from './strategy-loader';
import { StateManager } from './state-manager';
import { MetricsCollector } from './metrics-collector';
import { ReportGenerator } from './report-generator';
import { BacktestMetricsReport } from './metrics-collector';

export class HistoricalBacktestEngine {
  private configPath?: string;

  constructor(configPath?: string) {
    this.configPath = configPath;
  }

  async loadConfig(configPath: string): Promise<BacktestConfig> {
    const resolved = path.resolve(configPath);
    if (!fs.existsSync(resolved)) {
      return { ...DEFAULT_BACKTEST_CONFIG };
    }
    const raw = fs.readFileSync(resolved, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BacktestConfig>;
    return { ...DEFAULT_BACKTEST_CONFIG, ...parsed };
  }

  async run(config?: BacktestConfig): Promise<{
    metrics: BacktestMetricsReport;
    reportPath: string;
    reportContent: string;
  }> {
    // Resolve config
    let resolvedConfig = config;
    if (!resolvedConfig) {
      resolvedConfig = this.configPath
        ? await this.loadConfig(this.configPath)
        : { ...DEFAULT_BACKTEST_CONFIG };
    }

    // 1. Load data
    const dataLoader = new DataLoader(resolvedConfig);
    const events = await dataLoader.loadData();

    // 2. Load strategies
    const strategyLoader = new StrategyLoader(resolvedConfig.phases);
    const strategies = await strategyLoader.loadStrategies();

    // 3. Initialize state and metrics
    const stateManager = new StateManager(resolvedConfig.initialCapital);
    const metricsCollector = new MetricsCollector(resolvedConfig.riskFreeRate);

    // 4. Run simulation
    const simEngine = new SimulationEngine(
      {
        latencyMs: resolvedConfig.latencyMs ?? 50,
        batchSize: resolvedConfig.batchSize ?? 1000,
        deterministicSeed: 42,
        fees: resolvedConfig.fees,
      },
      stateManager,
      metricsCollector,
    );

    await simEngine.runSimulation(events, strategies);

    // 5. Compute metrics
    const metrics = metricsCollector.computeMetrics();

    // 6. Generate report
    const reportGen = new ReportGenerator(resolvedConfig.outputFormat);
    const state = stateManager.getState();
    const reportContent = await reportGen.generateReport(
      metrics,
      metricsCollector.getTrades(),
      state.equityCurve,
      resolvedConfig,
    );

    // 7. Write report file
    const ext = resolvedConfig.outputFormat;
    const reportDir = path.resolve('reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, `backtest-${Date.now()}.${ext}`);
    fs.writeFileSync(reportPath, reportContent, 'utf-8');

    return { metrics, reportPath, reportContent };
  }
}

// Re-exports
export { DataLoader } from './data-loader';
export { SimulationEngine } from './simulation-engine';
export { StrategyLoader } from './strategy-loader';
export { StateManager } from './state-manager';
export { MetricsCollector } from './metrics-collector';
export { ReportGenerator } from './report-generator';
export { ParameterOptimizer } from './parameter-optimizer';
export type { BacktestConfig, PhaseConfig, FeeConfig } from './backtest-config-types';
export type { MarketDataEvent } from './data-loader';
export type { StrategyInstance } from './strategy-loader';
export type { PortfolioState, Position, Order, EquityPoint } from './state-manager';
export type { BacktestMetricsReport } from './metrics-collector';
export type { SimulationConfig } from './simulation-engine';
export type { OptimizationResult } from './parameter-optimizer';
