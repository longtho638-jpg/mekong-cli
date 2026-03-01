/**
 * Tests for Round 4: MultiExchangeConnector, RealTimePriceAggregator,
 * LatencyOptimizer, ArbitrageOrchestrator.
 */

import {
  MultiExchangeConnector,
  RealTimePriceAggregator,
  LatencyOptimizer,
  ArbitrageOrchestrator,
} from '@agencyos/vibe-arbitrage-engine';
import { ExchangeClientBase as ExchangeClient } from '@agencyos/trading-core/exchanges';
import { IOrder, IBalance } from '../interfaces/IExchange';

// ---- Mock Exchange Client ----

class MockExchangeClient extends ExchangeClient {
  private mockPrice: number;
  connectCalled = false;

  constructor(name: string, price: number) {
    super('binance', 'test-key-1234567890', 'test-secret-1234567890');
    (this as { name: string }).name = name;
    this.mockPrice = price;
  }

  async connect(): Promise<void> {
    this.connectCalled = true;
  }

  async fetchTicker(_symbol: string): Promise<number> {
    return this.mockPrice;
  }

  async createMarketOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<IOrder> {
    return {
      id: `mock-${Date.now()}`,
      symbol,
      side,
      amount,
      price: this.mockPrice,
      status: 'closed',
      timestamp: Date.now(),
    };
  }

  async fetchBalance(): Promise<Record<string, IBalance>> {
    return {
      USDT: { currency: 'USDT', free: 10000, used: 0, total: 10000 },
      BTC: { currency: 'BTC', free: 1, used: 0, total: 1 },
    };
  }

  setPrice(price: number): void {
    this.mockPrice = price;
  }
}

// ---- MultiExchangeConnector Tests ----

describe('MultiExchangeConnector', () => {
  test('registers and connects exchanges', async () => {
    const connector = new MultiExchangeConnector();
    connector.addExchange({ id: 'binance', enabled: true, label: 'binance' });
    connector.addExchange({ id: 'okx', enabled: true, label: 'okx' });

    // Replace internal clients with mocks
    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));
    clients.set('okx', new MockExchangeClient('okx', 50300));

    const connected = await connector.connectAll();
    expect(connected.length).toBe(2);
    expect(connected).toContain('binance');
    expect(connected).toContain('okx');

    connector.shutdown();
  });

  test('skips disabled exchanges', () => {
    const connector = new MultiExchangeConnector();
    connector.addExchange({ id: 'binance', enabled: false, label: 'binance' });

    expect(connector.getExchangeNames().length).toBe(0);
    connector.shutdown();
  });

  test('getActiveClients returns only connected exchanges', async () => {
    const connector = new MultiExchangeConnector();
    connector.addExchange({ id: 'binance', enabled: true, label: 'binance' });
    connector.addExchange({ id: 'okx', enabled: true, label: 'okx' });

    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));
    clients.set('okx', new MockExchangeClient('okx', 50300));

    await connector.connectAll();

    const active = connector.getActiveClients();
    expect(active.size).toBe(2);

    connector.shutdown();
  });

  test('getHealthStatus returns health for all exchanges', async () => {
    const connector = new MultiExchangeConnector();
    connector.addExchange({ id: 'binance', enabled: true, label: 'binance' });

    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));

    await connector.connectAll();

    const health = connector.getHealthStatus();
    expect(health.length).toBe(1);
    expect(health[0].exchange).toBe('binance');
    expect(health[0].connected).toBe(true);

    connector.shutdown();
  });

  test('isHealthy returns correct status', async () => {
    const connector = new MultiExchangeConnector();
    connector.addExchange({ id: 'binance', enabled: true, label: 'binance' });

    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));

    await connector.connectAll();
    expect(connector.isHealthy('binance')).toBe(true);
    expect(connector.isHealthy('nonexistent')).toBe(false);

    connector.shutdown();
  });

  test('fetchAllBalances returns balances per exchange', async () => {
    const connector = new MultiExchangeConnector();
    connector.addExchange({ id: 'binance', enabled: true, label: 'binance' });

    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));

    await connector.connectAll();

    const balances = await connector.fetchAllBalances();
    expect(balances.has('binance')).toBe(true);
    expect(balances.get('binance')!['USDT'].total).toBe(10000);

    connector.shutdown();
  });

  test('shutdown clears all state', async () => {
    const connector = new MultiExchangeConnector();
    connector.addExchange({ id: 'binance', enabled: true, label: 'binance' });

    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));

    await connector.connectAll();
    connector.shutdown();

    expect(connector.getActiveCount()).toBe(0);
    expect(connector.getExchangeNames().length).toBe(0);
  });
});

