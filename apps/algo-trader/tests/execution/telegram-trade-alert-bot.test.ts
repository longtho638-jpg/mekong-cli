import { TelegramTradeAlertBot } from '../../src/execution/telegram-trade-alert-bot';

/** Create a mock fetch that returns success */
function mockFetch(status = 200): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue('ok'),
  });
}

describe('TelegramTradeAlertBot', () => {
  let bot: TelegramTradeAlertBot;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock = mockFetch();
    bot = new TelegramTradeAlertBot(
      { botToken: 'test-token', chatId: '12345', rateLimitMs: 100 },
      fetchMock,
    );
  });

  afterEach(() => {
    bot.stop();
    bot.removeAllListeners();
    jest.useRealTimers();
  });

  test('alertSignal enqueues BUY message', () => {
    bot.alertSignal('RSI', 'buy', 'BTC/USDT', 50000, 2);
    expect(bot.getPendingCount()).toBe(1);
  });

  test('alertSignal enqueues SELL message', () => {
    bot.alertSignal('MACD', 'sell', 'ETH/USDT', 3000, 1);
    expect(bot.getPendingCount()).toBe(1);
  });

  test('alertPositionClosed enqueues with PnL', () => {
    bot.alertPositionClosed('pos-1', 'BTC/USDT', 150.50, 'long');
    expect(bot.getPendingCount()).toBe(1);
  });

  test('alertAnomaly enqueues warning', () => {
    bot.alertAnomaly('Circuit Breaker', 'binance:BTC/USDT tripped');
    expect(bot.getPendingCount()).toBe(1);
  });

  test('alertDailySummary enqueues report', () => {
    bot.alertDailySummary({ totalPnl: 250, winRate: 0.65, openPositions: 2, closedPositions: 8 });
    expect(bot.getPendingCount()).toBe(1);
  });

  test('disabled bot does not enqueue', () => {
    const disabled = new TelegramTradeAlertBot(
      { botToken: 'x', chatId: 'y', enabled: false },
      fetchMock,
    );
    disabled.alertSignal('RSI', 'buy', 'BTC/USDT', 50000, 1);
    expect(disabled.getPendingCount()).toBe(0);
    disabled.stop();
  });

  test('start drains queue and calls Telegram API', async () => {
    bot.alertSignal('RSI', 'buy', 'BTC/USDT', 50000, 1);
    bot.start();

    // Advance timer to trigger drain
    jest.advanceTimersByTime(100);
    await Promise.resolve(); // flush microtasks

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/bottest-token/sendMessage');
    expect(JSON.parse(opts.body).chat_id).toBe('12345');
    expect(bot.getPendingCount()).toBe(0);
  });

  test('emits sent event on success', async () => {
    const events: unknown[] = [];
    bot.on('sent', (m) => events.push(m));

    bot.alertSignal('RSI', 'buy', 'BTC/USDT', 50000, 1);
    bot.start();
    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(events).toHaveLength(1);
  });

  test('emits error event on API failure', async () => {
    const errorFetch = mockFetch(429);
    const errorBot = new TelegramTradeAlertBot(
      { botToken: 'x', chatId: 'y', rateLimitMs: 50 },
      errorFetch,
    );
    const errors: unknown[] = [];
    errorBot.on('error', (e) => errors.push(e));

    errorBot.sendRaw('test');
    errorBot.start();
    jest.advanceTimersByTime(50);
    // Flush multiple microtask cycles for async drain + response.text()
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(errors).toHaveLength(1);
    errorBot.stop();
  });

  test('rate limits message sending', async () => {
    bot.alertSignal('RSI', 'buy', 'BTC/USDT', 50000, 1);
    bot.alertSignal('MACD', 'sell', 'ETH/USDT', 3000, 1);
    bot.start();

    // First drain at 100ms
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second drain at 200ms
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('start is idempotent', () => {
    bot.start();
    bot.start(); // no-op
    bot.stop();
  });

  test('sendRaw enqueues plain text', () => {
    bot.sendRaw('Hello world');
    expect(bot.getPendingCount()).toBe(1);
  });

  test('enqueued event fires on message add', () => {
    const events: unknown[] = [];
    bot.on('enqueued', (m) => events.push(m));
    bot.alertSignal('RSI', 'buy', 'BTC/USDT', 50000, 1);
    expect(events).toHaveLength(1);
  });
});
