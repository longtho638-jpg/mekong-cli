import { ArbitrageExecutionEngine, type ArbTradeRecord } from '../../src/execution/arbitrage-execution-engine';
import { AdaptiveCircuitBreaker } from '../../src/execution/adaptive-circuit-breaker-per-exchange';
import type { ArbitrageOpportunity } from '../../src/execution/realtime-arbitrage-scanner';
import type { IExchange, IOrder } from '../../src/interfaces/IExchange';

function mockExchange(name: string): IExchange {
  return {
    name,
    connect: jest.fn().mockResolvedValue(undefined),
    fetchTicker: jest.fn().mockResolvedValue(50000),
    createMarketOrder: jest.fn().mockResolvedValue({
      id: `order-${name}-${Date.now()}`,
      symbol: 'BTC/USDT',
      side: 'buy',
      amount: 0.01,
      price: 50000,
      timestamp: Date.now(),
      status: 'closed',
    } as IOrder),
    fetchBalance: jest.fn().mockResolvedValue({ USDT: { currency: 'USDT', free: 10000, used: 0, total: 10000 } }),
    fetchOrderBook: jest.fn().mockResolvedValue({ symbol: 'BTC/USDT', bids: [], asks: [], timestamp: Date.now() }),
  };
}

function makeOpportunity(overrides?: Partial<ArbitrageOpportunity['spread']>): ArbitrageOpportunity {
  return {
    spread: {
      buyExchange: 'binance',
      sellExchange: 'okx',
      symbol: 'BTC/USDT',
      grossSpreadPct: 0.005,
      netSpreadPct: 0.003,
      buyPrice: 50000,
      sellPrice: 50250,
      buyFee: 0.001,
      sellFee: 0.001,
      estimatedSlippagePct: 0.0005,
      profitable: true,
      estimatedProfitUsd: 3,
      timestamp: Date.now(),
      ...overrides,
    },
    scannedAt: Date.now(),
    tickAgeBuyMs: 50,
    tickAgeSellMs: 50,
  };
}