// ---- RealTimePriceAggregator Tests ----

describe('RealTimePriceAggregator', () => {
  test('requires minimum exchanges', () => {
    const agg = new RealTimePriceAggregator({ minExchanges: 2 });
    agg.addExchange('binance', new MockExchangeClient('binance', 50000));
    agg.setSymbols(['BTC/USDT']);

    expect(() => agg.start()).toThrow('at least 2 exchanges');
    agg.stop();
  });

  test('requires symbols to be configured', () => {
    const agg = new RealTimePriceAggregator();
    agg.addExchange('a', new MockExchangeClient('a', 50000));
    agg.addExchange('b', new MockExchangeClient('b', 50300));

    expect(() => agg.start()).toThrow('No symbols configured');
    agg.stop();
  });

  test('polls and aggregates prices from multiple exchanges', async () => {
    const agg = new RealTimePriceAggregator({ minExchanges: 2 });
    agg.addExchange('binance', new MockExchangeClient('binance', 50000));
    agg.addExchange('okx', new MockExchangeClient('okx', 50300));
    agg.setSymbols(['BTC/USDT']);

    const results = await agg.pollAll();

    expect(results.length).toBe(1);
    expect(results[0].symbol).toBe('BTC/USDT');
    expect(results[0].tickCount).toBe(2);
    expect(results[0].bestBid.exchange).toBe('binance');
    expect(results[0].bestBid.price).toBe(50000);
    expect(results[0].bestAsk.exchange).toBe('okx');
    expect(results[0].bestAsk.price).toBe(50300);
    expect(results[0].spreadPercent).toBeCloseTo(0.6, 1);

    agg.stop();
  });

  test('computes VWAP as average of prices', async () => {
    const agg = new RealTimePriceAggregator({ minExchanges: 2 });
    agg.addExchange('a', new MockExchangeClient('a', 100));
    agg.addExchange('b', new MockExchangeClient('b', 200));
    agg.setSymbols(['ETH/USDT']);

    const results = await agg.pollAll();
    expect(results[0].vwap).toBe(150); // (100 + 200) / 2

    agg.stop();
  });

  test('notifies listeners on update', async () => {
    const agg = new RealTimePriceAggregator({ minExchanges: 2 });
    agg.addExchange('a', new MockExchangeClient('a', 3000));
    agg.addExchange('b', new MockExchangeClient('b', 3050));
    agg.setSymbols(['ETH/USDT']);

    const received: { symbol: string }[] = [];
    agg.onUpdate(p => received.push({ symbol: p.symbol }));

    await agg.pollAll();
    expect(received.length).toBe(1);
    expect(received[0].symbol).toBe('ETH/USDT');

    agg.stop();
  });

  test('handles multiple symbols', async () => {
    const agg = new RealTimePriceAggregator({ minExchanges: 2 });
    agg.addExchange('a', new MockExchangeClient('a', 50000));
    agg.addExchange('b', new MockExchangeClient('b', 50500));
    agg.setSymbols(['BTC/USDT', 'ETH/USDT']);

    const results = await agg.pollAll();
    expect(results.length).toBe(2);

    agg.stop();
  });

  test('getLatest returns last aggregate', async () => {
    const agg = new RealTimePriceAggregator({ minExchanges: 2 });
    agg.addExchange('a', new MockExchangeClient('a', 50000));
    agg.addExchange('b', new MockExchangeClient('b', 50300));
    agg.setSymbols(['BTC/USDT']);

    await agg.pollAll();

    const latest = agg.getLatest('BTC/USDT');
    expect(latest).toBeDefined();
    expect(latest!.tickCount).toBe(2);

    agg.stop();
  });

  test('hasMinimumData reports correctly', async () => {
    const agg = new RealTimePriceAggregator({ minExchanges: 2 });
    agg.addExchange('a', new MockExchangeClient('a', 50000));
    agg.addExchange('b', new MockExchangeClient('b', 50300));
    agg.setSymbols(['BTC/USDT']);

    expect(agg.hasMinimumData('BTC/USDT')).toBe(false);

    await agg.pollAll();
    expect(agg.hasMinimumData('BTC/USDT')).toBe(true);

    agg.stop();
  });

  test('getTotalPolls tracks poll count', async () => {
    const agg = new RealTimePriceAggregator({ minExchanges: 2 });
    agg.addExchange('a', new MockExchangeClient('a', 50000));
    agg.addExchange('b', new MockExchangeClient('b', 50300));
    agg.setSymbols(['BTC/USDT']);

    await agg.pollAll();
    await agg.pollAll();
    expect(agg.getTotalPolls()).toBe(2);

    agg.stop();
  });
});

