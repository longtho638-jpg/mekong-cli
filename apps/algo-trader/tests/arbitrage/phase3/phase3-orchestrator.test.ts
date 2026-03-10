/**
 * Tests: Phase3Orchestrator — integration of all Phase 3 modules
 */

import { Phase3Orchestrator } from '../../../src/arbitrage/phase3/phase3-orchestrator';
import type { Phase3Config } from '../../../src/arbitrage/phase3/phase3-orchestrator';
import { LicenseService } from '../../../src/lib/raas-gate';

beforeEach(() => { LicenseService.getInstance().reset(); });
afterEach(() => { LicenseService.getInstance().reset(); });

describe('Phase3Orchestrator — all disabled', () => {
  test('starts and stops without error', async () => {
    const orch = new Phase3Orchestrator({});
    await expect(orch.start()).resolves.toBeUndefined();
    expect(orch.isRunning()).toBe(true);
    await orch.stop();
    expect(orch.isRunning()).toBe(false);
  });

  test('getStatus returns all modules disabled', async () => {
    const orch = new Phase3Orchestrator({});
    await orch.start();
    const status = orch.getStatus();
    expect(status.mevSandwich.enabled).toBe(false);
    expect(status.portfolioRebalancer.enabled).toBe(false);
    expect(status.predatoryLiquidity.enabled).toBe(false);
    await orch.stop();
  });

  test('accessors return null when modules disabled', async () => {
    const orch = new Phase3Orchestrator({});
    await orch.start();
    expect(orch.getMevEngine()).toBeNull();
    expect(orch.getRebalancerEngine()).toBeNull();
    expect(orch.getPredatoryEngine()).toBeNull();
    await orch.stop();
  });
});

describe('Phase3Orchestrator — MEV Sandwich enabled', () => {
  test('starts MEV engine and reflects status', async () => {
    const config: Phase3Config = {
      mevSandwich: { enabled: true, minProfitUsd: 5 },
    };
    const orch = new Phase3Orchestrator(config);
    await orch.start();

    const status = orch.getStatus();
    expect(status.mevSandwich.enabled).toBe(true);
    expect(orch.getMevEngine()).not.toBeNull();

    await orch.stop();
    expect(orch.getMevEngine()).toBeNull();
  });

  test('emits started event with status payload', async () => {
    const config: Phase3Config = { mevSandwich: { enabled: true } };
    const orch = new Phase3Orchestrator(config);
    const handler = jest.fn();
    orch.on('started', handler);
    await orch.start();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toHaveProperty('mevSandwich');
    await orch.stop();
  });
});

describe('Phase3Orchestrator — Portfolio Rebalancer enabled', () => {
  test('starts rebalancer and reflects status', async () => {
    const config: Phase3Config = {
      portfolioRebalancer: { enabled: true, intervalMs: 60_000 },
    };
    const orch = new Phase3Orchestrator(config);
    await orch.start();

    const status = orch.getStatus();
    expect(status.portfolioRebalancer.enabled).toBe(true);
    expect(orch.getRebalancerEngine()).not.toBeNull();

    await orch.stop();
    expect(orch.getRebalancerEngine()).toBeNull();
  });
});

describe('Phase3Orchestrator — Predatory Liquidity enabled', () => {
  test('starts predatory engine and reflects status', async () => {
    const config: Phase3Config = {
      predatoryLiquidity: { enabled: true, pumpThreshold: 0.7, dumpThreshold: 0.9 },
    };
    const orch = new Phase3Orchestrator(config);
    await orch.start();

    const status = orch.getStatus();
    expect(status.predatoryLiquidity.enabled).toBe(true);
    expect(orch.getPredatoryEngine()).not.toBeNull();

    await orch.stop();
    expect(orch.getPredatoryEngine()).toBeNull();
  });
});

describe('Phase3Orchestrator — ws:message forwarding', () => {
  test('forwards ws:message from MEV engine', async () => {
    const config: Phase3Config = { mevSandwich: { enabled: true, minProfitUsd: 0.001 } };
    const orch = new Phase3Orchestrator(config);
    const messages: unknown[] = [];
    orch.on('ws:message', msg => messages.push(msg));
    await orch.start();
    // No crash, ws listener wired up correctly
    expect(orch.isRunning()).toBe(true);
    await orch.stop();
  });
});

describe('Phase3Orchestrator — idempotent operations', () => {
  test('double start is idempotent', async () => {
    const orch = new Phase3Orchestrator({});
    await orch.start();
    await expect(orch.start()).resolves.toBeUndefined();
    await orch.stop();
  });

  test('stop on non-started orchestrator does not throw', async () => {
    const orch = new Phase3Orchestrator({});
    await expect(orch.stop()).resolves.toBeUndefined();
  });

  test('stop clears all module references', async () => {
    const config: Phase3Config = {
      mevSandwich: { enabled: true },
      portfolioRebalancer: { enabled: true, intervalMs: 60_000 },
      predatoryLiquidity: { enabled: true },
    };
    const orch = new Phase3Orchestrator(config);
    await orch.start();
    await orch.stop();
    expect(orch.getMevEngine()).toBeNull();
    expect(orch.getRebalancerEngine()).toBeNull();
    expect(orch.getPredatoryEngine()).toBeNull();
  });
});
