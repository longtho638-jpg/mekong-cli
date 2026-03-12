/**
 * integration-e2e.test.ts — end-to-end integration tests.
 * Flow 1: License Lifecycle | Flow 2: Payment→License | Flow 3: Metering Pipeline
 * Flow 4: Full Pipeline | Flow 5: Tier Upgrade
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createHmac } from 'node:crypto';

import { LicenseStore } from '../license/store.js';
import { LicenseGate } from '../license/gate.js';
import { LicenseAdmin } from '../license/admin.js';
import { verifyLicense } from '../license/verifier.js';
import { WebhookHandler } from '../payments/webhook-handler.js';
import { MeteringStore } from '../metering/store.js';
import { MeteringCollector } from '../metering/collector.js';
import { UsageLimiter } from '../metering/limiter.js';
import { ROICalculator, currentMonthPeriod } from '../analytics/roi-calculator.js';
import type { UsageEvent } from '../metering/types.js';

// ── helpers ───────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'e2e-test-secret-key';

function sign(body: string, id: string, ts: string): string {
  const content = `${id}.${ts}.${body}`;
  const hex = createHmac('sha256', WEBHOOK_SECRET).update(content).digest('hex');
  return `v1,${hex}`;
}

function checkoutPayload(email: string, productId: string, evtId: string): string {
  return JSON.stringify({
    type: 'checkout.completed',
    id: evtId,
    created_at: new Date().toISOString(),
    data: {
      id: `chk_${randomUUID()}`,
      status: 'succeeded',
      customer_email: email,
      customer_id: `cust_${randomUUID()}`,
      product_id: productId,
      amount: 9900,
      currency: 'usd',
    },
  });
}

function makeToolEvent(dir: string): UsageEvent {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: randomUUID(),
    category: 'tool_run',
    timestamp: `${today}T10:00:00.000Z`,
    resourceName: 'bash',
  };
}

// ── shared setup ──────────────────────────────────────────────────────────────

let tmpDir: string;

function makeAdmin() {
  return new LicenseAdmin(
    join(tmpDir, 'keys.json'),
    join(tmpDir, 'audit.jsonl'),
    'test-operator',
  );
}

function makeHandler() {
  return new WebhookHandler({
    secret: WEBHOOK_SECRET,
    registryPath: join(tmpDir, 'keys.json'),
    auditLogPath: join(tmpDir, 'audit.jsonl'),
    receiptStorePath: join(tmpDir, 'receipts.jsonl'),
  });
}

function makeStore() {
  return new MeteringStore(join(tmpDir, 'metering'));
}

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'mekong-e2e-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ── Flow 1: License Lifecycle ─────────────────────────────────────────────────

describe('Flow 1 — License Lifecycle', () => {
  it('generate key → save → verify → gate allows → deactivate', async () => {
    const admin = makeAdmin();
    const licPath = join(tmpDir, 'license.json');
    const store = new LicenseStore(licPath);
    const gate = new LicenseGate(store);

    // generate
    const created = await admin.createKey('pro', 'alice@example.com', 30);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const licKey = created.value;
    expect(licKey.key).toMatch(/^RAAS-PRO-/);
    expect(licKey.tier).toBe('pro');
    expect(licKey.status).toBe('active');

    // verify signature
    const verification = verifyLicense(licKey);
    expect(verification.valid).toBe(true);
    expect(verification.status).toBe('active');

    // save to user store → gate check
    await store.save(licKey);
    const validation = await gate.validate();
    expect(validation.ok).toBe(true);
    if (!validation.ok) return;
    expect(validation.value.tier).toBe('pro');
    expect(validation.value.valid).toBe(true);

    // gate grants pro command
    const access = await gate.canAccess('kaizen');
    expect(access.ok).toBe(true);

    // deactivate (revoke)
    const revoked = await admin.revokeKey(licKey.key);
    expect(revoked.ok).toBe(true);

    const keys = await admin.listKeys();
    expect(keys.ok).toBe(true);
    if (!keys.ok) return;
    const found = keys.value.find((k) => k.key === licKey.key);
    expect(found?.status).toBe('revoked');
  });

  it('expired key falls back to free tier in gate', async () => {
    const admin = makeAdmin();
    // create with 1-day expiry then manually set expired
    const created = await admin.createKey('starter', 'bob@example.com', 1);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // set expired expiry (recompute signature would be invalid, gate falls back to free)
    const expiredKey = { ...created.value, expiresAt: '2020-01-01T00:00:00.000Z' };
    const licPath = join(tmpDir, 'license.json');
    const store = new LicenseStore(licPath);
    await store.save(expiredKey as typeof created.value);

    const gate = new LicenseGate(store);
    const validation = await gate.validate();
    expect(validation.ok).toBe(true);
    if (!validation.ok) return;
    // expired and signature mismatch → invalid → free tier
    expect(validation.value.valid).toBe(false);
    expect(validation.value.tier).toBe('free');
  });

  it('rotate key preserves tier and creates new valid key', async () => {
    const admin = makeAdmin();
    const created = await admin.createKey('enterprise', 'carol@example.com', 60);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const rotated = await admin.rotateKey(created.value.key);
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;

    expect(rotated.value.tier).toBe('enterprise');
    expect(rotated.value.status).toBe('active');
    expect(rotated.value.key).not.toBe(created.value.key);

    // old key is revoked
    const keys = await admin.listKeys();
    if (!keys.ok) return;
    const old = keys.value.find((k) => k.key === created.value.key);
    expect(old?.status).toBe('revoked');
  });
});
