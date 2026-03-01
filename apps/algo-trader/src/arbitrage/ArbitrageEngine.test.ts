/**
 * Tests for ArbitrageScanner + ArbitrageExecutor.
 */

import { ArbitrageScanner, ArbitrageOpportunity } from '@agencyos/vibe-arbitrage-engine';
import { ArbitrageExecutor } from '@agencyos/vibe-arbitrage-engine';
import { ExchangeClientBase as ExchangeClient } from '@agencyos/trading-core/exchanges';
import { IOrder, IBalance } from '../interfaces/IExchange';

// ---- Mock Exchange Client ----

class MockExchangeClient extends ExchangeClient {
  private mockPrice: number;
  private mockBalance: Record<string, IBalance>;
  connectCalled = false;

  constructor(name: string, price: number) {
    // Pass dummy keys — we override all methods
    super('binance', 'test-key-1234567890', 'test-secret-1234567890');
    (this as { name: string }).name = name;
    this.mockPrice = price;
    this.mockBalance = {
      USDT: { currency: 'USDT', free: 10000, used: 0, total: 10000 },
      BTC: { currency: 'BTC', free: 1, used: 0, total: 1 },
    };
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
    return this.mockBalance;
  }

  setPrice(price: number): void {
    this.mockPrice = price;
  }
}

// ---- ArbitrageScanner Tests ----

