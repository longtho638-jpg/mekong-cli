/**
 * Unit tests for PnlSnapshotService — verifies P&L computation from position tracker
 * and snapshot persistence using InMemoryPnlStore (no DB required).
 */

import { PnlSnapshotService, InMemoryPnlStore } from './pnl-realtime-snapshot-service';
import { TenantArbPositionTracker } from './tenant-arbitrage-position-tracker';

const TENANT = 'tenant-pnl-test';

function makeTracker(): TenantArbPositionTracker {
  const tracker = new TenantArbPositionTracker();
  // One open position: buy=100, sell=102, amount=5 → pnl = (102-100)*5 = 10
  tracker.openPosition(TENANT, 'pro', {
    symbol: 'BTC/USDT',
    buyExchange: 'binance',
    sellExchange: 'kraken',
    buyPrice: 100,
    sellPrice: 102,
    amount: 5,
    netSpreadPct: 2,
  });
  // One closed position with pnl=20
  const pos = tracker.openPosition(TENANT, 'pro', {
    symbol: 'ETH/USDT',
    buyExchange: 'binance',
    sellExchange: 'okx',
    buyPrice: 200,
    sellPrice: 210,
    amount: 1,
    netSpreadPct: 5,
  });
  if (pos) tracker.closePosition(TENANT, pos.id, 20);
  return tracker;
}

describe('pnl-realtime-snapshot-service', () => {
  let tracker: TenantArbPositionTracker;
  let store: InMemoryPnlStore;
  let service: PnlSnapshotService;

  beforeEach(() => {
    tracker = makeTracker();
    store = new InMemoryPnlStore();
    service = new PnlSnapshotService(tracker, store, 10_000);
  });

  it('should compute current P&L from position tracker', () => {
    const summary = service.getCurrentPnl(TENANT);
    expect(summary.tenantId).toBe(TENANT);
    // unrealized = open position pnl = 10
    expect(summary.unrealizedPnl).toBeCloseTo(10);
    // realized = closed trades totalPnl = 20
    expect(summary.realizedPnl).toBeCloseTo(20);
    // total = 30
    expect(summary.totalPnl).toBeCloseTo(30);
    // equity = 10000 + 30
    expect(summary.equity).toBeCloseTo(10_030);
    expect(summary.openPositions).toBe(1);
    expect(typeof summary.computedAt).toBe('string');
  });

  it('should handle empty positions (no trades for tenant)', () => {
    const emptyTracker = new TenantArbPositionTracker();
    const emptyService = new PnlSnapshotService(emptyTracker, store, 10_000);
    const summary = emptyService.getCurrentPnl('unknown-tenant');
    expect(summary.totalPnl).toBe(0);
    expect(summary.realizedPnl).toBe(0);
    expect(summary.unrealizedPnl).toBe(0);
    expect(summary.openPositions).toBe(0);
    expect(summary.equity).toBe(10_000);
  });

  it('should take snapshot and store it', async () => {
    const snap = await service.takeSnapshot(TENANT);
    expect(snap.tenantId).toBe(TENANT);
    expect(snap.totalPnl).toBeCloseTo(30);
    expect(snap.snapshotAt).toBeInstanceOf(Date);

    const results = await service.getSnapshots(TENANT);
    expect(results).toHaveLength(1);
    expect(results[0].tenantId).toBe(TENANT);
  });

  it('should query snapshots with date range', async () => {
    const before = new Date(Date.now() - 1000);
    await service.takeSnapshot(TENANT);
    const after = new Date(Date.now() + 1000);

    const all = await service.getSnapshots(TENANT, { from: before, to: after });
    expect(all).toHaveLength(1);

    const none = await service.getSnapshots(TENANT, { from: after });
    expect(none).toHaveLength(0);
  });

  it('should respect limit when querying snapshots', async () => {
    await service.takeSnapshot(TENANT);
    await service.takeSnapshot(TENANT);
    await service.takeSnapshot(TENANT);

    const limited = await service.getSnapshots(TENANT, { limit: 2 });
    expect(limited).toHaveLength(2);
  });
});
