/**
 * Tests for trailing stop feature in TenantArbPositionTracker.
 */

import { TenantArbPositionTracker } from '../../src/core/tenant-arbitrage-position-tracker';

describe('TenantArbPositionTracker — Trailing Stop', () => {
  let tracker: TenantArbPositionTracker;

  beforeEach(() => {
    tracker = new TenantArbPositionTracker();
  });

  const posData = {
    symbol: 'BTC/USDT',
    buyExchange: 'binance',
    sellExchange: 'okx',
    buyPrice: 50000,
    sellPrice: 50100,
    amount: 0.1,
    netSpreadPct: 0.2,
  };

  it('setTrailingStopConfig stores config per tenant', () => {
    tracker.setTrailingStopConfig('t1', { enabled: true, atrMultiplier: 2.0, atrPeriod: 14 });
    const pos = tracker.openPosition('t1', 'pro', posData);
    expect(pos).not.toBeNull();
    expect(pos!.highWaterMark).toBeDefined();
    expect(pos!.trailingStopTriggered).toBe(false);
  });

  it('openPosition initializes trailing stop fields when enabled', () => {
    tracker.setTrailingStopConfig('t1', { enabled: true, atrMultiplier: 2.0, atrPeriod: 14 });
    const pos = tracker.openPosition('t1', 'pro', posData);
    expect(pos!.highWaterMark).toBe(50100); // max(buyPrice, sellPrice)
  });

  it('openPosition does NOT set trailing stop fields when disabled', () => {
    tracker.setTrailingStopConfig('t1', { enabled: false, atrMultiplier: 2.0, atrPeriod: 14 });
    const pos = tracker.openPosition('t1', 'pro', posData);
    expect(pos!.highWaterMark).toBeUndefined();
  });

  it('updatePriceTick updates highWaterMark when price rises', () => {
    tracker.setTrailingStopConfig('t1', { enabled: true, atrMultiplier: 2.0, atrPeriod: 14 });
    const pos = tracker.openPosition('t1', 'pro', posData)!;

    const { triggered, position } = tracker.updatePriceTick('t1', pos.id, 51000, 500);
    expect(triggered).toBe(false);
    expect(position!.highWaterMark).toBe(51000);
  });

  it('updatePriceTick triggers stop when price drops below trailing level', () => {
    tracker.setTrailingStopConfig('t1', { enabled: true, atrMultiplier: 2.0, atrPeriod: 14 });
    const pos = tracker.openPosition('t1', 'pro', posData)!;

    // Price rises to 52000
    tracker.updatePriceTick('t1', pos.id, 52000, 500);

    // Price crashes below stop: stop = 52000 - 2*500 = 51000
    const { triggered, position } = tracker.updatePriceTick('t1', pos.id, 50800, 500);
    expect(triggered).toBe(true);
    expect(position!.trailingStopTriggered).toBe(true);
    expect(position!.status).toBe('closed');
  });

  it('updatePriceTick returns false for unknown position', () => {
    const { triggered, position } = tracker.updatePriceTick('t1', 'nonexistent', 50000, 500);
    expect(triggered).toBe(false);
    expect(position).toBeNull();
  });

  it('updatePriceTick returns false when trailing stop not enabled', () => {
    const pos = tracker.openPosition('t1', 'pro', posData)!;
    const { triggered } = tracker.updatePriceTick('t1', pos.id, 50000, 500);
    expect(triggered).toBe(false);
  });

  it('_reset clears trailing configs', () => {
    tracker.setTrailingStopConfig('t1', { enabled: true, atrMultiplier: 2.0, atrPeriod: 14 });
    tracker._reset('t1');
    // After reset, opening position should NOT have trailing stop fields
    const pos = tracker.openPosition('t1', 'pro', posData);
    expect(pos!.highWaterMark).toBeUndefined();
  });
});
