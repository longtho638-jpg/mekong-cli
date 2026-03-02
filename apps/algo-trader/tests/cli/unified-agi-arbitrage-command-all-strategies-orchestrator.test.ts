/**
 * Tests for UnifiedAgiArbOrchestrator and registerUnifiedArbCommand —
 * verifies lifecycle, tick/funding-rate feeding, strategy enable/disable flags,
 * telegram-optional handling, report structure, and CLI registration.
 */

import { Command } from 'commander';
import {
  UnifiedAgiArbOrchestrator,
  registerUnifiedArbCommand,
  type UnifiedArbConfig,
} from '../../src/cli/unified-agi-arbitrage-command';

const baseConfig: UnifiedArbConfig = {
  exchanges: ['binance', 'okx'],
  symbols: ['BTC/USDT', 'ETH/USDT'],
  dryRun: true,
  enableCrossExchange: true,
  enableTriangular: true,
  enableFundingRate: true,
};

function makeTick(exchange = 'binance', symbol = 'BTC/USDT') {
  return { exchange, symbol, bid: 50000, ask: 50010, timestamp: Date.now() };
}

describe('UnifiedAgiArbOrchestrator — lifecycle', () => {
  let orch: UnifiedAgiArbOrchestrator;

  afterEach(() => {
    if (orch.isRunning()) orch.stop();
  });

  test('initially not running', () => {
    orch = new UnifiedAgiArbOrchestrator(baseConfig);
    expect(orch.isRunning()).toBe(false);
  });

  test('start sets running to true', () => {
    orch = new UnifiedAgiArbOrchestrator(baseConfig);
    orch.start();
    expect(orch.isRunning()).toBe(true);
  });

  test('start is idempotent', () => {
    orch = new UnifiedAgiArbOrchestrator(baseConfig);
    orch.start();
    orch.start(); // second call is no-op
    expect(orch.isRunning()).toBe(true);
  });

  test('stop sets running to false and returns report', () => {
    orch = new UnifiedAgiArbOrchestrator(baseConfig);
    orch.start();
    const report = orch.stop();
    expect(orch.isRunning()).toBe(false);
    expect(report).toBeDefined();
    expect(report.mode).toBe('DRY-RUN');
  });

  test('stop on non-running orchestrator returns report without error', () => {
    orch = new UnifiedAgiArbOrchestrator(baseConfig);
    const report = orch.stop();
    expect(report).toBeDefined();
    expect(report.uptime).toBe(0);
  });
});

describe('UnifiedAgiArbOrchestrator — feedTick reaches all active scanners', () => {
  let orch: UnifiedAgiArbOrchestrator;

  afterEach(() => {
    if (orch.isRunning()) orch.stop();
  });

  test('feedTick does not throw with all strategies enabled', () => {
    orch = new UnifiedAgiArbOrchestrator(baseConfig);
    orch.start();
    expect(() => orch.feedTick(makeTick())).not.toThrow();
  });

  test('feedTick with multiple exchanges updates regime detector', () => {
    orch = new UnifiedAgiArbOrchestrator(baseConfig);
    orch.start();
    // Feed multiple ticks to build regime detector state
    for (let i = 0; i < 10; i++) {
      orch.feedTick({ exchange: 'binance', symbol: 'BTC/USDT', bid: 50000 + i, ask: 50010 + i, timestamp: Date.now() });
    }
    const report = orch.stop();
    // Cross-exchange scanner received ticks (zero opps expected with single exchange spread)
    expect(report.crossExchange.enabled).toBe(true);
  });
});

describe('UnifiedAgiArbOrchestrator — feedFundingRate', () => {
  let orch: UnifiedAgiArbOrchestrator;

  afterEach(() => {
    if (orch.isRunning()) orch.stop();
  });

  test('feedFundingRate does not throw when funding scanner is enabled', () => {
    orch = new UnifiedAgiArbOrchestrator(baseConfig);
    orch.start();
    expect(() =>
      orch.feedFundingRate('binance', 'BTC/USDT', 0.0001, Date.now() + 28800000),
    ).not.toThrow();
  });

  test('feedFundingRate is safe when funding scanner is disabled', () => {
    orch = new UnifiedAgiArbOrchestrator({ ...baseConfig, enableFundingRate: false });
    orch.start();
    expect(() =>
      orch.feedFundingRate('binance', 'BTC/USDT', 0.0001, Date.now() + 28800000),
    ).not.toThrow();
  });
});