describe('ArbitrageScanner', () => {
  test('requires at least 2 exchanges', async () => {
    const scanner = new ArbitrageScanner();
    scanner.addExchange('binance', new MockExchangeClient('binance', 50000));
    await expect(scanner.start()).rejects.toThrow('at least 2 exchanges');
  });

  test('detects spread between exchanges', async () => {
    const scanner = new ArbitrageScanner({
      symbols: ['BTC/USDT'],
      minSpreadPercent: 0.1,
      feeRatePerSide: 0.001,
      slippageBps: 5,
      positionSizeUsd: 1000,
    });

    // Binance: $50000, OKX: $50300 → 0.6% spread
    scanner.addExchange('binance', new MockExchangeClient('binance', 50000));
    scanner.addExchange('okx', new MockExchangeClient('okx', 50300));

    // Don't start the loop, just poll once
    // Manually connect
    const exchanges = (scanner as unknown as { exchanges: Map<string, MockExchangeClient> }).exchanges;
    for (const [, client] of exchanges) await client.connect();
    (scanner as unknown as { isRunning: boolean }).isRunning = true;

    const opps = await scanner.poll();

    expect(opps.length).toBe(1);
    expect(opps[0].buyExchange).toBe('binance');
    expect(opps[0].sellExchange).toBe('okx');
    expect(opps[0].spreadPercent).toBeCloseTo(0.6, 1);
    expect(opps[0].netProfitPercent).toBeGreaterThan(0);
    expect(opps[0].estimatedProfitUsd).toBeGreaterThan(0);

    scanner.stop();
  });

  test('ignores spread below minimum threshold', async () => {
    const scanner = new ArbitrageScanner({
      symbols: ['BTC/USDT'],
      minSpreadPercent: 1.0, // High threshold
    });

    // 0.1% spread — below threshold
    scanner.addExchange('binance', new MockExchangeClient('binance', 50000));
    scanner.addExchange('okx', new MockExchangeClient('okx', 50050));

    const exchanges = (scanner as unknown as { exchanges: Map<string, MockExchangeClient> }).exchanges;
    for (const [, client] of exchanges) await client.connect();
    (scanner as unknown as { isRunning: boolean }).isRunning = true;

    const opps = await scanner.poll();
    expect(opps.length).toBe(0);

    scanner.stop();
  });

  test('filters out unprofitable spreads after fees', async () => {
    const scanner = new ArbitrageScanner({
      symbols: ['BTC/USDT'],
      minSpreadPercent: 0.05,
      feeRatePerSide: 0.001, // 0.1% per side = 0.2% total
      slippageBps: 10,        // 0.1% total = 0.2% slippage
      // Total costs: 0.4% → spread must be > 0.4%
    });

    // 0.15% spread — below cost threshold
    scanner.addExchange('binance', new MockExchangeClient('binance', 50000));
    scanner.addExchange('okx', new MockExchangeClient('okx', 50075));

    const exchanges = (scanner as unknown as { exchanges: Map<string, MockExchangeClient> }).exchanges;
    for (const [, client] of exchanges) await client.connect();
    (scanner as unknown as { isRunning: boolean }).isRunning = true;

    const opps = await scanner.poll();
    expect(opps.length).toBe(0); // Not profitable after fees

    scanner.stop();
  });

  test('notifies listeners on opportunity', async () => {
    const scanner = new ArbitrageScanner({
      symbols: ['ETH/USDT'],
      minSpreadPercent: 0.1,
      feeRatePerSide: 0.0005,
      slippageBps: 2,
    });

    scanner.addExchange('binance', new MockExchangeClient('binance', 3000));
    scanner.addExchange('bybit', new MockExchangeClient('bybit', 3020)); // 0.67% spread

    const received: ArbitrageOpportunity[] = [];
    scanner.onOpportunity(opp => received.push(opp));

    const exchanges = (scanner as unknown as { exchanges: Map<string, MockExchangeClient> }).exchanges;
    for (const [, client] of exchanges) await client.connect();
    (scanner as unknown as { isRunning: boolean }).isRunning = true;

    await scanner.poll();

    expect(received.length).toBe(1);
    expect(received[0].symbol).toBe('ETH/USDT');

    scanner.stop();
  });

  test('tracks statistics correctly', async () => {
    const scanner = new ArbitrageScanner({
      symbols: ['BTC/USDT'],
      minSpreadPercent: 0.1,
      feeRatePerSide: 0.0005,
      slippageBps: 2,
    });

    scanner.addExchange('a', new MockExchangeClient('a', 50000));
    scanner.addExchange('b', new MockExchangeClient('b', 50500));

    const exchanges = (scanner as unknown as { exchanges: Map<string, MockExchangeClient> }).exchanges;
    for (const [, client] of exchanges) await client.connect();
    (scanner as unknown as { isRunning: boolean }).isRunning = true;

    await scanner.poll();
    await scanner.poll();

    const stats = scanner.getStats();
    expect(stats.totalPolls).toBe(2);
    expect(stats.opportunitiesFound).toBe(2);
    expect(stats.avgLatencyMs).toBeGreaterThanOrEqual(0);

    scanner.stop();
  });

  test('handles multiple symbols', async () => {
    const scanner = new ArbitrageScanner({
      symbols: ['BTC/USDT', 'ETH/USDT'],
      minSpreadPercent: 0.1,
      feeRatePerSide: 0.0005,
      slippageBps: 2,
    });

    const binance = new MockExchangeClient('binance', 50000);
    const okx = new MockExchangeClient('okx', 50500);

    scanner.addExchange('binance', binance);
    scanner.addExchange('okx', okx);

    const exchanges = (scanner as unknown as { exchanges: Map<string, MockExchangeClient> }).exchanges;
    for (const [, client] of exchanges) await client.connect();
    (scanner as unknown as { isRunning: boolean }).isRunning = true;

    const opps = await scanner.poll();
    // Both symbols should have opportunities (same price for both since mock returns same price)
    expect(opps.length).toBe(2);

    scanner.stop();
  });
});

// ---- ArbitrageExecutor Tests ----