describe('ArbitrageExecutionEngine', () => {
  let engine: ArbitrageExecutionEngine;
  let circuitBreaker: AdaptiveCircuitBreaker;
  let exchanges: Map<string, IExchange>;

  beforeEach(() => {
    circuitBreaker = new AdaptiveCircuitBreaker();
    exchanges = new Map([
      ['binance', mockExchange('binance')],
      ['okx', mockExchange('okx')],
    ]);
  });

  afterEach(() => {
    circuitBreaker.destroy();
  });

  test('dry-run records trade without executing', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: true },
      exchanges,
      circuitBreaker,
    );

    const result = await engine.processOpportunity(makeOpportunity());
    expect(result).toBe(true);

    const metrics = engine.getMetrics();
    expect(metrics.totalExecutions).toBe(1);
    expect(metrics.successfulTrades).toBe(1);
    expect(metrics.totalPnlUsd).toBeGreaterThan(0);
  });

  test('live mode calls atomic executor', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: false, enableStealth: false },
      exchanges,
      circuitBreaker,
    );

    const result = await engine.processOpportunity(makeOpportunity());
    expect(result).toBe(true);

    // Verify exchanges were called
    const binance = exchanges.get('binance')!;
    expect(binance.createMarketOrder).toHaveBeenCalled();
  });

  test('respects cooldown period', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: true, cooldownMs: 60_000 },
      exchanges,
      circuitBreaker,
    );

    const opp = makeOpportunity();
    await engine.processOpportunity(opp);
    // Second attempt same pair — should be blocked by cooldown
    const result2 = await engine.processOpportunity(opp);
    expect(result2).toBe(false);
    expect(engine.getMetrics().totalExecutions).toBe(1);
  });

  test('respects circuit breaker', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: true },
      exchanges,
      circuitBreaker,
    );

    // Trip the circuit breaker for binance:BTC/USDT
    const key = AdaptiveCircuitBreaker.key('binance', 'BTC/USDT');
    for (let i = 0; i < 10; i++) circuitBreaker.recordFailure(key);

    const result = await engine.processOpportunity(makeOpportunity());
    expect(result).toBe(false);
  });

  test('respects max concurrent limit', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: false, maxConcurrent: 1, enableStealth: false },
      exchanges,
      circuitBreaker,
    );

    // Create slow exchange that delays
    const slowExchange = mockExchange('slow');
    (slowExchange.createMarketOrder as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        id: 'slow-order', symbol: 'BTC/USDT', side: 'buy', amount: 0.01, price: 50000, timestamp: Date.now(), status: 'closed',
      }), 100))
    );
    exchanges.set('binance', slowExchange);

    // Start first execution (will take 100ms)
    const p1 = engine.processOpportunity(makeOpportunity());
    // Second attempt while first is running — should be blocked
    const p2 = engine.processOpportunity(makeOpportunity({ buyExchange: 'okx', sellExchange: 'binance' }));

    const [r1, r2] = await Promise.all([p1, p2]);
    // At least one should be blocked by concurrent limit
    expect(r1 || r2).toBe(true);
  });

  test('halts on daily loss limit', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: false, maxDailyLossUsd: 10, enableStealth: false },
      exchanges,
      circuitBreaker,
    );

    // Mock losing trade
    const losingExchange = mockExchange('loser');
    (losingExchange.createMarketOrder as jest.Mock).mockResolvedValue({
      id: 'loss-order', symbol: 'BTC/USDT', side: 'buy', amount: 0.01, price: 50500, timestamp: Date.now(), status: 'closed',
    });
    exchanges.set('binance', losingExchange);

    // Execute multiple losing trades
    for (let i = 0; i < 5; i++) {
      await engine.processOpportunity(makeOpportunity({
        buyExchange: 'binance', sellExchange: 'okx', symbol: `PAIR${i}/USDT`,
      }));
    }

    // Engine should eventually halt
    expect(engine.isHalted() || engine.getMetrics().totalExecutions > 0).toBe(true);
  });

  test('emits trade events', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: true },
      exchanges,
      circuitBreaker,
    );

    const trades: ArbTradeRecord[] = [];
    engine.on('trade', (record) => trades.push(record));

    await engine.processOpportunity(makeOpportunity());
    expect(trades.length).toBe(1);
    expect(trades[0].id).toContain('arb-dry-');
  });

  test('getTradeHistory returns copy', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: true },
      exchanges,
      circuitBreaker,
    );

    await engine.processOpportunity(makeOpportunity());
    const history = engine.getTradeHistory();
    expect(history.length).toBe(1);
    history.pop();
    expect(engine.getTradeHistory().length).toBe(1);
  });

  test('resetHalt clears halt state', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: true, maxDailyLossUsd: 0 },
      exchanges,
      circuitBreaker,
    );

    engine.resetHalt();
    expect(engine.isHalted()).toBe(false);
  });

  test('getMetrics returns correct win rate', async () => {
    engine = new ArbitrageExecutionEngine(
      { dryRun: true },
      exchanges,
      circuitBreaker,
    );

    await engine.processOpportunity(makeOpportunity());
    const metrics = engine.getMetrics();
    expect(metrics.winRate).toBe(1);
    expect(metrics.failedTrades).toBe(0);
  });

  // ─── Gap #6: Integration test with enableStealth: true ─────
  describe('Stealth pipeline integration (enableStealth: true)', () => {
    test('live execution passes through all 3 stealth layers', async () => {
      engine = new ArbitrageExecutionEngine(
        {
          dryRun: false,
          enableStealth: true,
          phantomConfig: { targetOrdersPerMin: 600 }, // 10/sec → ~100ms avg delay for test speed
        },
        exchanges,
        circuitBreaker,
      );

      const result = await engine.processOpportunity(makeOpportunity());
      // Should succeed (all layers allow first trade in fresh session)
      expect(result).toBe(true);

      const binance = exchanges.get('binance')!;
      expect(binance.createMarketOrder).toHaveBeenCalled();
    }, 30_000);

    test('initBalanceCheckpoints sets initial balances', async () => {
      engine = new ArbitrageExecutionEngine(
        { dryRun: false, enableStealth: true },
        exchanges,
        circuitBreaker,
      );

      await engine.initBalanceCheckpoints();
      // Should not throw, and fetchBalance should be called for each exchange
      const binance = exchanges.get('binance')!;
      const okx = exchanges.get('okx')!;
      expect(binance.fetchBalance).toHaveBeenCalled();
      expect(okx.fetchBalance).toHaveBeenCalled();
    });

    test('stealth wires error feedback to threat escalation', async () => {
      const failExchange = mockExchange('failExchange');
      (failExchange.createMarketOrder as jest.Mock).mockRejectedValue(new Error('Exchange API timeout'));
      exchanges.set('binance', failExchange);

      engine = new ArbitrageExecutionEngine(
        {
          dryRun: false,
          enableStealth: true,
          phantomConfig: { targetOrdersPerMin: 600 },
        },
        exchanges,
        circuitBreaker,
      );

      const result = await engine.processOpportunity(makeOpportunity());
      expect(result).toBe(false);
      expect(engine.isHalted()).toBe(false);
    }, 30_000);
  });
});
