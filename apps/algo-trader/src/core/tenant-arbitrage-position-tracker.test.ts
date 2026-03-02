/**
 * Unit tests for TenantArbPositionTracker — per-tenant isolation,
 * tier-based limits, pagination, and stats calculation.
 */

import { TenantArbPositionTracker } from './tenant-arbitrage-position-tracker';

const POSITION_DATA = {
  symbol: 'BTC/USDT',
  buyExchange: 'binance',
  sellExchange: 'okx',
  buyPrice: 30000,
  sellPrice: 30060,
  amount: 0.01,
  netSpreadPct: 0.2,
};

describe('TenantArbPositionTracker', () => {
  let tracker: TenantArbPositionTracker;

  beforeEach(() => {
    tracker = new TenantArbPositionTracker();
  });

  // ── openPosition ───────────────────────────────────────────────────────────

  it('openPosition — returns position with generated id', () => {
    const pos = tracker.openPosition('t1', 'pro', POSITION_DATA);
    expect(pos).not.toBeNull();
    expect(pos!.id).toMatch(/^arb_/);
    expect(pos!.tenantId).toBe('t1');
    expect(pos!.symbol).toBe('BTC/USDT');
    expect(pos!.status).toBe('open');
    expect(typeof pos!.openedAt).toBe('number');
    expect(pos!.closedAt).toBeUndefined();
  });

  it('openPosition — calculates pnl from prices', () => {
    const pos = tracker.openPosition('t1', 'pro', POSITION_DATA);
    // pnl = (sellPrice - buyPrice) * amount = 60 * 0.01 = 0.6
    expect(pos!.pnl).toBeCloseTo(0.6, 5);
  });

  it('openPosition — free tier allows only 1 open position', () => {
    const pos1 = tracker.openPosition('t1', 'free', POSITION_DATA);
    expect(pos1).not.toBeNull();
    const pos2 = tracker.openPosition('t1', 'free', POSITION_DATA);
    expect(pos2).toBeNull();
  });

  it('openPosition — pro tier allows up to 5 open positions', () => {
    for (let i = 0; i < 5; i++) {
      const pos = tracker.openPosition('t1', 'pro', POSITION_DATA);
      expect(pos).not.toBeNull();
    }
    const overflow = tracker.openPosition('t1', 'pro', POSITION_DATA);
    expect(overflow).toBeNull();
  });

  it('openPosition — enterprise tier is unlimited', () => {
    for (let i = 0; i < 20; i++) {
      const pos = tracker.openPosition('t1', 'enterprise', POSITION_DATA);
      expect(pos).not.toBeNull();
    }
  });

  it('openPosition — tenant isolation (t1 limit does not affect t2)', () => {
    for (let i = 0; i < 5; i++) tracker.openPosition('t1', 'pro', POSITION_DATA);
    // t1 is at limit, t2 should still work
    const pos = tracker.openPosition('t2', 'pro', POSITION_DATA);
    expect(pos).not.toBeNull();
  });

  // ── closePosition ──────────────────────────────────────────────────────────

  it('closePosition — marks position as closed with timestamp', () => {
    const pos = tracker.openPosition('t1', 'pro', POSITION_DATA)!;
    const closed = tracker.closePosition('t1', pos.id);
    expect(closed).not.toBeNull();
    expect(closed!.status).toBe('closed');
    expect(typeof closed!.closedAt).toBe('number');
  });

  it('closePosition — overrides pnl when finalPnl provided', () => {
    const pos = tracker.openPosition('t1', 'pro', POSITION_DATA)!;
    const closed = tracker.closePosition('t1', pos.id, 1.23);
    expect(closed!.pnl).toBe(1.23);
  });

  it('closePosition — returns null for unknown positionId', () => {
    const result = tracker.closePosition('t1', 'nonexistent');
    expect(result).toBeNull();
  });

  it('closePosition — tenant cannot close another tenant position', () => {
    const pos = tracker.openPosition('t1', 'pro', POSITION_DATA)!;
    const result = tracker.closePosition('t2', pos.id);
    expect(result).toBeNull();
  });

  // ── getPositions ───────────────────────────────────────────────────────────

  it('getPositions — returns only open positions', () => {
    const pos1 = tracker.openPosition('t1', 'pro', POSITION_DATA)!;
    const pos2 = tracker.openPosition('t1', 'pro', POSITION_DATA)!;
    tracker.closePosition('t1', pos1.id);

    const open = tracker.getPositions('t1');
    expect(open.length).toBe(1);
    expect(open[0]!.id).toBe(pos2.id);
  });

  it('getPositions — returns empty for tenant with no positions', () => {
    expect(tracker.getPositions('ghost')).toEqual([]);
  });

  // ── getHistory ─────────────────────────────────────────────────────────────

  it('getHistory — returns all positions with default pagination', () => {
    tracker.openPosition('t1', 'pro', POSITION_DATA);
    tracker.openPosition('t1', 'pro', POSITION_DATA);

    const result = tracker.getHistory('t1', { page: 1, limit: 20 });
    expect(result.total).toBe(2);
    expect(result.items.length).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('getHistory — paginates correctly', () => {
    for (let i = 0; i < 5; i++) tracker.openPosition('t1', 'pro', { ...POSITION_DATA });
    const page1 = tracker.getHistory('t1', { page: 1, limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.total).toBe(5);

    const page3 = tracker.getHistory('t1', { page: 3, limit: 2 });
    expect(page3.items.length).toBe(1);
  });

  it('getHistory — filters by symbol', () => {
    tracker.openPosition('t1', 'pro', { ...POSITION_DATA, symbol: 'BTC/USDT' });
    tracker.openPosition('t1', 'pro', { ...POSITION_DATA, symbol: 'ETH/USDT' });

    const result = tracker.getHistory('t1', { page: 1, limit: 20, symbol: 'ETH/USDT' });
    expect(result.total).toBe(1);
    expect(result.items[0]!.symbol).toBe('ETH/USDT');
  });

  // ── getStats ───────────────────────────────────────────────────────────────

  it('getStats — returns zero stats for tenant with no closed trades', () => {
    tracker.openPosition('t1', 'pro', POSITION_DATA); // open only
    const stats = tracker.getStats('t1');
    expect(stats.totalTrades).toBe(0);
    expect(stats.totalPnl).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.bestSpreadPct).toBe(0);
    expect(stats.avgPnl).toBe(0);
  });

  it('getStats — calculates win rate from closed positions', () => {
    const p1 = tracker.openPosition('t1', 'pro', POSITION_DATA)!;
    const p2 = tracker.openPosition('t1', 'pro', POSITION_DATA)!;
    tracker.closePosition('t1', p1.id, 1.0);   // win
    tracker.closePosition('t1', p2.id, -0.5);  // loss

    const stats = tracker.getStats('t1');
    expect(stats.totalTrades).toBe(2);
    expect(stats.winRate).toBe(0.5);
    expect(stats.totalPnl).toBeCloseTo(0.5, 5);
    expect(stats.avgPnl).toBeCloseTo(0.25, 5);
  });

  it('getStats — bestSpreadPct is max netSpreadPct among closed positions', () => {
    const p1 = tracker.openPosition('t1', 'pro', { ...POSITION_DATA, netSpreadPct: 0.3 })!;
    const p2 = tracker.openPosition('t1', 'pro', { ...POSITION_DATA, netSpreadPct: 0.8 })!;
    tracker.closePosition('t1', p1.id);
    tracker.closePosition('t1', p2.id);

    const stats = tracker.getStats('t1');
    expect(stats.bestSpreadPct).toBe(0.8);
  });

  // ── _reset ─────────────────────────────────────────────────────────────────

  it('_reset — clears positions for specific tenant', () => {
    tracker.openPosition('t1', 'pro', POSITION_DATA);
    tracker.openPosition('t2', 'pro', POSITION_DATA);
    tracker._reset('t1');
    expect(tracker.getPositions('t1')).toEqual([]);
    expect(tracker.getPositions('t2').length).toBe(1);
  });

  it('_reset — clears all positions when no tenantId given', () => {
    tracker.openPosition('t1', 'pro', POSITION_DATA);
    tracker.openPosition('t2', 'pro', POSITION_DATA);
    tracker._reset();
    expect(tracker.getPositions('t1')).toEqual([]);
    expect(tracker.getPositions('t2')).toEqual([]);
  });
});
