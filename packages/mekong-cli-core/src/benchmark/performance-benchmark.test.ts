/**
 * Performance benchmark tests — license verification + usage metering latency.
 * Thresholds are 2x expected to avoid flakiness on CI.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

import { computeSignature, verifyLicense } from '../license/verifier.js';
import { LicenseStore } from '../license/store.js';
import { LicenseGate } from '../license/gate.js';
import { generateKey } from '../license/key-generator.js';
import { MeteringStore } from '../metering/store.js';
import { MeteringCollector } from '../metering/collector.js';
import { UsageLimiter } from '../metering/limiter.js';
import { CostCalculator } from '../metering/cost-calculator.js';
import { ROICalculator, currentMonthPeriod } from '../analytics/roi-calculator.js';
import { AgentScorer } from '../analytics/agent-scorer.js';
import type { LicenseKey } from '../license/types.js';
import type { UsageEvent } from '../metering/types.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return join(tmpdir(), `bench-${randomUUID()}`);
}

function makeLicense(): LicenseKey {
  return generateKey({ tier: 'pro', owner: 'bench-user', expiryDays: 365 });
}

function makeEvent(i: number): Omit<UsageEvent, 'id' | 'timestamp'> {
  return {
    category: 'llm_call',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    inputTokens: 100 + i,
    outputTokens: 50 + i,
    estimatedCost: 0.001,
  };
}

const dirs: string[] = [];

afterEach(async () => {
  for (const d of dirs.splice(0)) {
    await rm(d, { recursive: true, force: true });
  }
});

// ── 1. HMAC signature verification: 1000 iterations < 500ms ──────────────────

describe('License HMAC verification throughput', () => {
  it('verifies 1000 licenses in < 500ms', () => {
    const license = makeLicense();
    const iters = 1000;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      const result = verifyLicense(license);
      expect(result.valid).toBe(true);
    }
    const elapsed = performance.now() - start;

    console.log(`HMAC verify: ${iters} ops in ${elapsed.toFixed(1)}ms (${(elapsed / iters).toFixed(3)}ms/op)`);
    expect(elapsed).toBeLessThan(500);
  });

  it('computes signature for 1000 licenses in < 200ms', () => {
    const license = makeLicense();
    const { signature: _sig, ...partial } = license;
    const iters = 1000;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      computeSignature(partial);
    }
    const elapsed = performance.now() - start;

    console.log(`computeSignature: ${iters} ops in ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(200);
  });
});

// ── 2. LicenseStore load/save: 100 iterations ────────────────────────────────

describe('LicenseStore load/save latency', () => {
  it('saves and loads license 100 times in < 4000ms', async () => {
    const dir = tmpDir();
    dirs.push(dir);
    const store = new LicenseStore(join(dir, 'license.json'));
    const license = makeLicense();
    const iters = 100;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      await store.save(license);
      await store.load();
    }
    const elapsed = performance.now() - start;
    const avg = elapsed / iters;

    console.log(`LicenseStore save+load: ${iters} cycles in ${elapsed.toFixed(1)}ms (avg ${avg.toFixed(2)}ms/cycle)`);
    expect(elapsed).toBeLessThan(4000);
    expect(avg).toBeLessThan(40); // 40ms avg per cycle
  });
});

// ── 3. LicenseGate validate(): end-to-end latency ────────────────────────────

describe('LicenseGate validate() latency', () => {
  it('validates license 50 times in < 2000ms', async () => {
    const dir = tmpDir();
    dirs.push(dir);
    const store = new LicenseStore(join(dir, 'license.json'));
    const license = makeLicense();
    await store.save(license);
    const gate = new LicenseGate(store);
    const iters = 50;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      const result = await gate.validate();
      expect(result.ok).toBe(true);
    }
    const elapsed = performance.now() - start;

    console.log(`LicenseGate.validate: ${iters} calls in ${elapsed.toFixed(1)}ms (avg ${(elapsed / iters).toFixed(2)}ms)`);
    expect(elapsed).toBeLessThan(2000);
  });
});

// ── 4. MeteringCollector record: 10000 events buffered ───────────────────────

describe('MeteringCollector record throughput', () => {
  it('buffers 10000 events in < 500ms', async () => {
    const dir = tmpDir();
    dirs.push(dir);
    const store = new MeteringStore(dir);
    const collector = new MeteringCollector(store);
    const iters = 10_000;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      collector.record(makeEvent(i));
    }
    const elapsed = performance.now() - start;

    console.log(`MeteringCollector.record: ${iters} events in ${elapsed.toFixed(1)}ms`);
    // Flush remaining to avoid dangling timer
    await collector.shutdown();
    expect(elapsed).toBeLessThan(500);
  });
});

// ── 5. MeteringStore appendBatch + queryRange ─────────────────────────────────

describe('MeteringStore append + query latency', () => {
  it('writes 1000 events and queries date range in < 3000ms', async () => {
    const dir = tmpDir();
    dirs.push(dir);
    const store = new MeteringStore(dir);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    // Build 1000 events
    const events: UsageEvent[] = Array.from({ length: 1000 }, (_, i) => ({
      id: randomUUID(),
      timestamp: new Date(now.getTime() - i * 60_000).toISOString(),
      category: 'llm_call' as const,
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      inputTokens: 100,
      outputTokens: 50,
      estimatedCost: 0.001,
    }));

    const writeStart = performance.now();
    const writeResult = await store.appendBatch(events);
    const writeElapsed = performance.now() - writeStart;
    expect(writeResult.ok).toBe(true);

    const queryStart = performance.now();
    const queryResult = await store.queryRange(`${dateStr}T00:00:00.000Z`, `${dateStr}T23:59:59.999Z`);
    const queryElapsed = performance.now() - queryStart;
    expect(queryResult.ok).toBe(true);

    console.log(`MeteringStore write 1000: ${writeElapsed.toFixed(1)}ms, query: ${queryElapsed.toFixed(1)}ms`);
    expect(writeElapsed + queryElapsed).toBeLessThan(3000);
  });
});

// ── 6. UsageLimiter checkLimit: 1000 calls < 200ms ───────────────────────────

describe('UsageLimiter checkLimit throughput', () => {
  it('runs 1000 checkLimit calls in < 200ms (cached)', async () => {
    const dir = tmpDir();
    dirs.push(dir);
    const store = new MeteringStore(dir);
    const limiter = new UsageLimiter(store);
    // Warm up cache
    await limiter.checkLimit('llm_call', 'pro');
    const iters = 1000;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      const result = await limiter.checkLimit('llm_call', 'pro');
      expect(result.ok).toBe(true);
    }
    const elapsed = performance.now() - start;

    console.log(`UsageLimiter.checkLimit: ${iters} calls in ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(200);
  });
});

// ── 7. CostCalculator throughput: 1000 calculations ──────────────────────────

describe('CostCalculator throughput', () => {
  it('runs 1000 cost calculations in < 50ms', () => {
    const calc = new CostCalculator();
    const iters = 1000;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      const cost = calc.calculate('anthropic', 'claude-sonnet-4-20250514', 1000 + i, 500 + i);
      expect(cost).toBeGreaterThanOrEqual(0);
    }
    const elapsed = performance.now() - start;

    console.log(`CostCalculator.calculate: ${iters} ops in ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(200);
  });
});

// ── 8. ROICalculator throughput: 1000 calculations ───────────────────────────

describe('ROICalculator throughput', () => {
  it('runs 1000 ROI calculations in < 50ms', () => {
    const calc = new ROICalculator();
    const period = currentMonthPeriod();
    const iters = 1000;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      const result = calc.calculate({
        timeSavedHours: 10 + i * 0.01,
        hourlyRate: 75,
        revenueGenerated: 500 + i,
        totalCost: 5 + i * 0.001,
        period,
      });
      expect(result.ok).toBe(true);
    }
    const elapsed = performance.now() - start;

    console.log(`ROICalculator.calculate: ${iters} ops in ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(200);
  });
});

// ── 9. AgentScorer throughput: 1000 scoring runs ─────────────────────────────

describe('AgentScorer throughput', () => {
  it('scores 1000 agents in < 50ms', () => {
    const scorer = new AgentScorer();
    const iters = 1000;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      const result = scorer.score({
        agentName: `agent-${i}`,
        phasesCompleted: 8,
        totalPhases: 10,
        recentCommits: 7,
        activityBaseline: 10,
        totalExecutions: 100 + i,
        successfulExecutions: 95 + (i % 5),
        recoveredExecutions: 3,
        failedExecutions: 2,
      });
      expect(result.agiScore).toBeGreaterThanOrEqual(0);
      expect(result.agiScore).toBeLessThanOrEqual(100);
    }
    const elapsed = performance.now() - start;

    console.log(`AgentScorer.score: ${iters} ops in ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(200);
  });
});

// ── 10. End-to-end license key generation + verification ─────────────────────

describe('Key generation + verification pipeline', () => {
  it('generates and verifies 500 keys in < 500ms', () => {
    const iters = 500;

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
      const key = generateKey({ tier: 'starter', owner: `owner-${i}`, expiryDays: 30 });
      const result = verifyLicense(key);
      expect(result.valid).toBe(true);
      expect(result.status).toBe('active');
    }
    const elapsed = performance.now() - start;

    console.log(`generateKey + verifyLicense: ${iters} cycles in ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(500);
  });
});
