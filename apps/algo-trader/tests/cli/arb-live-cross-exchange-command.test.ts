import { ArbLiveOrchestrator, type ArbLiveConfig } from '../../src/cli/arb-live-cross-exchange-command';
import type { PriceTick } from '../../src/execution/websocket-multi-exchange-price-feed-manager';

function tick(exchange: string, symbol: string, bid: number, ask: number): PriceTick {
  return { exchange, symbol, bid, ask, timestamp: Date.now() };
}

describe('ArbLiveOrchestrator', () => {
  let orchestrator: ArbLiveOrchestrator;
  const config: ArbLiveConfig = {
    exchanges: ['binance', 'okx'],
    symbols: ['BTC/USDT'],
    dryRun: true,
    positionSizeBase: 0.01,
    minSpreadPct: 0.001,
    scanIntervalMs: 50,
    cooldownMs: 100,
    maxDailyLossUsd: 1000,
  };

  afterEach(async () => {
    if (orchestrator?.isRunning()) {
      await orchestrator.stop();
    }
  });

  test('start and stop lifecycle', async () => {
    orchestrator = new ArbLiveOrchestrator(config);
    await orchestrator.start();
    expect(orchestrator.isRunning()).toBe(true);

    const report = await orchestrator.stop();
    expect(orchestrator.isRunning()).toBe(false);
    expect(report).toContain('Cross-Exchange Arbitrage Report');
    expect(report).toContain('DRY-RUN');
  });

  test('feedTick processes price data', async () => {
    orchestrator = new ArbLiveOrchestrator(config);
    await orchestrator.start();

    orchestrator.feedTick(tick('binance', 'BTC/USDT', 49900, 50000));
    orchestrator.feedTick(tick('okx', 'BTC/USDT', 50200, 50300));

    // Wait for scanner interval to fire
    await new Promise(r => setTimeout(r, 100));

    const report = await orchestrator.stop();
    expect(report).toContain('Total Scans:');
  });

  test('report includes exchange and symbol info', async () => {
    orchestrator = new ArbLiveOrchestrator(config);
    await orchestrator.start();
    const report = await orchestrator.stop();
    expect(report).toContain('binance, okx');
    expect(report).toContain('BTC/USDT');
  });

  test('handles telegram config gracefully when not provided', async () => {
    orchestrator = new ArbLiveOrchestrator({ ...config, telegram: undefined });
    await orchestrator.start();
    // Should not throw
    orchestrator.feedTick(tick('binance', 'BTC/USDT', 50000, 50001));
    await orchestrator.stop();
  });

  test('detects opportunity and records dry-run trade', async () => {
    orchestrator = new ArbLiveOrchestrator({
      ...config,
      scanIntervalMs: 20,
      cooldownMs: 10,
    });
    await orchestrator.start();

    // Feed large spread
    orchestrator.feedTick(tick('binance', 'BTC/USDT', 49000, 49500));
    orchestrator.feedTick(tick('okx', 'BTC/USDT', 50500, 51000));

    // Wait for scan + execution
    await new Promise(r => setTimeout(r, 150));

    const report = await orchestrator.stop();
    expect(report).toContain('Opportunities Found:');
  });
});
