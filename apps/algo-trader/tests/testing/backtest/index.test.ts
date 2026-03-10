import * as path from 'path';
import { HistoricalBacktestEngine } from '../../../src/testing/backtest/index';
import { DEFAULT_BACKTEST_CONFIG } from '../../../src/testing/backtest/backtest-config-types';

describe('HistoricalBacktestEngine', () => {
  it('instantiates without arguments', () => {
    const engine = new HistoricalBacktestEngine();
    expect(engine).toBeDefined();
  });

  it('instantiates with config path', () => {
    const engine = new HistoricalBacktestEngine('config.backtest.json');
    expect(engine).toBeDefined();
  });

  it('loadConfig returns default when file missing', async () => {
    const engine = new HistoricalBacktestEngine();
    const config = await engine.loadConfig('/nonexistent/path.json');
    expect(config.initialCapital).toBe(DEFAULT_BACKTEST_CONFIG.initialCapital);
    expect(config.riskFreeRate).toBe(DEFAULT_BACKTEST_CONFIG.riskFreeRate);
  });

  it('loadConfig reads existing JSON file', async () => {
    const engine = new HistoricalBacktestEngine();
    const configPath = path.resolve(
      __dirname,
      '../../../config.backtest.json',
    );
    const config = await engine.loadConfig(configPath);
    expect(config.initialCapital).toBe(100000);
    expect(config.outputFormat).toBe('html');
  });

  it('run with default config produces metrics', async () => {
    const engine = new HistoricalBacktestEngine();
    const smallConfig = {
      ...DEFAULT_BACKTEST_CONFIG,
      dateRange: { start: '2024-01-01', end: '2024-01-02' },
      phases: { test: { enabled: true, sandwichThreshold: 0.001 } },
      outputFormat: 'json' as const,
      batchSize: 50,
    };
    const result = await engine.run(smallConfig);
    expect(result.metrics).toBeDefined();
    expect(typeof result.metrics.totalTrades).toBe('number');
    expect(typeof result.metrics.sharpeRatio).toBe('number');
  }, 30000);

  it('run with json format produces valid JSON report', async () => {
    const engine = new HistoricalBacktestEngine();
    const config = {
      ...DEFAULT_BACKTEST_CONFIG,
      dateRange: { start: '2024-01-01', end: '2024-01-01' },
      phases: {},
      outputFormat: 'json' as const,
      batchSize: 100,
    };
    const result = await engine.run(config);
    expect(() => JSON.parse(result.reportContent)).not.toThrow();
  }, 30000);

  it('run with csv format produces CSV report', async () => {
    const engine = new HistoricalBacktestEngine();
    const config = {
      ...DEFAULT_BACKTEST_CONFIG,
      dateRange: { start: '2024-01-01', end: '2024-01-01' },
      phases: {},
      outputFormat: 'csv' as const,
      batchSize: 100,
    };
    const result = await engine.run(config);
    expect(result.reportContent).toContain('entryTime');
  }, 30000);

  it('run returns reportPath string', async () => {
    const engine = new HistoricalBacktestEngine();
    const config = {
      ...DEFAULT_BACKTEST_CONFIG,
      dateRange: { start: '2024-01-01', end: '2024-01-01' },
      phases: {},
      outputFormat: 'json' as const,
      batchSize: 100,
    };
    const result = await engine.run(config);
    expect(typeof result.reportPath).toBe('string');
    expect(result.reportPath).toContain('backtest-');
  }, 30000);
});
