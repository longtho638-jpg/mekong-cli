/**
 * Tests for BotEngine Plugin System — PluginManager and built-in plugin factories.
 * Covers: autonomy gate, daily loss limit, signal filter, webhook notifier.
 */

import { PluginManager, PreTradeInfo } from '../../src/core/bot-engine-plugins';
import {
  createAutonomyGatePlugin,
  createDailyLossPlugin,
  createSignalFilterPlugin,
  createWebhookPlugin,
} from '../../src/core/bot-engine-builtin-plugin-factories';
import { AgentEventBus, AgentEventType, AutonomyController } from '../../src/a2ui';

// Mock dependencies
jest.mock('../../src/a2ui', () => {
  const actual = jest.requireActual('../../src/a2ui');
  return {
    ...actual,
    AutonomyController: jest.fn().mockImplementation(() => ({
      canExecute: jest.fn(),
    })),
    AgentEventBus: jest.fn().mockImplementation(() => ({
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
    })),
  };
});

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockEventBus: jest.Mocked<AgentEventBus>;

  beforeEach(() => {
    mockEventBus = new AgentEventBus() as jest.Mocked<AgentEventBus>;
    pluginManager = new PluginManager(mockEventBus);
  });

  describe('register()', () => {
    it('adds plugin to the list', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
      };
      pluginManager.register(plugin);
      const plugins = pluginManager.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
    });

    it('allows multiple plugins', () => {
      pluginManager.register({ name: 'plugin1', version: '1.0.0' });
      pluginManager.register({ name: 'plugin2', version: '1.0.0' });
      const plugins = pluginManager.getPlugins();
      expect(plugins).toHaveLength(2);
    });
  });

  describe('onPreTrade()', () => {
    const mockTrade: PreTradeInfo = {
      side: 'buy',
      symbol: 'BTC/USDT',
      amount: 0.1,
      price: 50000,
      strategy: 'RSI_SMA',
    };

    it('approves trade when no plugins registered', async () => {
      const result = await pluginManager.onPreTrade(mockTrade);
      expect(result.approved).toBe(true);
    });

    it('approves trade when all plugins approve', async () => {
      pluginManager.register({
        name: 'approver',
        version: '1.0.0',
        async onPreTrade() {
          return { approved: true };
        },
      });

      const result = await pluginManager.onPreTrade(mockTrade);
      expect(result.approved).toBe(true);
    });

    it('first veto blocks trade', async () => {
      pluginManager.register({
        name: 'vetoer',
        version: '1.0.0',
        async onPreTrade() {
          return { approved: false, reason: 'test veto' };
        },
      });

      pluginManager.register({
        name: 'approver',
        version: '1.0.0',
        async onPreTrade() {
          return { approved: true };
        },
      });

      const result = await pluginManager.onPreTrade(mockTrade);
      expect(result.approved).toBe(false);
      expect(result.reason).toBe('test veto');
    });

    it('passes trade info to plugins', async () => {
      let receivedTrade: PreTradeInfo | undefined;
      pluginManager.register({
        name: 'observer',
        version: '1.0.0',
        async onPreTrade(_ctx, trade) {
          receivedTrade = trade;
          return { approved: true };
        },
      });

      await pluginManager.onPreTrade(mockTrade);
      expect(receivedTrade).toEqual(mockTrade);
    });
  });

  describe('onStart()', () => {
    it('calls onStart for all plugins', async () => {
      let plugin1Started = false;
      let plugin2Started = false;

      pluginManager.register({
        name: 'plugin1',
        version: '1.0.0',
        async onStart() {
          plugin1Started = true;
        },
      });

      pluginManager.register({
        name: 'plugin2',
        version: '1.0.0',
        async onStart() {
          plugin2Started = true;
        },
      });

      await pluginManager.onStart();
      expect(plugin1Started).toBe(true);
      expect(plugin2Started).toBe(true);
    });
  });

  describe('onPostTrade()', () => {
    it('calls onPostTrade for all plugins', async () => {
      let plugin1Called = false;
      let plugin2Called = false;

      pluginManager.register({
        name: 'plugin1',
        version: '1.0.0',
        async onPostTrade() {
          plugin1Called = true;
        },
      });

      pluginManager.register({
        name: 'plugin2',
        version: '1.0.0',
        async onPostTrade() {
          plugin2Called = true;
        },
      });

      const tradeInfo = {
        side: 'buy' as const,
        symbol: 'BTC/USDT',
        amount: 0.1,
        price: 50000,
        strategy: 'RSI_SMA',
        orderId: '123',
        fee: 0.001,
        pnl: 100,
        success: true,
      };

      await pluginManager.onPostTrade(tradeInfo);
      expect(plugin1Called).toBe(true);
      expect(plugin2Called).toBe(true);
    });
  });
});

