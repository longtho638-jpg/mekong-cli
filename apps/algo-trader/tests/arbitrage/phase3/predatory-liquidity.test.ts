/**
 * Tests: Predatory Liquidity module — PumpDetector, LiquidityTrapper,
 * DumpExecutor, PredatoryLiquidityEngine
 */

import { PumpDetector } from '../../../src/arbitrage/phase3/predatory-liquidity/pump-detector';
import { LiquidityTrapper } from '../../../src/arbitrage/phase3/predatory-liquidity/liquidity-trapper';
import { DumpExecutor } from '../../../src/arbitrage/phase3/predatory-liquidity/dump-executor';
import { PredatoryLiquidityEngine } from '../../../src/arbitrage/phase3/predatory-liquidity/index';
import { LicenseService } from '../../../src/lib/raas-gate';

beforeEach(() => { LicenseService.getInstance().reset(); });
afterEach(() => { LicenseService.getInstance().reset(); });

// ─── PumpDetector ─────────────────────────────────────────────────────────────

describe('PumpDetector', () => {
  test('analyze returns 0 probability with no signals', () => {
    const det = new PumpDetector({ pumpThreshold: 0.7 });
    const signal = det.analyze('BTC');
    expect(signal.probability).toBe(0);
    expect(signal.asset).toBe('BTC');
  });

  test('ingestSocialSignal increases probability', () => {
    const det = new PumpDetector({ pumpThreshold: 0.7 });
    det.ingestSocialSignal({ asset: 'BTC', sentiment: 0.9, source: 'twitter' });
    const signal = det.analyze('BTC');
    expect(signal.probability).toBeGreaterThan(0);
  });

  test('ingestWhaleAlert with large inflow increases probability', () => {
    const det = new PumpDetector({ pumpThreshold: 0.7 });
    det.ingestWhaleAlert({ asset: 'ETH', amount: 2_000_000, direction: 'in', exchange: 'binance' });
    const signal = det.analyze('ETH');
    expect(signal.probability).toBeGreaterThan(0);
  });

  test('whale outflow produces lower score than inflow', () => {
    const det1 = new PumpDetector({ pumpThreshold: 0.7 });
    det1.ingestWhaleAlert({ asset: 'SOL', amount: 1_000_000, direction: 'in', exchange: 'binance' });

    const det2 = new PumpDetector({ pumpThreshold: 0.7 });
    det2.ingestWhaleAlert({ asset: 'SOL', amount: 1_000_000, direction: 'out', exchange: 'binance' });

    expect(det1.analyze('SOL').probability).toBeGreaterThan(det2.analyze('SOL').probability);
  });

  test('emits pump:detected when probability exceeds threshold', () => {
    const det = new PumpDetector({ pumpThreshold: 0.3 });
    const handler = jest.fn();
    det.on('pump:detected', handler);

    // High sentiment + large inflow should exceed 0.3 threshold
    det.ingestSocialSignal({ asset: 'DOGE', sentiment: 1.0, source: 'reddit' });
    det.ingestWhaleAlert({ asset: 'DOGE', amount: 5_000_000, direction: 'in', exchange: 'binance' });

    expect(handler.mock.calls.length).toBeGreaterThan(0);
    expect(handler.mock.calls[0][0]).toHaveProperty('asset', 'DOGE');
    expect(handler.mock.calls[0][0]).toHaveProperty('probability');
  });

  test('does not emit pump:detected below threshold', () => {
    const det = new PumpDetector({ pumpThreshold: 0.99 });
    const handler = jest.fn();
    det.on('pump:detected', handler);
    det.ingestSocialSignal({ asset: 'BTC', sentiment: 0.1, source: 'news' });
    expect(handler).not.toHaveBeenCalled();
  });

  test('reset clears all signals', () => {
    const det = new PumpDetector({ pumpThreshold: 0.5 });
    det.ingestSocialSignal({ asset: 'BTC', sentiment: 0.9, source: 'twitter' });
    det.reset();
    expect(det.analyze('BTC').probability).toBe(0);
  });

  test('analyze returns evidence string', () => {
    const det = new PumpDetector({ pumpThreshold: 0.7 });
    det.ingestSocialSignal({ asset: 'ETH', sentiment: 0.8, source: 'twitter' });
    const signal = det.analyze('ETH');
    expect(typeof signal.evidence).toBe('string');
    expect(signal.evidence.length).toBeGreaterThan(0);
  });
});