describe('ArbitrageExecutor', () => {
  function makeOpp(overrides?: Partial<ArbitrageOpportunity>): ArbitrageOpportunity {
    return {
      symbol: 'BTC/USDT',
      buyExchange: 'binance',
      sellExchange: 'okx',
      buyPrice: 50000,
      sellPrice: 50300,
      spreadPercent: 0.6,
      netProfitPercent: 0.4,
      estimatedProfitUsd: 4,
      timestamp: Date.now(),
      latency: { buy: 50, sell: 60 },
      ...overrides,
    };
  }

  test('executes arbitrage trade successfully', async () => {
    const executor = new ArbitrageExecutor({ maxPositionSizeUsd: 1000 });
    executor.addExchange('binance', new MockExchangeClient('binance', 50000));
    executor.addExchange('okx', new MockExchangeClient('okx', 50300));

    const result = await executor.execute(makeOpp());

    expect(result.success).toBe(true);
    expect(result.buyOrder).not.toBeNull();
    expect(result.sellOrder).not.toBeNull();
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  test('rejects when max concurrent trades reached', async () => {
    const executor = new ArbitrageExecutor({ maxConcurrentTrades: 0 });
    executor.addExchange('binance', new MockExchangeClient('binance', 50000));
    executor.addExchange('okx', new MockExchangeClient('okx', 50300));

    const result = await executor.execute(makeOpp());
    expect(result.success).toBe(false);
    expect(result.error).toContain('max_concurrent');
  });

  test('rejects when daily loss limit hit', async () => {
    const executor = new ArbitrageExecutor({ maxDailyLossUsd: 10 });
    executor.addExchange('binance', new MockExchangeClient('binance', 50000));
    executor.addExchange('okx', new MockExchangeClient('okx', 50300));

    // Simulate loss
    (executor as unknown as { dailyPnL: number }).dailyPnL = -15;

    const result = await executor.execute(makeOpp());
    expect(result.success).toBe(false);
    expect(result.error).toContain('daily_loss_limit');
  });

  test('rejects when profit below minimum', async () => {
    const executor = new ArbitrageExecutor({ minNetProfitUsd: 100 });
    executor.addExchange('binance', new MockExchangeClient('binance', 50000));
    executor.addExchange('okx', new MockExchangeClient('okx', 50300));

    const result = await executor.execute(makeOpp({ estimatedProfitUsd: 0.5 }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('profit');
  });

  test('rejects during cooldown', async () => {
    const executor = new ArbitrageExecutor({ cooldownMs: 60000 });
    executor.addExchange('binance', new MockExchangeClient('binance', 50000));
    executor.addExchange('okx', new MockExchangeClient('okx', 50300));

    // Simulate recent trade
    (executor as unknown as { lastTradeTime: Map<string, number> }).lastTradeTime.set('BTC/USDT', Date.now());

    const result = await executor.execute(makeOpp());
    expect(result.success).toBe(false);
    expect(result.error).toBe('cooldown_active');
  });

  test('rejects when exchange not found', async () => {
    const executor = new ArbitrageExecutor();
    // No exchanges added

    const result = await executor.execute(makeOpp());
    expect(result.success).toBe(false);
    expect(result.error).toContain('exchange_not_found');
  });

  test('getDashboard returns correct stats', async () => {
    const executor = new ArbitrageExecutor({ maxPositionSizeUsd: 500, cooldownMs: 0 });
    executor.addExchange('binance', new MockExchangeClient('binance', 50000));
    executor.addExchange('okx', new MockExchangeClient('okx', 50300));

    await executor.execute(makeOpp());
    await executor.execute(makeOpp({ estimatedProfitUsd: 5 }));

    const dashboard = executor.getDashboard();
    expect(dashboard.totalTrades).toBe(2);
    expect(typeof dashboard.netProfitUsd).toBe('number');
    expect(typeof dashboard.avgExecutionMs).toBe('number');
    expect(typeof dashboard.winRate).toBe('number');
  });

  test('getTradeLog returns trade history', async () => {
    const executor = new ArbitrageExecutor({ maxPositionSizeUsd: 500 });
    executor.addExchange('binance', new MockExchangeClient('binance', 50000));
    executor.addExchange('okx', new MockExchangeClient('okx', 50300));

    await executor.execute(makeOpp());

    const log = executor.getTradeLog();
    expect(log.length).toBe(1);
    expect(log[0].symbol).toBe('BTC/USDT');
    expect(log[0].buyExchange).toBe('binance');
    expect(log[0].sellExchange).toBe('okx');
    expect(log[0].id).toBe(1);
  });

  test('resetDaily clears daily P&L', async () => {
    const executor = new ArbitrageExecutor();
    (executor as unknown as { dailyPnL: number }).dailyPnL = -30;

    executor.resetDaily();

    // Should allow trading again after reset
    executor.addExchange('binance', new MockExchangeClient('binance', 50000));
    executor.addExchange('okx', new MockExchangeClient('okx', 50300));
    const result = await executor.execute(makeOpp());
    expect(result.success).toBe(true);
  });

  test('printDashboard does not throw', async () => {
    const executor = new ArbitrageExecutor();
    expect(() => executor.printDashboard()).not.toThrow();
  });
});