// ---- LatencyOptimizer Tests ----

describe('LatencyOptimizer', () => {
  test('records and retrieves latency profile', () => {
    const opt = new LatencyOptimizer();
    opt.record('binance', 45, 'ticker', true);
    opt.record('binance', 55, 'ticker', true);
    opt.record('binance', 30, 'order', true);

    const profile = opt.getProfile('binance');
    expect(profile.exchange).toBe('binance');
    expect(profile.sampleCount).toBe(3);
    expect(profile.avgTickerMs).toBe(50); // (45 + 55) / 2
    expect(profile.avgOrderMs).toBe(30);
    expect(profile.successRate).toBe(100);
  });

  test('returns empty profile for unknown exchange', () => {
    const opt = new LatencyOptimizer();
    const profile = opt.getProfile('unknown');
    expect(profile.sampleCount).toBe(0);
    expect(profile.avgTickerMs).toBe(0);
  });

  test('computes percentiles correctly', () => {
    const opt = new LatencyOptimizer();
    // Add 10 records with increasing latency
    for (let i = 1; i <= 10; i++) {
      opt.record('binance', i * 10, 'ticker', true);
    }

    const profile = opt.getProfile('binance');
    expect(profile.p50Ms).toBe(50); // 5th value
    expect(profile.p95Ms).toBe(100); // ~10th value
  });

  test('rankBySpeed sorts exchanges fastest first', () => {
    const opt = new LatencyOptimizer();
    opt.record('slow', 200, 'ticker', true);
    opt.record('fast', 20, 'ticker', true);
    opt.record('medium', 100, 'ticker', true);

    const ranked = opt.rankBySpeed(['slow', 'fast', 'medium']);
    expect(ranked[0]).toBe('fast');
    expect(ranked[2]).toBe('slow');
  });

  test('selectFastestPair returns estimated total time', () => {
    const opt = new LatencyOptimizer();
    opt.record('binance', 30, 'order', true);
    opt.record('okx', 60, 'order', true);

    const pair = opt.selectFastestPair('binance', 'okx');
    expect(pair.estimatedTotalMs).toBe(60); // max(30, 60) since parallel
  });

  test('meetsTarget checks against maxAcceptableMs', () => {
    const opt = new LatencyOptimizer({ maxAcceptableMs: 100 });

    // No data = assume OK
    expect(opt.meetsTarget('unknown')).toBe(true);

    // Fast exchange
    opt.record('fast', 50, 'ticker', true);
    expect(opt.meetsTarget('fast')).toBe(true);

    // Slow exchange
    opt.record('slow', 200, 'ticker', true);
    expect(opt.meetsTarget('slow')).toBe(false);
  });

  test('canAchieveTarget checks system capability', () => {
    const opt = new LatencyOptimizer({ targetExecutionMs: 100 });
    expect(opt.canAchieveTarget()).toBe(false); // No data

    opt.record('a', 50, 'ticker', true);
    opt.record('b', 80, 'ticker', true);
    expect(opt.canAchieveTarget()).toBe(true);
  });

  test('tracks success rate', () => {
    const opt = new LatencyOptimizer();
    opt.record('binance', 50, 'ticker', true);
    opt.record('binance', 100, 'ticker', false);

    const profile = opt.getProfile('binance');
    expect(profile.successRate).toBe(50);
  });

  test('trims history to configured max size', () => {
    const opt = new LatencyOptimizer({ historySize: 5 });
    for (let i = 0; i < 10; i++) {
      opt.record('binance', i * 10, 'ticker', true);
    }

    const profile = opt.getProfile('binance');
    expect(profile.sampleCount).toBe(5);
  });

  test('reset clears all history', () => {
    const opt = new LatencyOptimizer();
    opt.record('binance', 50, 'ticker', true);
    opt.reset();

    expect(opt.getSummary().length).toBe(0);
  });

  test('getSummary returns all exchange profiles', () => {
    const opt = new LatencyOptimizer();
    opt.record('a', 50, 'ticker', true);
    opt.record('b', 80, 'ticker', true);

    const summary = opt.getSummary();
    expect(summary.length).toBe(2);
  });
});