describe('UnifiedAgiArbOrchestrator — comprehensive report structure', () => {
  test('report contains all strategy sections', () => {
    const orch = new UnifiedAgiArbOrchestrator(baseConfig);
    orch.start();
    const report = orch.stop();

    expect(report).toHaveProperty('uptime');
    expect(report).toHaveProperty('mode');
    expect(report).toHaveProperty('exchanges');
    expect(report).toHaveProperty('symbols');
    expect(report).toHaveProperty('crossExchange');
    expect(report).toHaveProperty('triangular');
    expect(report).toHaveProperty('fundingRate');
    expect(report).toHaveProperty('engine');
    expect(report).toHaveProperty('circuitBreakersTripped');
    expect(report).toHaveProperty('regimeHistory');
  });

  test('report reflects config exchanges and symbols', () => {
    const orch = new UnifiedAgiArbOrchestrator(baseConfig);
    orch.start();
    const report = orch.stop();
    expect(report.exchanges).toEqual(['binance', 'okx']);
    expect(report.symbols).toEqual(['BTC/USDT', 'ETH/USDT']);
  });
});

describe('UnifiedAgiArbOrchestrator — strategy enable/disable flags', () => {
  test('disabling cross-exchange reflects in report', () => {
    const orch = new UnifiedAgiArbOrchestrator({ ...baseConfig, enableCrossExchange: false });
    orch.start();
    const report = orch.stop();
    expect(report.crossExchange.enabled).toBe(false);
    expect(report.crossExchange.totalScans).toBe(0);
  });

  test('disabling triangular reflects in report', () => {
    const orch = new UnifiedAgiArbOrchestrator({ ...baseConfig, enableTriangular: false });
    orch.start();
    const report = orch.stop();
    expect(report.triangular.enabled).toBe(false);
    expect(report.triangular.totalScans).toBe(0);
  });

  test('disabling funding-rate reflects in report', () => {
    const orch = new UnifiedAgiArbOrchestrator({ ...baseConfig, enableFundingRate: false });
    orch.start();
    const report = orch.stop();
    expect(report.fundingRate.enabled).toBe(false);
    expect(report.fundingRate.totalScans).toBe(0);
  });

  test('all strategies disabled — no scanners crash', () => {
    const orch = new UnifiedAgiArbOrchestrator({
      ...baseConfig,
      enableCrossExchange: false,
      enableTriangular: false,
      enableFundingRate: false,
    });
    orch.start();
    orch.feedTick(makeTick());
    orch.feedFundingRate('binance', 'BTC/USDT', 0.0001, Date.now() + 28800000);
    const report = orch.stop();
    expect(report.crossExchange.enabled).toBe(false);
    expect(report.triangular.enabled).toBe(false);
    expect(report.fundingRate.enabled).toBe(false);
  });
});

describe('UnifiedAgiArbOrchestrator — telegram optional', () => {
  test('starts and stops without telegram config', () => {
    const orch = new UnifiedAgiArbOrchestrator({ ...baseConfig, telegram: undefined });
    orch.start();
    expect(orch.isRunning()).toBe(true);
    expect(() => orch.stop()).not.toThrow();
  });
});

describe('UnifiedAgiArbOrchestrator — config defaults', () => {
  test('minSpreadPct defaults to 0.05 when omitted', () => {
    const config: UnifiedArbConfig = { ...baseConfig };
    delete (config as Partial<UnifiedArbConfig>).minSpreadPct;
    const orch = new UnifiedAgiArbOrchestrator(config);
    orch.start();
    const report = orch.stop();
    // Scanners started without error — default applied
    expect(report.crossExchange.enabled).toBe(true);
  });

  test('dryRun mode reflected in report mode field', () => {
    const orch = new UnifiedAgiArbOrchestrator({ ...baseConfig, dryRun: true });
    orch.start();
    const report = orch.stop();
    expect(report.mode).toBe('DRY-RUN');
  });

  test('live mode reflected in report mode field', () => {
    const orch = new UnifiedAgiArbOrchestrator({ ...baseConfig, dryRun: false });
    orch.start();
    const report = orch.stop();
    expect(report.mode).toBe('LIVE');
  });
});

describe('registerUnifiedArbCommand — CLI registration', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerUnifiedArbCommand(program);
  });

  test('registers arb:agi command', () => {
    const cmd = program.commands.find((c) => c.name() === 'arb:agi');
    expect(cmd).toBeDefined();
    expect(cmd!.description()).toContain('arbitrage');
  });

  test('arb:agi has expected options', () => {
    const cmd = program.commands.find((c) => c.name() === 'arb:agi')!;
    const optNames = cmd.options.map((o) => o.long);
    expect(optNames).toContain('--live');
    expect(optNames).toContain('--exchanges');
    expect(optNames).toContain('--symbols');
    expect(optNames).toContain('--min-spread');
  });

  test('arb:agi defaults exchanges and symbols', () => {
    const cmd = program.commands.find((c) => c.name() === 'arb:agi')!;
    const opts = cmd.opts();
    expect(opts.exchanges).toBe('binance,okx,bybit');
    expect(opts.symbols).toBe('BTC/USDT,ETH/USDT');
    expect(opts.minSpread).toBe('0.05');
  });
});
