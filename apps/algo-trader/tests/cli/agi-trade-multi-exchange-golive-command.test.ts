import { Command } from 'commander';
import { registerAgiTradeCommand, AgiTradeOrchestrator } from '../../src/cli/agi-trade-multi-exchange-golive-command';

// Mock LicenseService to allow tests to pass without license
jest.mock('../../src/lib/raas-gate', () => ({
  LicenseService: {
    getInstance: jest.fn(() => ({
      hasTier: jest.fn(() => true),
      getTier: jest.fn(() => 'pro'),
      validate: jest.fn(() => ({ valid: true, tier: 'pro', features: ['ml_models', 'premium_data'] })),
      requireTier: jest.fn(),
      requireFeature: jest.fn(),
      reset: jest.fn(),
    })),
  },
  LicenseTier: {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
  },
  LicenseError: class LicenseError extends Error {
    constructor(message: string, public requiredTier: string, public feature: string) {
      super(message);
      this.name = 'LicenseError';
    }
  },
  isPremium: jest.fn(() => true),
  isEnterprise: jest.fn(() => false),
  getLicenseTier: jest.fn(() => 'pro'),
  validateLicense: jest.fn(() => ({ valid: true, tier: 'pro', features: [] })),
  requireMLFeature: jest.fn(),
  requirePremiumData: jest.fn(),
  requireLicenseMiddleware: jest.fn(() => jest.fn()),
}));

jest.mock('ws', () => {
  return class MockWebSocket {
    static OPEN = 1;
    readyState = 1;
    on = jest.fn();
    send = jest.fn();
    close = jest.fn();
    ping = jest.fn();
  };
});

jest.mock('../../src/cli/exchange-factory', () => ({
  createExchangeAdapter: jest.fn((id: string) => ({ exchangeId: id })),
}));

describe('AGI Trade Command', () => {
  test('registers agi:trade command', () => {
    const program = new Command();
    registerAgiTradeCommand(program);
    const cmd = program.commands.find(c => c.name() === 'agi:trade');
    expect(cmd).toBeDefined();
    expect(cmd!.description()).toContain('AGI');
  });

  test('command has required and optional options', () => {
    const program = new Command();
    registerAgiTradeCommand(program);
    const cmd = program.commands.find(c => c.name() === 'agi:trade')!;
    const optNames = cmd.options.map(o => o.long);
    expect(optNames).toContain('--exchanges');
    expect(optNames).toContain('--pairs');
    expect(optNames).toContain('--strategies');
    expect(optNames).toContain('--live');
    expect(optNames).toContain('--dry-run');
    expect(optNames).toContain('--telegram-token');
  });
});

describe('AgiTradeOrchestrator', () => {
  let orch: AgiTradeOrchestrator;

  beforeEach(() => {
    orch = new AgiTradeOrchestrator({
      exchanges: ['binance'],
      pairs: ['BTC/USDT'],
      strategies: ['RsiSma'],
      dryRun: true,
      candleIntervalMs: 60000,
      maxPositionUsd: 1000,
      maxConcurrent: 3,
      maxDailyLossUsd: 500,
      minConfirmations: 1,
    });
  });

  afterEach(async () => {
    if (orch.isRunning()) await orch.stop();
  });

  test('initially not running', () => {
    expect(orch.isRunning()).toBe(false);
  });

  test('start boots all components', async () => {
    await orch.start();
    expect(orch.isRunning()).toBe(true);
  });

  test('start is idempotent', async () => {
    await orch.start();
    await orch.start();
    expect(orch.isRunning()).toBe(true);
  });

  test('stop generates report string', async () => {
    await orch.start();
    const report = await orch.stop();
    expect(report).toContain('AGI TRADE REPORT');
    expect(report).toContain('DRY-RUN');
    expect(report).toContain('RsiSma');
    expect(orch.isRunning()).toBe(false);
  });

  test('stop on non-running returns empty', async () => {
    const report = await orch.stop();
    expect(report).toBe('');
  });

  test('position manager accessible', () => {
    expect(orch.getPositionManager()).toBeDefined();
  });

  test('circuit breaker accessible', () => {
    expect(orch.getCircuitBreaker()).toBeDefined();
  });

  test('throws for unknown strategy', async () => {
    const bad = new AgiTradeOrchestrator({
      exchanges: ['binance'],
      pairs: ['BTC/USDT'],
      strategies: ['NonExistentStrategy'],
      dryRun: true,
      candleIntervalMs: 60000,
      maxPositionUsd: 1000,
      maxConcurrent: 3,
      maxDailyLossUsd: 500,
      minConfirmations: 1,
    });
    await expect(bad.start()).rejects.toThrow('not found');
  });
});