// ---- ArbitrageOrchestrator Tests ----

describe('ArbitrageOrchestrator', () => {
  test('creates with default config', () => {
    const orch = new ArbitrageOrchestrator();
    const stats = orch.getStats();
    expect(stats.status).toBe('idle');
    expect(stats.totalCycles).toBe(0);
  });

  test('getComponents returns all sub-components', () => {
    const orch = new ArbitrageOrchestrator();
    const components = orch.getComponents();

    expect(components.connector).toBeDefined();
    expect(components.aggregator).toBeDefined();
    expect(components.scanner).toBeDefined();
    expect(components.executor).toBeDefined();
    expect(components.latencyOptimizer).toBeDefined();
  });

  test('init fails with less than 2 connected exchanges', async () => {
    const orch = new ArbitrageOrchestrator({
      exchanges: [{ id: 'binance', enabled: true, label: 'binance' }],
      symbols: ['BTC/USDT'],
    });

    // Replace internal connector's client with mock
    const connector = orch.getComponents().connector;
    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));

    await expect(orch.init()).rejects.toThrow('at least 2 exchanges');
  });

  test('init succeeds with 2+ exchanges', async () => {
    const orch = new ArbitrageOrchestrator({
      exchanges: [
        { id: 'binance', enabled: true, label: 'binance' },
        { id: 'okx', enabled: true, label: 'okx' },
      ],
      symbols: ['BTC/USDT'],
    });

    // Replace connector clients with mocks
    const connector = orch.getComponents().connector;
    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));
    clients.set('okx', new MockExchangeClient('okx', 50300));

    await orch.init();

    const stats = orch.getStats();
    expect(stats.connectedExchanges).toBe(2);
  });

  test('stop sets status to stopped', async () => {
    const orch = new ArbitrageOrchestrator({
      exchanges: [
        { id: 'binance', enabled: true, label: 'binance' },
        { id: 'okx', enabled: true, label: 'okx' },
      ],
      symbols: ['BTC/USDT'],
    });

    const connector = orch.getComponents().connector;
    const clients = (connector as unknown as { clients: Map<string, ExchangeClient> }).clients;
    clients.set('binance', new MockExchangeClient('binance', 50000));
    clients.set('okx', new MockExchangeClient('okx', 50300));

    await orch.init();
    orch.stop();

    expect(orch.getStats().status).toBe('stopped');
  });

  test('getExecutionHistory is initially empty', () => {
    const orch = new ArbitrageOrchestrator();
    expect(orch.getExecutionHistory().length).toBe(0);
  });
});
