/**
 * Tests for Nixpacks-inspired modules:
 * - StrategyProviderRegistry (provider trait system)
 * - TradingPlanBuilder (detect → plan → execute pipeline)
 * - ConfigCascade (strategy configuration resolution)
 */

import {
  StrategyProviderRegistry,
  StrategyProvider,
  DetectionContext,
} from './strategy-provider-registry';
import { TradingPlanBuilder } from './trading-build-plan';
import { resolveConfig, getProviderDefaults } from './strategy-config-cascade';

// --- Mock provider for testing ---
function createMockProvider(overrides?: Partial<StrategyProvider>): StrategyProvider {
  return {
    metadata: {
      id: 'test-rsi',
      name: 'Test RSI Strategy',
      version: '1.0.0',
      type: 'trend',
      supportedPairs: ['BTC/USDT', 'ETH/USDT'],
      supportedTimeframes: ['1h', '4h'],
      riskLevel: 'medium',
      description: 'Test RSI strategy',
      requiredIndicators: ['rsi'],
      minHistoryCandles: 50,
    },
    detect: (ctx: DetectionContext) =>
      ctx.pair === 'BTC/USDT' || ctx.pair === 'ETH/USDT',
    create: () => ({ name: 'TestRSI', onCandle: async () => null, init: async () => {} }),
    ...overrides,
  };
}

const defaultContext: DetectionContext = {
  pair: 'BTC/USDT',
  timeframe: '1h',
  exchangeId: 'binance',
};

// ==========================================
// StrategyProviderRegistry Tests
// ==========================================
describe('StrategyProviderRegistry', () => {
  let registry: StrategyProviderRegistry;

  beforeEach(() => {
    registry = new StrategyProviderRegistry();
  });

  test('register and retrieve provider', () => {
    const provider = createMockProvider();
    registry.register(provider);
    expect(registry.get('test-rsi')).toBe(provider);
    expect(registry.size).toBe(1);
  });

  test('throws on duplicate registration', () => {
    const provider = createMockProvider();
    registry.register(provider);
    expect(() => registry.register(provider)).toThrow('already registered');
  });

  test('list returns all provider metadata', () => {
    registry.register(createMockProvider());
    registry.register(createMockProvider({
      metadata: { ...createMockProvider().metadata, id: 'test-sma', name: 'Test SMA' },
    }));
    const list = registry.list();
    expect(list).toHaveLength(2);
    expect(list.map(m => m.id)).toEqual(['test-rsi', 'test-sma']);
  });

  test('detect finds matching providers', () => {
    registry.register(createMockProvider());
    registry.register(createMockProvider({
      metadata: { ...createMockProvider().metadata, id: 'no-match' },
      detect: () => false,
    }));

    const matches = registry.detect(defaultContext);
    expect(matches).toHaveLength(1);
    expect(matches[0].metadata.id).toBe('test-rsi');
  });

  test('filterByType returns correct providers', () => {
    registry.register(createMockProvider());
    registry.register(createMockProvider({
      metadata: { ...createMockProvider().metadata, id: 'arb-1', type: 'arbitrage' },
    }));

    expect(registry.filterByType('trend')).toHaveLength(1);
    expect(registry.filterByType('arbitrage')).toHaveLength(1);
    expect(registry.filterByType('momentum')).toHaveLength(0);
  });

  test('filterByPair supports wildcard', () => {
    registry.register(createMockProvider({
      metadata: { ...createMockProvider().metadata, id: 'wild', supportedPairs: ['*'] },
    }));
    const matches = registry.filterByPair('SOL/USDT');
    expect(matches).toHaveLength(1);
  });

  test('findBest prioritizes arbitrage over trend', () => {
    registry.register(createMockProvider());
    registry.register(createMockProvider({
      metadata: { ...createMockProvider().metadata, id: 'arb-best', type: 'arbitrage' },
      detect: () => true,
    }));

    const best = registry.findBest(defaultContext);
    expect(best?.metadata.id).toBe('arb-best');
  });

  test('get returns undefined for missing provider', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });
});