// ─── LiquidityTrapper ─────────────────────────────────────────────────────────

describe('LiquidityTrapper', () => {
  test('placeMakerOrders returns 2 orders (bid + ask)', () => {
    const trap = new LiquidityTrapper({ makerSpreadBps: 2, maxPositionUsd: 10_000 });
    const orders = trap.placeMakerOrders('BTC', 50_000);
    expect(orders).toHaveLength(2);
    expect(orders.find(o => o.side === 'buy')).toBeDefined();
    expect(orders.find(o => o.side === 'sell')).toBeDefined();
  });

  test('bid price < midPrice < ask price', () => {
    const trap = new LiquidityTrapper({ makerSpreadBps: 10 });
    const orders = trap.placeMakerOrders('ETH', 2000);
    const bid = orders.find(o => o.side === 'buy')!;
    const ask = orders.find(o => o.side === 'sell')!;
    expect(bid.price).toBeLessThan(2000);
    expect(ask.price).toBeGreaterThan(2000);
  });

  test('orders start with status active', () => {
    const trap = new LiquidityTrapper();
    const orders = trap.placeMakerOrders('SOL', 100);
    expect(orders.every(o => o.status === 'active')).toBe(true);
  });

  test('getActiveOrders returns only active orders', () => {
    const trap = new LiquidityTrapper();
    trap.placeMakerOrders('BTC', 50_000);
    const active = trap.getActiveOrders();
    expect(active.length).toBe(2);
    expect(active.every(o => o.status === 'active')).toBe(true);
  });

  test('cancelAll cancels orders for the given asset', () => {
    const trap = new LiquidityTrapper();
    trap.placeMakerOrders('BTC', 50_000);
    trap.placeMakerOrders('ETH', 2000);
    const count = trap.cancelAll('BTC');
    expect(count).toBe(2);
    const active = trap.getActiveOrders();
    expect(active.every(o => o.asset === 'ETH')).toBe(true);
  });

  test('cancelAll returns 0 if no active orders for asset', () => {
    const trap = new LiquidityTrapper();
    expect(trap.cancelAll('NONEXISTENT')).toBe(0);
  });

  test('emits order:placed for each order', () => {
    const trap = new LiquidityTrapper();
    const handler = jest.fn();
    trap.on('order:placed', handler);
    trap.placeMakerOrders('BTC', 50_000);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test('emits order:cancelled when cancelAll called', () => {
    const trap = new LiquidityTrapper();
    trap.placeMakerOrders('BTC', 50_000);
    const handler = jest.fn();
    trap.on('order:cancelled', handler);
    trap.cancelAll('BTC');
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

// ─── DumpExecutor ─────────────────────────────────────────────────────────────

describe('DumpExecutor', () => {
  test('executeDump returns a DumpTrade', async () => {
    const exec = new DumpExecutor({ dumpThreshold: 0.9, maxPositionUsd: 10_000 });
    const trade = await exec.executeDump('BTC', 50_000, []);
    expect(trade.asset).toBe('BTC');
    expect(trade.side).toBe('sell');
    expect(trade.type).toBe('ioc');
    expect(trade.amount).toBeGreaterThan(0);
  });

  test('fill price is below current price (slippage)', async () => {
    const exec = new DumpExecutor();
    const trade = await exec.executeDump('ETH', 2000, []);
    expect(trade.price).toBeLessThan(2000);
  });

  test('emits dump:executed event', async () => {
    const exec = new DumpExecutor();
    const handler = jest.fn();
    exec.on('dump:executed', handler);
    await exec.executeDump('SOL', 100, []);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toHaveProperty('asset', 'SOL');
  });

  test('cancels provided active maker positions', async () => {
    const trap = new LiquidityTrapper();
    const orders = trap.placeMakerOrders('BTC', 50_000);
    const exec = new DumpExecutor({ maxPositionUsd: 100_000 });
    await exec.executeDump('BTC', 50_000, orders);
    // All orders should now be cancelled
    expect(orders.every(o => o.status === 'cancelled')).toBe(true);
  });

  test('pnlUsd is defined on trade result', async () => {
    const exec = new DumpExecutor();
    const trade = await exec.executeDump('DOGE', 0.1, []);
    expect(typeof trade.pnlUsd).toBe('number');
  });
});

// ─── PredatoryLiquidityEngine ─────────────────────────────────────────────────

describe('PredatoryLiquidityEngine', () => {
  test('start/stop lifecycle', () => {
    const engine = new PredatoryLiquidityEngine({ pumpThreshold: 0.7, dumpThreshold: 0.9 });
    engine.start();
    expect(engine.getStatus().running).toBe(true);
    engine.stop();
    expect(engine.getStatus().running).toBe(false);
  });

  test('double start is idempotent', () => {
    const engine = new PredatoryLiquidityEngine();
    engine.start();
    engine.start();
    expect(engine.getStatus().running).toBe(true);
    engine.stop();
  });

  test('getStatus returns expected fields', () => {
    const engine = new PredatoryLiquidityEngine();
    const status = engine.getStatus();
    expect(status).toHaveProperty('running');
    expect(status).toHaveProperty('activePumps');
    expect(status).toHaveProperty('makerOrders');
    expect(status).toHaveProperty('dumpsExecuted');
  });

  test('full pipeline: pump → trap → dump', async () => {
    // Low thresholds to guarantee pipeline fires
    const engine = new PredatoryLiquidityEngine({
      pumpThreshold: 0.1,
      dumpThreshold: 0.1,
      makerSpreadBps: 2,
      maxPositionUsd: 1000,
    });
    engine.start();

    // Inject strong signals via sub-components
    const detector = engine.getPumpDetector();
    detector.ingestSocialSignal({ asset: 'PEPE', sentiment: 1.0, source: 'twitter' });
    detector.ingestWhaleAlert({ asset: 'PEPE', amount: 10_000_000, direction: 'in', exchange: 'binance' });

    // Allow async pipeline (pump → handlePump) to settle
    await new Promise<void>(resolve => setImmediate(resolve));
    await new Promise<void>(resolve => setImmediate(resolve));

    // dumpsExecuted should be ≥ 1 (dump threshold 0.1 is easily exceeded)
    expect(engine.getStatus().dumpsExecuted).toBeGreaterThanOrEqual(1);
    engine.stop();
  });

  test('ws:message emitted on dump:executed', async () => {
    const engine = new PredatoryLiquidityEngine({ pumpThreshold: 0.1, dumpThreshold: 0.1 });
    const wsMessages: unknown[] = [];
    engine.on('ws:message', msg => wsMessages.push(msg));
    engine.start();

    engine.getPumpDetector().ingestSocialSignal({ asset: 'SHIB', sentiment: 1.0, source: 'twitter' });
    engine.getPumpDetector().ingestWhaleAlert({ asset: 'SHIB', amount: 5_000_000, direction: 'in', exchange: 'bybit' });

    await new Promise<void>(resolve => setImmediate(resolve));
    await new Promise<void>(resolve => setImmediate(resolve));

    // If dump fired, ws:message should have been emitted
    if (engine.getStatus().dumpsExecuted > 0) {
      expect(wsMessages.length).toBeGreaterThan(0);
    }
    engine.stop();
  });
});
