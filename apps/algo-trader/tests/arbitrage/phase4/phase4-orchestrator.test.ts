/**
 * Tests: Phase4Orchestrator — integration of all Phase 4 modules (SIMULATION ONLY)
 */

import { Phase4Orchestrator } from '../../../src/arbitrage/phase4/phase4-orchestrator';
import type { Phase4Config } from '../../../src/arbitrage/phase4/phase4-orchestrator';

describe('Phase4Orchestrator — all disabled', () => {
  test('starts and stops without error', async () => {
    const orch = new Phase4Orchestrator({});
    await expect(orch.start()).resolves.toBeUndefined();
    expect(orch.isRunning()).toBe(true);
    await orch.stop();
    expect(orch.isRunning()).toBe(false);
  });

  test('getStatus returns all modules disabled', async () => {
    const orch = new Phase4Orchestrator({});
    await orch.start();
    const status = orch.getStatus();
    expect(status.polymarketSentinel.enabled).toBe(false);
    expect(status.sybilMirage.enabled).toBe(false);
    expect(status.shadowLayering.enabled).toBe(false);
    await orch.stop();
  });
});

describe('Phase4Orchestrator — Polymarket Sentinel enabled', () => {
  test('starts sentinel and reflects status', async () => {
    const config: Phase4Config = {
      polymarketSentinel: { enabled: true, pollIntervalMs: 60000, signalThreshold: 0.5 },
    };
    const orch = new Phase4Orchestrator(config);
    await orch.start();
    const status = orch.getStatus();
    expect(status.polymarketSentinel.enabled).toBe(true);
    await orch.stop();
    expect(orch.getStatus().polymarketSentinel.enabled).toBe(false);
  });
});

describe('Phase4Orchestrator — Sybil Mirage enabled', () => {
  test('starts sybil engine and reflects status', async () => {
    const config: Phase4Config = {
      sybilMirage: { enabled: true, numWallets: 10, txIntervalMs: 60000, dumpThreshold: 0.9 },
    };
    const orch = new Phase4Orchestrator(config);
    await orch.start();
    const status = orch.getStatus();
    expect(status.sybilMirage.enabled).toBe(true);
    await orch.stop();
    expect(orch.getStatus().sybilMirage.enabled).toBe(false);
  });
});

describe('Phase4Orchestrator — Shadow Layering enabled', () => {
  test('starts shadow engine and reflects status', async () => {
    const config: Phase4Config = {
      shadowLayering: { enabled: true, simulatedLatencyMs: 60000, icebergSizes: [5, 10] },
    };
    const orch = new Phase4Orchestrator(config);
    await orch.start();
    const status = orch.getStatus();
    expect(status.shadowLayering.enabled).toBe(true);
    await orch.stop();
    expect(orch.getStatus().shadowLayering.enabled).toBe(false);
  });
});

describe('Phase4Orchestrator — ws:message forwarding', () => {
  test('forwards ws:message from sentinel', async () => {
    const config: Phase4Config = {
      polymarketSentinel: { enabled: true, pollIntervalMs: 60000 },
    };
    const orch = new Phase4Orchestrator(config);
    const messages: unknown[] = [];
    orch.on('ws:message', msg => messages.push(msg));
    await orch.start();
    expect(orch.isRunning()).toBe(true);
    await orch.stop();
  });
});

describe('Phase4Orchestrator — idempotent operations', () => {
  test('double start is idempotent', async () => {
    const orch = new Phase4Orchestrator({});
    await orch.start();
    await expect(orch.start()).resolves.toBeUndefined();
    await orch.stop();
  });

  test('stop on non-started orchestrator does not throw', async () => {
    const orch = new Phase4Orchestrator({});
    await expect(orch.stop()).resolves.toBeUndefined();
  });

  test('emits started event with status payload', async () => {
    const config: Phase4Config = { polymarketSentinel: { enabled: true, pollIntervalMs: 60000 } };
    const orch = new Phase4Orchestrator(config);
    const handler = jest.fn();
    orch.on('started', handler);
    await orch.start();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toHaveProperty('polymarketSentinel');
    await orch.stop();
  });
});