// ==========================================
// TradingPlanBuilder Tests
// ==========================================
describe('TradingPlanBuilder', () => {
  const provider = createMockProvider();

  test('generates plan with correct structure', () => {
    const plan = TradingPlanBuilder.generatePlan(provider, defaultContext);

    expect(plan.id).toContain('plan-');
    expect(plan.id).toContain('test-rsi');
    expect(plan.selectedProvider.id).toBe('test-rsi');
    expect(plan.setup.exchangeIds).toEqual(['binance']);
    expect(plan.setup.pairs).toEqual(['BTC/USDT']);
    expect(plan.install.strategyId).toBe('test-rsi');
    expect(plan.install.indicators).toEqual(['rsi']);
    expect(plan.build.riskLimits.maxPositionSizeUsd).toBe(500);
    expect(plan.start.mode).toBe('paper');
    expect(plan.start.enableCircuitBreaker).toBe(true);
  });

  test('applies overrides correctly', () => {
    const plan = TradingPlanBuilder.generatePlan(provider, defaultContext, {
      maxPositionSizeUsd: 1000,
      mode: 'live',
      pollIntervalMs: 5000,
    });

    expect(plan.build.riskLimits.maxPositionSizeUsd).toBe(1000);
    expect(plan.start.mode).toBe('live');
    expect(plan.start.pollIntervalMs).toBe(5000);
  });

  test('serialize and deserialize round-trip', () => {
    const plan = TradingPlanBuilder.generatePlan(provider, defaultContext);
    const json = TradingPlanBuilder.serialize(plan);
    const restored = TradingPlanBuilder.deserialize(json);

    expect(restored.id).toBe(plan.id);
    expect(restored.selectedProvider.id).toBe(plan.selectedProvider.id);
    expect(restored.build.riskLimits).toEqual(plan.build.riskLimits);
  });

  test('all phases start as pending', () => {
    const plan = TradingPlanBuilder.generatePlan(provider, defaultContext);
    expect(plan.setup.status).toBe('pending');
    expect(plan.install.status).toBe('pending');
    expect(plan.build.status).toBe('pending');
    expect(plan.start.status).toBe('pending');
  });
});

// ==========================================
// ConfigCascade Tests
// ==========================================
describe('ConfigCascade', () => {
  test('returns provider defaults when no overrides', () => {
    const config = resolveConfig({});
    const defaults = getProviderDefaults();
    expect(config.pair).toBe(defaults.pair);
    expect(config.mode).toBe('paper');
    expect(config.maxPositionSizeUsd).toBe(500);
  });

  test('CLI overrides take highest priority', () => {
    const config = resolveConfig({
      providerDefaults: { pair: 'ETH/USDT' },
      cliOverrides: { pair: 'SOL/USDT' },
    });
    expect(config.pair).toBe('SOL/USDT');
  });

  test('provider defaults override base defaults', () => {
    const config = resolveConfig({
      providerDefaults: { maxPositionSizeUsd: 1000, mode: 'live' },
    });
    expect(config.maxPositionSizeUsd).toBe(1000);
    expect(config.mode).toBe('live');
  });

  test('env vars override provider defaults', () => {
    process.env.ALGO_TRADER_PAIR = 'DOGE/USDT';
    process.env.ALGO_TRADER_MAX_POSITION = '2000';

    const config = resolveConfig({});
    expect(config.pair).toBe('DOGE/USDT');
    expect(config.maxPositionSizeUsd).toBe(2000);

    delete process.env.ALGO_TRADER_PAIR;
    delete process.env.ALGO_TRADER_MAX_POSITION;
  });

  test('CLI overrides beat env vars', () => {
    process.env.ALGO_TRADER_MODE = 'live';
    const config = resolveConfig({ cliOverrides: { mode: 'backtest' } });
    expect(config.mode).toBe('backtest');
    delete process.env.ALGO_TRADER_MODE;
  });

  test('getProviderDefaults returns copy', () => {
    const d1 = getProviderDefaults();
    const d2 = getProviderDefaults();
    d1.pair = 'MODIFIED';
    expect(d2.pair).toBe('BTC/USDT');
  });
});
