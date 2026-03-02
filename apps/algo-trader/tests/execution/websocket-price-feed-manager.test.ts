/**
 * Tests for WebSocketPriceFeedManager.
 * Mocks native ws WebSocket to verify connection, tick parsing, and reconnect logic.
 */

import { EventEmitter } from 'events';
import { WebSocketPriceFeedManager, PriceTick } from '../../src/execution/websocket-multi-exchange-price-feed-manager';

// --- Mock WebSocket ---
class MockWebSocket extends EventEmitter {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  sentMessages: string[] = [];

  send(data: string): void { this.sentMessages.push(data); }
  ping(): void { /* no-op */ }
  close(): void { this.readyState = 3; this.emit('close'); }
}

let mockWsInstances: MockWebSocket[] = [];

jest.mock('ws', () => {
  return jest.fn().mockImplementation((_url: string) => {
    const instance = new MockWebSocket();
    mockWsInstances.push(instance);
    return instance;
  });
});

describe('WebSocketPriceFeedManager', () => {
  let manager: WebSocketPriceFeedManager;

  beforeEach(() => {
    mockWsInstances = [];
    jest.useFakeTimers();
    manager = new WebSocketPriceFeedManager({
      exchanges: ['binance', 'okx'],
      symbols: ['BTC/USDT'],
      reconnectDelayMs: 100,
      maxReconnectAttempts: 3,
      heartbeatIntervalMs: 1000,
    });
  });

  afterEach(() => {
    manager.stop();
    jest.useRealTimers();
  });

  it('creates one WebSocket connection per exchange on start', () => {
    manager.start();
    expect(mockWsInstances).toHaveLength(2);
  });

  it('does not create connections before start()', () => {
    expect(mockWsInstances).toHaveLength(0);
  });

  it('is idempotent — calling start() twice creates connections only once', () => {
    manager.start();
    manager.start();
    expect(mockWsInstances).toHaveLength(2);
  });

  it('emits tick event on valid Binance bookTicker message', () => {
    manager.start();
    const ticks: PriceTick[] = [];
    manager.on('tick', (t: PriceTick) => ticks.push(t));

    const binanceWs = mockWsInstances[0];
    binanceWs.emit('open');
    binanceWs.emit('message', JSON.stringify({
      data: { s: 'BTCUSDT', b: '68000.50', a: '68001.00' },
    }));

    expect(ticks).toHaveLength(1);
    expect(ticks[0].bid).toBe(68000.50);
    expect(ticks[0].ask).toBe(68001.00);
    expect(ticks[0].exchange).toBe('binance');
  });

  it('emits tick event on valid OKX tickers message', () => {
    manager.start();
    const ticks: PriceTick[] = [];
    manager.on('tick', (t: PriceTick) => ticks.push(t));

    const okxWs = mockWsInstances[1];
    okxWs.emit('open');
    okxWs.emit('message', JSON.stringify({
      data: [{ instId: 'BTC-USDT', bidPx: '67999.00', askPx: '68000.00' }],
    }));

    expect(ticks).toHaveLength(1);
    expect(ticks[0].bid).toBe(67999.00);
    expect(ticks[0].exchange).toBe('okx');
  });

  it('ignores malformed/irrelevant WebSocket messages silently', () => {
    manager.start();
    const ticks: PriceTick[] = [];
    manager.on('tick', (t: PriceTick) => ticks.push(t));

    const ws = mockWsInstances[0];
    ws.emit('open');
    ws.emit('message', 'not json at all');
    ws.emit('message', JSON.stringify({ unrelated: true }));

    expect(ticks).toHaveLength(0);
  });

  it('schedules reconnect on disconnect with exponential backoff', () => {
    manager.start();
    const ws = mockWsInstances[0];
    ws.emit('open');
    ws.emit('close'); // triggers reconnect schedule

    // After first close, reconnect timer set at 100ms (reconnectDelayMs * 2^0)
    expect(mockWsInstances).toHaveLength(2); // no new ws yet

    jest.advanceTimersByTime(150);
    // A new WebSocket should have been created for binance
    expect(mockWsInstances.length).toBeGreaterThanOrEqual(3);
  });

  it('stops reconnecting after maxReconnectAttempts', () => {
    const errors: Error[] = [];
    manager.on('error', (e: Error) => errors.push(e));
    manager.start();

    // Simulate maxReconnectAttempts (3) + 1 disconnects without ever opening
    // so reconnectAttempts increments each cycle until it hits the limit.
    // Each reconnect fires after its backoff delay; we fast-forward through each.
    for (let attempt = 0; attempt <= 3; attempt++) {
      const ws = mockWsInstances[mockWsInstances.length - 1];
      // Emit close without open so reconnectAttempts on the connection increases
      ws.emit('close');
      // Advance past the backoff delay for this attempt: min(100 * 2^attempt, 60000)
      const delay = Math.min(100 * Math.pow(2, attempt), 60000);
      jest.advanceTimersByTime(delay + 50);
    }

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Max reconnects');
  });

  it('stop() closes all connections and clears latest prices', () => {
    manager.start();
    const ws = mockWsInstances[0];
    ws.emit('open');
    ws.emit('message', JSON.stringify({
      data: { s: 'BTCUSDT', b: '68000.50', a: '68001.00' },
    }));

    manager.stop();
    // stop clears connections map — no new reconnects should fire
    jest.advanceTimersByTime(10000);
    expect(mockWsInstances).toHaveLength(2); // no new ones created
  });

  it('getLatestPrices returns a snapshot map of all received ticks', () => {
    manager.start();
    manager.on('tick', () => { /* subscribe to activate */ });

    const binanceWs = mockWsInstances[0];
    binanceWs.emit('open');
    binanceWs.emit('message', JSON.stringify({
      data: { s: 'BTCUSDT', b: '68000.00', a: '68001.00' },
    }));

    const prices = manager.getLatestPrices();
    expect(prices.size).toBe(1);
    expect([...prices.values()][0].bid).toBe(68000.00);
  });

  it('sends OKX subscribe message after open', () => {
    manager.start();
    const okxWs = mockWsInstances[1];
    okxWs.emit('open');

    expect(okxWs.sentMessages).toHaveLength(1);
    const msg = JSON.parse(okxWs.sentMessages[0]);
    expect(msg.op).toBe('subscribe');
    expect(msg.args[0].channel).toBe('tickers');
  });
});