describe('createAutonomyGatePlugin', () => {
  let mockAutonomyController: jest.Mocked<AutonomyController>;
  let plugin: ReturnType<typeof createAutonomyGatePlugin>;

  beforeEach(() => {
    mockAutonomyController = new AutonomyController() as jest.Mocked<AutonomyController>;
    plugin = createAutonomyGatePlugin(mockAutonomyController);
  });

  it('has correct name and version', () => {
    expect(plugin.name).toBe('autonomy-gate');
    expect(plugin.version).toBe('1.0.0');
  });

  it('approves when canExecute returns true', async () => {
    mockAutonomyController.canExecute.mockReturnValue(true);

    const result = await plugin.onPreTrade!(
      {} as any,
      { side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test' }
    );

    expect(result.approved).toBe(true);
    expect(mockAutonomyController.canExecute).toHaveBeenCalledWith('test');
  });

  it('vetoes when canExecute returns false', async () => {
    mockAutonomyController.canExecute.mockReturnValue(false);

    const result = await plugin.onPreTrade!(
      {} as any,
      { side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test' }
    );

    expect(result.approved).toBe(false);
    expect(result.reason).toContain('does not permit execution');
  });
});

describe('createDailyLossPlugin', () => {
  let plugin: ReturnType<typeof createDailyLossPlugin>;
  let mockEventBus: jest.Mocked<AgentEventBus>;
  let mockCtx: any;

  beforeEach(() => {
    mockEventBus = new AgentEventBus() as jest.Mocked<AgentEventBus>;
    mockCtx = { eventBus: mockEventBus, config: { tenantId: 'test-tenant' } };
    plugin = createDailyLossPlugin(500); // $500 daily loss limit
  });

  it('has correct name and version', () => {
    expect(plugin.name).toBe('daily-loss-limit');
    expect(plugin.version).toBe('1.0.0');
  });

  it('approves when no losses yet', async () => {
    const result = await plugin.onPreTrade!(mockCtx, {
      side: 'buy' as const,
      symbol: 'BTC/USDT',
      amount: 0.1,
      price: 50000,
      strategy: 'test',
    });
    expect(result.approved).toBe(true);
  });

  it('vetoes when daily loss exceeds limit', async () => {
    // Simulate a loss
    await plugin.onPostTrade!(mockCtx, { pnl: -300, side: 'buy' as const, symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test', orderId: '1', fee: 0, success: true });
    await plugin.onPostTrade!(mockCtx, { pnl: -250, side: 'buy' as const, symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test', orderId: '2', fee: 0, success: true });

    const result = await plugin.onPreTrade!(mockCtx, {
      side: 'buy',
      symbol: 'BTC/USDT',
      amount: 0.1,
      price: 50000,
      strategy: 'test',
    });

    expect(result.approved).toBe(false);
    expect(result.reason).toContain('daily loss limit');
  });

  it('emits RISK_ALERT event when limit hit', async () => {
    await plugin.onPostTrade!(mockCtx, { pnl: -600 } as any);

    await plugin.onPreTrade!(mockCtx, {
      side: 'buy',
      symbol: 'BTC/USDT',
      amount: 0.1,
      price: 50000,
      strategy: 'test',
    });

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AgentEventType.RISK_ALERT,
        alertType: 'daily_loss',
        threshold: 500,
      })
    );
  });

  it('tracks PnL correctly on profitable trades', async () => {
    await plugin.onPostTrade!(mockCtx, { pnl: -200, side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test', orderId: '1', fee: 0 } as any);
    await plugin.onPostTrade!(mockCtx, { pnl: 100, side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test', orderId: '2', fee: 0 } as any);

    // Should still allow trades (net -100, limit is -500)
    const result = await plugin.onPreTrade!(mockCtx, {
      side: 'buy',
      symbol: 'BTC/USDT',
      amount: 0.1,
      price: 50000,
      strategy: 'test',
    });

    expect(result.approved).toBe(true);
  });
});

describe('createSignalFilterPlugin', () => {
  let plugin: ReturnType<typeof createSignalFilterPlugin>;
  let mockGetSignalScore: jest.Mock;

  beforeEach(() => {
    mockGetSignalScore = jest.fn();
    plugin = createSignalFilterPlugin(60, mockGetSignalScore);
  });

  it('has correct name and version', () => {
    expect(plugin.name).toBe('signal-filter');
    expect(plugin.version).toBe('1.0.0');
  });

  it('approves when score >= minScore', async () => {
    mockGetSignalScore.mockReturnValue(75);

    const result = await plugin.onPreTrade!(
      {} as any,
      { side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test' }
    );

    expect(result.approved).toBe(true);
  });

  it('vetoes when score < minScore', async () => {
    mockGetSignalScore.mockReturnValue(45);

    const result = await plugin.onPreTrade!(
      {} as any,
      { side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test' }
    );

    expect(result.approved).toBe(false);
    expect(result.reason).toContain('below minimum');
  });

  it('passes trade to score function', async () => {
    const trade = { side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, strategy: 'test' };
    mockGetSignalScore.mockReturnValue(70);

    await plugin.onPreTrade!({} as any, trade);

    expect(mockGetSignalScore).toHaveBeenCalledWith(trade);
  });
});

describe('createWebhookPlugin', () => {
  let plugin: ReturnType<typeof createWebhookPlugin>;

  beforeEach(() => {
    plugin = createWebhookPlugin('https://webhook.example.com', 'secret');
  });

  it('has correct name and version', () => {
    expect(plugin.name).toBe('webhook-notifier');
    expect(plugin.version).toBe('1.0.0');
  });

  it('has onStart handler', () => {
    expect(plugin.onStart).toBeDefined();
  });

  it('has onPostTrade handler', () => {
    expect(plugin.onPostTrade).toBeDefined();
  });

  it('has onStop handler', () => {
    expect(plugin.onStop).toBeDefined();
  });
});
