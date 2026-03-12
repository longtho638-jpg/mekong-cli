/**
 * Tests for PolymarketTelegramBot integration.
 * Verifies command handling, event wiring, and alert forwarding.
 */

// Mock the entire dependency chain to avoid ESM issues with @polymarket/clob-client
// Must mock deep deps first to prevent Jest from loading ESM modules
jest.mock('@polymarket/clob-client', () => ({}));
jest.mock('../../src/polymarket/client', () => ({}));
jest.mock('../../src/polymarket/index', () => ({}));
jest.mock('../../src/execution/polymarket-adapter', () => ({}));
jest.mock('../../src/strategies/polymarket', () => ({}));
jest.mock('../../src/polymarket/bot-engine');
jest.mock('../../src/execution/telegram-trade-alert-bot');
jest.mock('../../src/execution/telegram-command-handler');
jest.mock('../../src/core/PortfolioManager');
jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { PolymarketTelegramBot } from '../../src/telegram/polymarket-telegram-bot';
import { TelegramTradeAlertBot } from '../../src/execution/telegram-trade-alert-bot';
import { TelegramCommandHandler } from '../../src/execution/telegram-command-handler';
import { PortfolioManager } from '../../src/core/PortfolioManager';

describe('PolymarketTelegramBot', () => {
  let bot: PolymarketTelegramBot;
  let mockAlertBot: any;
  let mockCmdHandler: any;
  let mockPortfolio: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup PortfolioManager singleton mock
    mockPortfolio = {
      getPortfolioSummary: jest.fn().mockReturnValue({
        totalPositions: 3,
        totalPnl: 150.50,
        realizedPnl: 100.00,
        unrealizedPnl: 50.50,
        totalExposure: 500.00,
        marketExposures: [],
      }),
      getOpenPositions: jest.fn().mockReturnValue([
        {
          id: 'pm_1', tokenId: 'tok1', marketId: 'mkt1', side: 'YES',
          size: 100, avgPrice: 0.55, currentPrice: 0.60,
          unrealizedPnl: 5.0, realizedPnl: 0, openedAt: Date.now(),
          tenantId: 'default',
        },
      ]),
      getPositions: jest.fn().mockReturnValue([]),
    };

    (PortfolioManager.getInstance as jest.Mock).mockReturnValue(mockPortfolio);

    // Capture mock instances via constructor spies
    (TelegramTradeAlertBot as jest.Mock).mockImplementation(() => {
      mockAlertBot = {
        start: jest.fn(),
        stop: jest.fn(),
        alertSignal: jest.fn(),
        alertAnomaly: jest.fn(),
        alertPositionClosed: jest.fn(),
        alertDailySummary: jest.fn(),
        sendRaw: jest.fn(),
      };
      return mockAlertBot;
    });

    (TelegramCommandHandler as jest.Mock).mockImplementation(() => {
      mockCmdHandler = {
        start: jest.fn(),
        stop: jest.fn(),
        reply: jest.fn().mockResolvedValue(undefined),
        registerCommand: jest.fn(),
        on: jest.fn(),
      };
      return mockCmdHandler;
    });

    bot = new PolymarketTelegramBot({
      botToken: 'test-token',
      chatId: '12345',
    });
  });

  afterEach(async () => {
    await bot.stop();
  });

  it('should create bot with alert and command handler', () => {
    expect(TelegramTradeAlertBot).toHaveBeenCalled();
    expect(TelegramCommandHandler).toHaveBeenCalled();
  });

  it('should register polymarket commands', () => {
    const calls = (mockCmdHandler.registerCommand as jest.Mock).mock.calls;
    const commandNames = calls.map((c: any[]) => c[0]);

    expect(commandNames).toContain('/pm_help');
    expect(commandNames).toContain('/pm_start');
    expect(commandNames).toContain('/pm_stop');
    expect(commandNames).toContain('/pm_status');
    expect(commandNames).toContain('/pm_pnl');
    expect(commandNames).toContain('/pm_positions');
    expect(commandNames).toContain('/pm_summary');
  });

  it('should start both alert bot and command handler', async () => {
    await bot.start();

    expect(mockAlertBot.start).toHaveBeenCalled();
    expect(mockCmdHandler.start).toHaveBeenCalled();
    expect(mockCmdHandler.reply).toHaveBeenCalledWith(
      expect.stringContaining('Polymarket Trading Bot Online'),
      'Markdown'
    );
  });

  it('should stop both on stop()', async () => {
    await bot.start();
    await bot.stop();

    expect(mockAlertBot.stop).toHaveBeenCalled();
    expect(mockCmdHandler.stop).toHaveBeenCalled();
  });

  describe('command handlers', () => {
    let commands: Map<string, Function>;

    beforeEach(() => {
      commands = new Map();
      (mockCmdHandler.registerCommand as jest.Mock).mock.calls.forEach(
        ([name, action]: [string, Function]) => {
          commands.set(name, action);
        }
      );
    });

    it('/pm_help returns command list', async () => {
      const handler = commands.get('/pm_help');
      expect(handler).toBeDefined();
      const result = await handler!('');
      expect(result).toContain('Polymarket Trading Bot');
      expect(result).toContain('/pm');
    });

    it('/pm_status when bot not running', async () => {
      const handler = commands.get('/pm_status');
      const result = await handler!('');
      expect(result).toContain('not running');
    });

    it('/pm_pnl returns portfolio PnL', async () => {
      const handler = commands.get('/pm_pnl');
      const result = await handler!('');
      expect(result).toContain('P&L Report');
      expect(result).toContain('150.50');
    });

    it('/pm_positions returns open positions', async () => {
      const handler = commands.get('/pm_positions');
      const result = await handler!('');
      expect(result).toContain('Open Positions');
      expect(result).toContain('YES');
    });

    it('/pm_positions returns empty when no positions', async () => {
      mockPortfolio.getOpenPositions.mockReturnValue([]);
      const handler = commands.get('/pm_positions');
      const result = await handler!('');
      expect(result).toContain('No open positions');
    });

    it('/pm_stop when bot not running', async () => {
      const handler = commands.get('/pm_stop');
      const result = await handler!('');
      expect(result).toContain('not running');
    });

    it('/pm_summary returns daily summary', async () => {
      const handler = commands.get('/pm_summary');
      const result = await handler!('');
      expect(result).toContain('Daily Summary');
      expect(result).toContain('P&L');
    });
  });
});
