/**
 * Usage Tracker Service with KV - Unit Tests
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { UsageTrackerService, BillableEventType, EVENT_PRICING } from '../../src/metering/usage-tracker-service';

describe('UsageTrackerService with KV', () => {
  let tracker: UsageTrackerService;

  beforeEach(() => {
    tracker = UsageTrackerService.getInstance();
    tracker.clear();
  });

  afterEach(() => {
    tracker.clear();
    UsageTrackerService.resetInstance();
  });

  it('should track event with trackWithKVSync', async () => {
    const licenseKey = 'lic_test_123';
    const eventType = BillableEventType.API_CALL;
    const units = 1;

    await tracker.trackWithKVSync(licenseKey, eventType, units, {
      endpoint: '/v1/test',
      method: 'POST',
    });

    const usage = await tracker.getUsage(licenseKey, new Date().toISOString().slice(0, 7));
    assert.strictEqual(usage.totalUnits, 1);
    assert.strictEqual(usage.byEventType[eventType], 1);
  });

  it('should track backtest run event', async () => {
    const licenseKey = 'lic_backtest_test';
    const eventType = BillableEventType.BACKTEST_RUN;

    await tracker.trackWithKVSync(licenseKey, eventType, 1, {
      strategyId: 'strategy_001',
      symbol: 'BTC/USDT',
    });

    const usage = await tracker.getUsage(licenseKey, new Date().toISOString().slice(0, 7));
    assert.strictEqual(usage.byEventType[BillableEventType.BACKTEST_RUN], 1);
  });

  it('should track trade execution event', async () => {
    const licenseKey = 'lic_trade_test';
    const eventType = BillableEventType.TRADE_EXECUTION;

    await tracker.trackWithKVSync(licenseKey, eventType, 1, {
      orderId: 'order_001',
      symbol: 'ETH/USDT',
      side: 'buy',
    });

    const usage = await tracker.getUsage(licenseKey, new Date().toISOString().slice(0, 7));
    assert.strictEqual(usage.byEventType[BillableEventType.TRADE_EXECUTION], 1);
  });

  it('should calculate cost estimate', async () => {
    const licenseKey = 'lic_cost_test';

    // Track multiple event types
    await tracker.trackWithKVSync(licenseKey, BillableEventType.API_CALL, 100);
    await tracker.trackWithKVSync(licenseKey, BillableEventType.BACKTEST_RUN, 5);
    await tracker.trackWithKVSync(licenseKey, BillableEventType.TRADE_EXECUTION, 10);

    const month = new Date().toISOString().slice(0, 7);
    const costEstimate = await tracker.getCostEstimate(licenseKey, month);

    // API_CALL: 100 * $0.001 = $0.10
    // BACKTEST_RUN: 5 * $0.10 = $0.50
    // TRADE_EXECUTION: 10 * $0.02 = $0.20
    // Total: $0.80
    assert.strictEqual(costEstimate.totalCost, 0.80);
  });

  it('should filter usage by time range', async () => {
    const licenseKey = 'lic_filter_test';
    const now = Date.now();

    // Track events at different times
    await tracker.trackWithKVSync(licenseKey, BillableEventType.API_CALL, 1);
    await new Promise(resolve => setTimeout(resolve, 10));
    await tracker.trackWithKVSync(licenseKey, BillableEventType.BACKTEST_RUN, 1);

    const endTime = new Date().toISOString();
    const startTime = new Date(now - 1000).toISOString();

    const filtered = await tracker.getUsageFiltered(licenseKey, startTime, endTime);
    assert.strictEqual(filtered.length, 2);
  });

  it('should filter usage by event type', async () => {
    const licenseKey = 'lic_type_filter_test';

    await tracker.trackWithKVSync(licenseKey, BillableEventType.API_CALL, 1);
    await tracker.trackWithKVSync(licenseKey, BillableEventType.BACKTEST_RUN, 1);
    await tracker.trackWithKVSync(licenseKey, BillableEventType.TRADE_EXECUTION, 1);

    const filtered = await tracker.getUsageFiltered(
      licenseKey,
      undefined,
      undefined,
      BillableEventType.API_CALL
    );

    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].eventType, BillableEventType.API_CALL);
  });

  it('should sort events chronologically', async () => {
    const licenseKey = 'lic_sort_test';

    await tracker.trackWithKVSync(licenseKey, BillableEventType.API_CALL, 1);
    await new Promise(resolve => setTimeout(resolve, 10));
    await tracker.trackWithKVSync(licenseKey, BillableEventType.API_CALL, 1);
    await new Promise(resolve => setTimeout(resolve, 10));
    await tracker.trackWithKVSync(licenseKey, BillableEventType.API_CALL, 1);

    const filtered = await tracker.getUsageFiltered(licenseKey);

    assert.strictEqual(filtered.length, 3);
    assert.ok(new Date(filtered[0].timestamp).getTime() <= new Date(filtered[1].timestamp).getTime());
    assert.ok(new Date(filtered[1].timestamp).getTime() <= new Date(filtered[2].timestamp).getTime());
  });

  it('should have correct event pricing', () => {
    assert.strictEqual(EVENT_PRICING[BillableEventType.API_CALL], 0.001);
    assert.strictEqual(EVENT_PRICING[BillableEventType.BACKTEST_RUN], 0.10);
    assert.strictEqual(EVENT_PRICING[BillableEventType.TRADE_EXECUTION], 0.02);
    assert.strictEqual(EVENT_PRICING[BillableEventType.STRATEGY_EXECUTION], 0.05);
    assert.strictEqual(EVENT_PRICING[BillableEventType.ML_INFERENCE], 0.01);
    assert.strictEqual(EVENT_PRICING[BillableEventType.COMPUTE_MINUTE], 0.05);
    assert.strictEqual(EVENT_PRICING[BillableEventType.WEBSOCKET_MESSAGE], 0.0001);
  });
});
