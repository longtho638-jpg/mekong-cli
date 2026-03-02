import { StrategyPositionManager, Position, PositionSummary } from '../../src/execution/strategy-position-manager';

describe('StrategyPositionManager', () => {
  let mgr: StrategyPositionManager;

  beforeEach(() => {
    mgr = new StrategyPositionManager({
      maxPositionSizeUsd: 10_000,
      maxConcurrentPositions: 3,
      maxDailyLossUsd: 500,
    });
  });

  afterEach(() => {
    mgr.removeAllListeners();
  });

  const openLong = (strategy = 'RSI', price = 50000, amount = 0.1) =>
    mgr.openPosition({ strategy, symbol: 'BTC/USDT', side: 'long', entryPrice: price, amount });

  // --- Open Position ---

  test('openPosition returns position ID', () => {
    const id = openLong();
    expect(id).toBeTruthy();
    expect(id).toContain('pos-');
  });

  test('openPosition emits position:opened event', () => {
    const events: Position[] = [];
    mgr.on('position:opened', (p: Position) => events.push(p));
    openLong();
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe('open');
    expect(events[0].side).toBe('long');
  });

  test('opened position is retrievable', () => {
    const id = openLong()!;
    const pos = mgr.getPosition(id);
    expect(pos).toBeDefined();
    expect(pos!.entryPrice).toBe(50000);
    expect(pos!.amount).toBe(0.1);
    expect(pos!.status).toBe('open');
  });

  // --- Close Position ---

  test('closePosition calculates realized PnL for long', () => {
    const id = openLong('RSI', 50000, 0.1)!;
    const closed = mgr.closePosition(id, 51000);
    expect(closed).not.toBeNull();
    expect(closed!.status).toBe('closed');
    expect(closed!.realizedPnl).toBe(100); // (51000-50000)*0.1
    expect(closed!.exitPrice).toBe(51000);
  });

  test('closePosition calculates realized PnL for short', () => {
    const id = mgr.openPosition({
      strategy: 'RSI', symbol: 'BTC/USDT', side: 'short', entryPrice: 50000, amount: 0.1,
    })!;
    const closed = mgr.closePosition(id, 49000);
    expect(closed!.realizedPnl).toBe(100); // short: (50000-49000)*0.1
  });

  test('closePosition emits position:closed event', () => {
    const events: Position[] = [];
    mgr.on('position:closed', (p: Position) => events.push(p));
    const id = openLong()!;
    mgr.closePosition(id, 51000);
    expect(events).toHaveLength(1);
    expect(events[0].realizedPnl).toBe(100);
  });

  test('closePosition returns null for unknown ID', () => {
    expect(mgr.closePosition('nonexistent', 50000)).toBeNull();
  });

  test('closePosition returns null for already closed position', () => {
    const id = openLong()!;
    mgr.closePosition(id, 51000);
    expect(mgr.closePosition(id, 52000)).toBeNull();
  });

  // --- Unrealized PnL ---

  test('getUnrealizedPnl for open long position', () => {
    const id = openLong('RSI', 50000, 0.1)!;
    expect(mgr.getUnrealizedPnl(id, 51000)).toBe(100);
    expect(mgr.getUnrealizedPnl(id, 49000)).toBe(-100);
  });

  test('getUnrealizedPnl returns 0 for closed position', () => {
    const id = openLong()!;
    mgr.closePosition(id, 51000);
    expect(mgr.getUnrealizedPnl(id, 52000)).toBe(0);
  });

  // --- Risk Limits ---

  test('rejects when max concurrent positions reached', () => {
    openLong('s1');
    openLong('s2');
    openLong('s3');
    const riskEvents: unknown[] = [];
    mgr.on('risk:limit', (e) => riskEvents.push(e));

    const id = openLong('s4');
    expect(id).toBeNull();
    expect(riskEvents).toHaveLength(1);
    expect((riskEvents[0] as { type: string }).type).toBe('max_concurrent');
  });

  test('rejects when position size exceeds limit', () => {
    // maxPositionSizeUsd = 10000, price*amount = 50000*0.5 = 25000 > 10000
    const id = mgr.openPosition({
      strategy: 'RSI', symbol: 'BTC/USDT', side: 'long', entryPrice: 50000, amount: 0.5,
    });
    expect(id).toBeNull();
  });

  test('rejects when daily loss limit exceeded', () => {
    // Open and close with loss to accumulate daily loss
    const id1 = openLong('RSI', 50000, 0.1)!;
    mgr.closePosition(id1, 44000); // loss = 600 > maxDailyLossUsd 500

    const id2 = openLong('RSI', 50000, 0.1);
    expect(id2).toBeNull();
  });

  // --- Queries ---

  test('getOpenPositions returns only open', () => {
    const id1 = openLong()!;
    openLong();
    mgr.closePosition(id1, 51000);
    expect(mgr.getOpenPositions()).toHaveLength(1);
  });

  test('getClosedPositions returns only closed', () => {
    const id1 = openLong()!;
    openLong();
    mgr.closePosition(id1, 51000);
    expect(mgr.getClosedPositions()).toHaveLength(1);
  });

  test('getPositionsByStrategy filters correctly', () => {
    openLong('RSI');
    openLong('MACD');
    openLong('RSI');
    expect(mgr.getPositionsByStrategy('RSI')).toHaveLength(2);
    expect(mgr.getPositionsByStrategy('MACD')).toHaveLength(1);
  });

  // --- Summary ---

  test('getSummary calculates correct stats', () => {
    const id1 = openLong('RSI', 50000, 0.1)!;
    const id2 = openLong('RSI', 50000, 0.1)!;
    openLong('RSI', 50000, 0.05); // still open

    mgr.closePosition(id1, 51000); // +100
    mgr.closePosition(id2, 49000); // -100

    const prices = new Map([['BTC/USDT', 50500]]);
    const summary: PositionSummary = mgr.getSummary(prices);

    expect(summary.totalPositions).toBe(3);
    expect(summary.openPositions).toBe(1);
    expect(summary.closedPositions).toBe(2);
    expect(summary.realizedPnl).toBe(0); // +100 -100
    expect(summary.unrealizedPnl).toBe(25); // (50500-50000)*0.05
    expect(summary.totalPnl).toBe(25);
    expect(summary.winCount).toBe(1);
    expect(summary.lossCount).toBe(1);
    expect(summary.winRate).toBe(0.5);
  });

  test('getSummary without prices has 0 unrealized', () => {
    openLong();
    const summary = mgr.getSummary();
    expect(summary.unrealizedPnl).toBe(0);
  });

  // --- Metadata ---

  test('position supports metadata', () => {
    const id = mgr.openPosition({
      strategy: 'RSI', symbol: 'BTC/USDT', side: 'long',
      entryPrice: 50000, amount: 0.1,
      metadata: { confidence: 0.85, exchange: 'binance' },
    })!;
    expect(mgr.getPosition(id)!.metadata).toEqual({ confidence: 0.85, exchange: 'binance' });
  });

  // --- Daily Loss Reset ---

  test('getDailyLoss returns accumulated loss', () => {
    const id = openLong('RSI', 50000, 0.1)!;
    mgr.closePosition(id, 48000); // loss = 200
    expect(mgr.getDailyLoss()).toBe(200);
  });

  test('getLimits returns current risk limits', () => {
    const limits = mgr.getLimits();
    expect(limits.maxConcurrentPositions).toBe(3);
    expect(limits.maxPositionSizeUsd).toBe(10_000);
    expect(limits.maxDailyLossUsd).toBe(500);
  });
});
